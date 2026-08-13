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
  delivery_fee: number;
  delivery_zone: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  customer_id: number | null;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user_id from internal users table
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT user_id FROM users WHERE supabase_uid = ?',
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userRows[0].user_id;
    const userEmail = user.email.toLowerCase().trim();

    // ✅ AUTO-CLAIM: Link any guest orders matching this user's email
    await pool.query(
      `UPDATE orders 
       SET customer_id = ? 
       WHERE customer_id IS NULL AND LOWER(TRIM(customer_email)) = ?`,
      [userId, userEmail]
    );

    // ✅ Fetch orders by customer_id OR matching email
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
        o.delivery_fee,
        o.delivery_zone,
        o.total,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        o.customer_id
      FROM orders o
      INNER JOIN shops s ON o.shop_id = s.shop_id
      WHERE o.customer_id = ? OR LOWER(TRIM(o.customer_email)) = ?
      ORDER BY o.created_at DESC`,
      [userId, userEmail]
    );

    // Convert numeric values to Number
    const formattedOrders = orders.map(order => {
      const subtotal = Number(order.subtotal) || 0;
      const deliveryFee = Number(order.delivery_fee) || 0;
      const total = Number(order.total) || subtotal + deliveryFee;

      return {
        order_id: order.order_id,
        order_number: order.order_number,
        shop_id: order.shop_id,
        shop_slug: order.shop_slug,
        shop_name: order.shop_name,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        delivery_zone: order.delivery_zone,
        total: total,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        created_at: order.created_at
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}