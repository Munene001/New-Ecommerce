import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface DeliveryTierRow extends RowDataPacket {
  tier_id: number;
  shop_id: number;
  tier_name: string;
  fee: number;
  created_at: string;
  updated_at: string;
}

// GET /api/payments/delivery?shop_id=1
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

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Fetch all delivery tiers for this shop
    const [tiers] = await pool.query<DeliveryTierRow[]>(
      `SELECT tier_id, shop_id, tier_name, fee, created_at, updated_at
       FROM delivery_tiers
       WHERE shop_id = ?
       ORDER BY fee ASC`,
      [shopId]
    );

    return NextResponse.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('GET delivery tiers error:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery tiers' }, { status: 500 });
  }
}

// POST /api/payments/delivery - Create a new delivery tier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop_id, tier_name, fee } = body;

    if (!shop_id || !tier_name || fee === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: shop_id, tier_name, fee' 
      }, { status: 400 });
    }

    const shopId = parseInt(shop_id, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    if (fee < 0) {
      return NextResponse.json({ error: 'Fee cannot be negative' }, { status: 400 });
    }

    if (tier_name.length > 100) {
      return NextResponse.json({ error: 'Tier name must be less than 100 characters' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Insert new delivery tier
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO delivery_tiers (shop_id, tier_name, fee)
       VALUES (?, ?, ?)`,
      [shopId, tier_name, fee]
    );

    return NextResponse.json({
      success: true,
      message: 'Delivery tier created successfully',
      data: {
        tier_id: result.insertId,
        shop_id: shopId,
        tier_name,
        fee
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST delivery tier error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A tier with this name already exists for this shop' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create delivery tier' }, { status: 500 });
  }
}