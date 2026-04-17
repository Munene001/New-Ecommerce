import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
}

interface OrderRow extends RowDataPacket {
  order_id: number;
  shop_id: number;
}

interface OrderItemRow extends RowDataPacket {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
  total_price: number;
}

// Helper to verify that the user owns the shop
async function verifyShopOwnership(shopId: number, supabaseUid: string): Promise<boolean> {
  const [rows] = await pool.query<OwnerCheckRow[]>(
    `SELECT 1
     FROM shops s
     JOIN tenant t ON s.tenant_id = t.tenant_id
     JOIN users u ON t.user_id = u.user_id
     WHERE s.shop_id = ? AND u.supabase_uid = ?`,
    [shopId, supabaseUid]
  );
  return rows.length > 0;
}

// Helper to get shop_id from order
async function getShopIdFromOrder(orderId: number): Promise<number | null> {
  const [rows] = await pool.query<OrderRow[]>(
    'SELECT shop_id FROM orders WHERE order_id = ?',
    [orderId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

// GET /api/shopowner/orders/[orderId]/items
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get shop_id from order
    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(shopId, supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get order items
    const [items] = await pool.query<OrderItemRow[]>(
      `SELECT 
        order_item_id, 
        product_id, 
        product_name, 
        quantity, 
        price_at_time,
        (quantity * price_at_time) as total_price
       FROM order_items 
       WHERE order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      items,
      count: items.length
    });

  } catch (error) {
    console.error('GET order items error:', error);
    return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
  }
}