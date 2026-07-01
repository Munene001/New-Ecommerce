import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  customer_phone: string;
  customer_email: string;
}

interface OrderItemRow extends RowDataPacket {
  product_name: string;
  quantity: number;
  price_at_time: number;
  variant_id: number | null;
  variant_name: string | null;
  variant_attributes: string | null;
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

    const [orders] = await pool.query<OrderRow[]>(
      `SELECT 
        order_id, 
        order_number, 
        subtotal,
        payment_method,
        payment_status,
        order_status,
        customer_phone,
        customer_email
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

    const total_amount = order.subtotal;

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.order_id,
        order_number: order.order_number,
        total_amount: total_amount,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        items: items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.price_at_time,
          variant_id: item.variant_id,
          variant_name: item.variant_name,
          variant_attributes: item.variant_attributes 
            ? (typeof item.variant_attributes === 'string' 
                ? JSON.parse(item.variant_attributes) 
                : item.variant_attributes)
            : null
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