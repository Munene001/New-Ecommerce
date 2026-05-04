// app/api/shops/customers/orders/route.ts
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
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
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

    const customerEmail = user.email;
    
    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Fetch all orders for this customer email
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
        o.subtotal,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at
      FROM orders o
      INNER JOIN shops s ON o.shop_id = s.shop_id
      WHERE o.customer_email = ?
      ORDER BY o.created_at DESC`,
      [customerEmail]
    );

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        order_id: order.order_id,
        order_number: order.order_number,
        shop_id: order.shop_id,
        shop_slug: order.shop_slug,
        shop_name: order.shop_name,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        subtotal: order.subtotal,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}