import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderRow extends RowDataPacket {
  shop_id: number;
}

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

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
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