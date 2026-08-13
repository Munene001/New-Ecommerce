// app/api/shops/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getOrderAccess } from '@/lib/auth/order-access';

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  delivery_zone: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  customer_phone: string;
  customer_email: string;
  customer_id: number | null;
  retryable?: number;
  result_code?: number;
  result_description?: string;
  transaction_status?: string;
}

interface OrderItemRow extends RowDataPacket {
  product_name: string;
  quantity: number;
  price_at_time: number;
  variant_id: number | null;
  variant_name: string | null;
  variant_attributes: string | null;
}

// ✅ NEW: Safe parser for variant attributes
function safeParseVariantAttributes(value: string | null): any {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      console.error('Failed to parse variant_attributes:', value);
      return null;
    }
  }
  return value;
}

// ✅ NEW: Normalize helper
function normalizeId(id: any): number | null {
  if (id === null || id === undefined) return null;
  const num = Number(id);
  return isNaN(num) ? null : num;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // First, check if order exists and get customer_id for auth check
    const [orderCheck] = await pool.query<OrderRow[]>(
      `SELECT customer_id FROM orders WHERE order_id = ?`,
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
      `SELECT 
        o.order_id, 
        o.order_number, 
        o.subtotal,
        o.delivery_fee,
        o.delivery_zone,
        o.total,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.customer_phone,
        o.customer_email,
        o.customer_id,
        t.retryable,
        t.result_code,
        t.result_description,
        t.status as transaction_status
      FROM orders o
      LEFT JOIN stk_push_transactions t ON o.order_id = t.order_id
      WHERE o.order_id = ?
      ORDER BY t.created_at DESC
      LIMIT 1`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    const [items] = await pool.query<OrderItemRow[]>(
      `SELECT 
        product_name, 
        quantity, 
        price_at_time,
        variant_id,
        variant_name,
        variant_attributes
      FROM order_items 
      WHERE order_id = ?`,
      [orderId]
    );

    let displayMessage = null;
    const isRetryable = order.retryable === 1;
    
    if (isRetryable && order.payment_status === 'pending') {
      const messages: Record<number, string> = {
        1032: 'You cancelled the payment. Please try again.',
        1: 'Insufficient funds. Please top up and try again.',
        2001: 'Wrong PIN entered. Please try again.',
        1037: 'Transaction timed out. Please try again.'
      };
      displayMessage = order.result_code ? messages[order.result_code] : 'Payment failed. Please try again.';
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: Number(order.order_id),
        order_number: order.order_number,
        subtotal: Number(order.subtotal) || 0,
        delivery_fee: Number(order.delivery_fee) || 0,
        delivery_zone: order.delivery_zone,
        total_amount: Number(order.total) || Number(order.subtotal) + Number(order.delivery_fee),
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        retryable: isRetryable,
        displayMessage: displayMessage,
        transaction_status: order.transaction_status || null,
        items: items.map(item => ({
          name: item.product_name,
          quantity: Number(item.quantity),
          price: Number(item.price_at_time) || 0,
          variant_id: normalizeId(item.variant_id), // ✅ Normalize
          variant_name: item.variant_name,
          variant_attributes: safeParseVariantAttributes(item.variant_attributes) // ✅ Safe parse
        }))
      }
    });

  } catch (error) {
    console.error('GET public order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}