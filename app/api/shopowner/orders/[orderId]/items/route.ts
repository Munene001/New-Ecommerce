import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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
  variant_id: number | null;
  variant_name: string | null;
  variant_attributes: string | null;
}

async function getShopIdFromOrder(orderId: number): Promise<number | null> {
  const [rows] = await pool.query<OrderRow[]>(
    'SELECT shop_id FROM orders WHERE order_id = ?',
    [orderId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const [items] = await pool.query<OrderItemRow[]>(
      `SELECT 
        order_item_id, 
        product_id, 
        product_name, 
        quantity, 
        price_at_time,
        (quantity * price_at_time) as total_price,
        variant_id,
        variant_name,
        variant_attributes
       FROM order_items 
       WHERE order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      items: items.map(item => ({
        ...item,
        variant_attributes: item.variant_attributes ? JSON.parse(item.variant_attributes) : null
      })),
      count: items.length
    });

  } catch (error) {
    console.error('GET order items error:', error);
    return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
  }
}