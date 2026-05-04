// app/api/shops/customers/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  shop_id: number;
  shop_slug: string;
  shop_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  special_instructions: string | null;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow extends RowDataPacket {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const customerEmail = user.email;
    
    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Fetch order details - verify it belongs to this customer
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT 
        o.order_id,
        o.order_number,
        o.shop_id,
        s.shop_slug,
        s.shop_name,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.customer_city,
        o.customer_address,
        o.special_instructions,
        o.subtotal,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        o.updated_at
      FROM orders o
      INNER JOIN shops s ON o.shop_id = s.shop_id
      WHERE o.order_id = ? AND o.customer_email = ?`,
      [orderId, customerEmail]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Fetch order items
    const [items] = await pool.query<OrderItemRow[]>(
      `SELECT 
        order_item_id,
        product_id,
        product_name,
        quantity,
        price_at_time
      FROM order_items
      WHERE order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order: {
        order_id: order.order_id,
        order_number: order.order_number,
        shop_id: order.shop_id,
        shop_slug: order.shop_slug,
        shop_name: order.shop_name,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_city: order.customer_city,
        customer_address: order.customer_address,
        special_instructions: order.special_instructions,
        subtotal: order.subtotal,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: items.map(item => ({
          order_item_id: item.order_item_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_at_time: item.price_at_time,
          total: item.quantity * item.price_at_time
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching customer order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}