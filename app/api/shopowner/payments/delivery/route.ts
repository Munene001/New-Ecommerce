import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
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

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
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

// GET /api/payments/delivery?shop_id=1
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const body = await req.json();
    const { shop_id, tier_name, fee } = body;

    if (!shop_id || !tier_name || fee === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: shop_id, tier_name, fee' 
      }, { status: 400 });
    }

    if (fee < 0) {
      return NextResponse.json({ error: 'Fee cannot be negative' }, { status: 400 });
    }

    if (tier_name.length > 100) {
      return NextResponse.json({ error: 'Tier name must be less than 100 characters' }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(parseInt(shop_id), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert new delivery tier
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO delivery_tiers (shop_id, tier_name, fee)
       VALUES (?, ?, ?)`,
      [shop_id, tier_name, fee]
    );

    return NextResponse.json({
      success: true,
      message: 'Delivery tier created successfully',
      data: {
        tier_id: result.insertId,
        shop_id,
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