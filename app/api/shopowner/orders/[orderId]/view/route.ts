import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
}

interface OrderRow extends RowDataPacket {
  shop_id: number;
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

export async function POST(
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

    // Mark order as viewed
    await pool.query(
      `UPDATE orders SET viewed_by_seller = TRUE WHERE order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      message: 'Order marked as viewed'
    });

  } catch (error) {
    console.error('POST mark viewed error:', error);
    return NextResponse.json({ error: 'Failed to mark order as viewed' }, { status: 500 });
  }
}