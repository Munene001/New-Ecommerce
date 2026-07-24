import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ShopRow extends RowDataPacket {
  delivery_enabled: number;
}

// PUT /api/shopowner/payments/delivery/toggle - Toggle delivery on/off
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop_id, enabled } = body;

    if (!shop_id) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    if (enabled === undefined || ![0, 1].includes(enabled)) {
      return NextResponse.json({ error: 'enabled must be 0 or 1' }, { status: 400 });
    }

    const shopId = parseInt(shop_id, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    // Verify access
    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    // Update delivery_enabled
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE shops SET delivery_enabled = ? WHERE shop_id = ?',
      [enabled, shopId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Delivery ${enabled === 1 ? 'enabled' : 'disabled'} successfully`,
      data: { delivery_enabled: enabled }
    });
  } catch (error) {
    console.error('Toggle delivery error:', error);
    return NextResponse.json({ error: 'Failed to toggle delivery' }, { status: 500 });
  }
}

// GET /api/shopowner/payments/delivery/toggle?shop_id=1 - Get current delivery status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shop_id');

    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    // Verify access
    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    const [shop] = await pool.query<ShopRow[]>(
      'SELECT delivery_enabled FROM shops WHERE shop_id = ?',
      [shopId]
    );

    if (shop.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { delivery_enabled: shop[0].delivery_enabled }
    });
  } catch (error) {
    console.error('Get delivery status error:', error);
    return NextResponse.json({ error: 'Failed to get delivery status' }, { status: 500 });
  }
}