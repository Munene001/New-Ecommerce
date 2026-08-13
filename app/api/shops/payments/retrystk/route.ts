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
  ('🔁 [RETRY] Retry STK Push request received');
  
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

    // Consolidated single order query pass
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

    // Fetch STK configuration
    const [configs] = await pool.query<StkConfigRow[]>(
      `SELECT s.type, s.shortcode, s.consumer_key, s.consumer_secret, 
              s.passkey, s.business_number, s.till_number, s.account_number
       FROM shop_stk_push s
       JOIN shop_payment_settings p ON s.payment_setting_id = p.payment_setting_id
       WHERE p.shop_id = ?`,
      [order.shop_id]
    );

    if (configs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'STK Push not configured for this shop' },
        { status: 400 }
      );
    }

    const stkConfig = configs[0];

    // Reset payment_status to pending if it was set to failed or cancelled
    await pool.query(
      `UPDATE orders 
       SET payment_status = 'pending',
           updated_at = NOW()
       WHERE order_id = ?`,
      [orderId]
    );

    const springBootUrl = process.env.SPRING_BOOT_URL || 'http://localhost:8081';
    const totalAmount = Math.round(Number(order.total) || 0);
    
    const springBootResponse = await fetch(`${springBootUrl}/api/payments/stk-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTERNAL_API_KEY && { 'X-Internal-Api-Key': process.env.INTERNAL_API_KEY }),
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await springBootResponse.json();

    if (!springBootResponse.ok) {
      console.error('❌ [RETRY] Spring Boot error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Payment gateway retry failed' },
        { status: springBootResponse.status }
      );
    }

    // Save new retry transaction record
    await pool.query(
      `INSERT INTO stk_push_transactions 
       (order_id, checkout_request_id, merchant_request_id, phone_number, amount, status, retryable)
       VALUES (?, ?, ?, ?, ?, 'pending', 1)`,
      [
        order.order_id,
        data.CheckoutRequestID,
        data.MerchantRequestID || '',
        formattedPhone,
        totalAmount
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Retry initiated successfully. Check your phone for the M-Pesa prompt.',
      data: {
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
      },
    });

  } catch (error) {
    console.error('❌ [RETRY] Retry STK Push error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process retry payment' },
      { status: 500 }
    );
  }
}