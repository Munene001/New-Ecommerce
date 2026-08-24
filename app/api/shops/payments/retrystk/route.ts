// app/api/shops/payments/retry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getOrderAccess } from '@/lib/auth/order-access';

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  total: number;
  shop_id: number;
  payment_status: string;
  customer_phone: string;
  customer_id: number | null;
}

interface PaymentSettingsRow extends RowDataPacket {
  payment_setting_id: number;
  active_payment_type: 'direct_mpesa' | 'stk_push' | 'kopokopo' | null;
}

interface StkConfigRow extends RowDataPacket {
  type: 'paybill' | 'till';
  shortcode: string;
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  business_number: string | null;
  till_number: string | null;
  account_number: string | null;
}

interface KopokopoConfigRow extends RowDataPacket {
  client_id: string;
  client_secret: string;
  till_number: string;
  webhook_secret: string | null;
}

interface TransactionRow extends RowDataPacket {
  transaction_id: number;
  retryable: number;
  status: string;
}

function normalizeKenyanPhone(phone: string): string | null {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  
  if (/^254(7|1)\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export async function POST(req: NextRequest) {
  console.log('🔁 [RETRY] Retry STK Push request received');
  
  try {
    const body = await req.json();
    const { orderId, phoneNumber } = body;

    if (!orderId || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'orderId and phoneNumber are required' },
        { status: 400 }
      );
    }

    const formattedPhone = normalizeKenyanPhone(String(phoneNumber));
    if (!formattedPhone) {
      return NextResponse.json(
        { success: false, error: 'Invalid Kenyan phone number format.' },
        { status: 400 }
      );
    }

    // Get order
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT order_id, order_number, total, shop_id, payment_status, customer_phone, customer_id
       FROM orders 
       WHERE order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Verify user authorization
    const { granted, error: authError } = await getOrderAccess(
      req,
      orderId,
      order.customer_id
    );

    if (!granted) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized access to order' },
        { status: 401 }
      );
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Check last transaction retryability
    const [transactions] = await pool.query<TransactionRow[]>(
      `SELECT transaction_id, retryable, status
       FROM stk_push_transactions 
       WHERE order_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [orderId]
    );

    if (transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No existing transaction found to retry' },
        { status: 400 }
      );
    }

    const lastTransaction = transactions[0];

    if (lastTransaction.retryable !== 1) {
      return NextResponse.json(
        { success: false, error: 'This transaction cannot be retried at this time' },
        { status: 400 }
      );
    }

    // Get active payment setting
    const [paymentSettings] = await pool.query<PaymentSettingsRow[]>(
      `SELECT payment_setting_id, active_payment_type 
       FROM shop_payment_settings 
       WHERE shop_id = ?`,
      [order.shop_id]
    );

    if (paymentSettings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No payment settings found for this shop' },
        { status: 400 }
      );
    }

    const activePaymentType = paymentSettings[0].active_payment_type;
    const paymentSettingId = paymentSettings[0].payment_setting_id;

    if (!activePaymentType || activePaymentType === 'direct_mpesa') {
      return NextResponse.json(
        { success: false, error: 'No active STK Push payment method configured' },
        { status: 400 }
      );
    }

    const springBootUrl = process.env.SPRING_BOOT_URL || 'http://localhost:8081';
    const totalAmount = Math.round(Number(order.total) || 0);
    
    let springEndpoint = '';
    let springBootPayload: any = {};

    // Configure payload based on provider
    if (activePaymentType === 'stk_push') {
      console.log('🔁 [RETRY] Building Safaricom STK Push payload');

      const [configs] = await pool.query<StkConfigRow[]>(
        `SELECT type, shortcode, consumer_key, consumer_secret, passkey, 
                business_number, till_number, account_number
         FROM shop_stk_push
         WHERE payment_setting_id = ?`,
        [paymentSettingId]
      );

      if (configs.length === 0) {
        return NextResponse.json(
          { success: false, error: 'STK Push not configured for this shop' },
          { status: 400 }
        );
      }

      const stkConfig = configs[0];
      springEndpoint = '/api/payments/stk-push';
      springBootPayload = {
        type: stkConfig.type,
        shortcode: stkConfig.shortcode,
        consumerKey: stkConfig.consumer_key,
        consumerSecret: stkConfig.consumer_secret,
        passkey: stkConfig.passkey,
        amount: totalAmount,
        phoneNumber: formattedPhone,
        orderReference: order.order_number,
        businessNumber: stkConfig.business_number || undefined,
        tillNumber: stkConfig.till_number || undefined,
        accountNumber: stkConfig.account_number || undefined,
      };

    } else if (activePaymentType === 'kopokopo') {
      console.log('🔁 [RETRY] Building Kopo Kopo STK Push payload');

      const [configs] = await pool.query<KopokopoConfigRow[]>(
        `SELECT client_id, client_secret, till_number, webhook_secret
         FROM shop_kopokopo
         WHERE payment_setting_id = ?`,
        [paymentSettingId]
      );

      if (configs.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Kopo Kopo not configured for this shop' },
          { status: 400 }
        );
      }

      const kopokopoConfig = configs[0];
      springEndpoint = '/api/payments/kopokopo-stk-push';
      springBootPayload = {
        clientId: kopokopoConfig.client_id,
        clientSecret: kopokopoConfig.client_secret,
        tillNumber: kopokopoConfig.till_number,
        amount: totalAmount,
        phoneNumber: formattedPhone,
        orderReference: order.order_number,
        webhookSecret: kopokopoConfig.webhook_secret || undefined,
      };
    }

    // Invalidate retry flag on previous transaction to prevent double invocation
    await pool.query(
      `UPDATE stk_push_transactions SET retryable = 0 WHERE transaction_id = ?`,
      [lastTransaction.transaction_id]
    );

    // Reset payment_status on order to pending
    await pool.query(
      `UPDATE orders SET payment_status = 'pending', updated_at = NOW() WHERE order_id = ?`,
      [orderId]
    );

    // Dispatch request to Spring Boot gateway
    const response = await fetch(`${springBootUrl}${springEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTERNAL_API_KEY && { 'X-Internal-Api-Key': process.env.INTERNAL_API_KEY }),
      },
      body: JSON.stringify(springBootPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [RETRY] Spring Boot gateway error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Payment gateway retry failed' },
        { status: response.status }
      );
    }

    const checkoutRequestId = data.CheckoutRequestID || data.resourceId || data.id;
    const merchantRequestId = data.MerchantRequestID || '';

    if (!checkoutRequestId) {
      console.error('❌ [RETRY] Gateway response missing request ID:', data);
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from payment gateway' },
        { status: 502 }
      );
    }

    // Persist new transaction record
    await pool.query(
      `INSERT INTO stk_push_transactions 
       (order_id, checkout_request_id, merchant_request_id, phone_number, amount, status, retryable)
       VALUES (?, ?, ?, ?, ?, 'pending', 1)`,
      [
        order.order_id,
        checkoutRequestId,
        merchantRequestId,
        formattedPhone,
        totalAmount
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Retry initiated successfully. Check your phone for the M-Pesa prompt.',
      data: {
        checkoutRequestId,
        merchantRequestId,
        responseCode: data.ResponseCode || '0',
        responseDescription: data.ResponseDescription || 'Success',
      },
    });

  } catch (error) {
    console.error('❌ [RETRY] Critical STK Push retry failure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process retry payment' },
      { status: 500 }
    );
  }
}