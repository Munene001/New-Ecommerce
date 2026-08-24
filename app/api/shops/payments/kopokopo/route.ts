// app/api/shops/payments/kopokopo/route.ts
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

interface KopokopoConfigRow extends RowDataPacket {
  client_id: string;
  client_secret: string;
  till_number: string;
  webhook_secret: string | null;
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
  console.log('🔵 [KOPOKOPO] Initiate Kopokopo STK Push request received');
  
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
        { success: false, error: 'Invalid Kenyan phone number format. Use 07XX... or 01XX...' },
        { status: 400 }
      );
    }

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

    if (order.payment_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Order is already ${order.payment_status}` },
        { status: 400 }
      );
    }

    const [configs] = await pool.query<KopokopoConfigRow[]>(
      `SELECT client_id, client_secret, till_number, webhook_secret
       FROM shop_kopokopo k
       JOIN shop_payment_settings p ON k.payment_setting_id = p.payment_setting_id
       WHERE p.shop_id = ?`,
      [order.shop_id]
    );

    if (configs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Kopokopo is not configured for this shop' },
        { status: 400 }
      );
    }

    const kopokopoConfig = configs[0];
    const springBootUrl = process.env.SPRING_BOOT_URL || 'http://localhost:8081';
    
    const totalAmount = Math.round(Number(order.total) || 0);
    
    const springBootResponse = await fetch(`${springBootUrl}/api/payments/kopokopo-stk-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.INTERNAL_API_KEY && { 'X-Internal-Api-Key': process.env.INTERNAL_API_KEY }),
      },
      body: JSON.stringify({
        clientId: kopokopoConfig.client_id,
        clientSecret: kopokopoConfig.client_secret,
        tillNumber: kopokopoConfig.till_number,
        amount: totalAmount,
        phoneNumber: formattedPhone,
        orderReference: order.order_number,
        webhookSecret: kopokopoConfig.webhook_secret || undefined,
      }),
    });

    const data = await springBootResponse.json();

    if (!springBootResponse.ok) {
      console.error('❌ [KOPOKOPO] Spring Boot error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Payment gateway failed to send STK prompt' },
        { status: springBootResponse.status }
      );
    }

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
      data: {
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        responseCode: data.ResponseCode,
        responseDescription: data.ResponseDescription,
        message: 'STK Push sent successfully. Check your phone for the M-Pesa prompt.',
      },
    });

  } catch (error) {
    console.error('❌ [KOPOKOPO] Initiate Kopokopo STK Push error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment process' },
      { status: 500 }
    );
  }
}