// app/api/shops/payments/stk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, phoneNumber } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'phoneNumber is required' },
        { status: 400 }
      );
    }

    // Check if order exists and get customer_id for auth
    const [orderCheck] = await pool.query<OrderRow[]>(
      `SELECT order_id, customer_id FROM orders WHERE order_id = ?`,
      [orderId]
    );

    if (orderCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify access
    const { granted, error } = await getOrderAccess(
      req,
      orderId,
      orderCheck[0].customer_id
    );

    if (!granted) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const [orders] = await pool.query<OrderRow[]>(
      `SELECT order_id, order_number, total, shop_id, payment_status, customer_phone
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

    if (order.payment_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Order is already ${order.payment_status}` },
        { status: 400 }
      );
    }

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

    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    const springBootUrl = process.env.SPRING_BOOT_URL || 'http://localhost:8081';
    // ✅ FIX: Convert order.total to Number
    const totalAmount = Number(order.total) || 0;
    
    const springBootResponse = await fetch(`${springBootUrl}/api/payments/stk-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      console.error('Spring Boot error:', data);
      return NextResponse.json(
        { success: false, error: data.error || 'Payment service error' },
        { status: springBootResponse.status }
      );
    }

    await pool.query(
      `INSERT INTO stk_push_transactions 
       (order_id, checkout_request_id, merchant_request_id, phone_number, amount, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
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
    console.error('Initiate STK Push error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}