import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface TierRow extends RowDataPacket {
  tier_id: number;
  shop_id: number;
  tier_name: string;
  fee: number;
}

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
}

// Helper to verify that the user owns the shop associated with this tier
async function verifyTierOwnership(tierId: number, supabaseUid: string): Promise<{ isOwner: boolean; shopId: number | null }> {
  const [rows] = await pool.query<OwnerCheckRow[]>(
    `SELECT 1
     FROM delivery_tiers dt
     JOIN shops s ON dt.shop_id = s.shop_id
     JOIN tenant t ON s.tenant_id = t.tenant_id
     JOIN users u ON t.user_id = u.user_id
     WHERE dt.tier_id = ? AND u.supabase_uid = ?
     LIMIT 1`,
    [tierId, supabaseUid]
  );
  
  const [tierRows] = await pool.query<TierRow[]>(
    `SELECT shop_id FROM delivery_tiers WHERE tier_id = ?`,
    [tierId]
  );
  
  return {
    isOwner: rows.length > 0,
    shopId: tierRows.length > 0 ? tierRows[0].shop_id : null
  };
}

// GET /api/shopowner/payments/delivery/5 - Get single tier
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tierId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { tierId } = await params;
    const tierIdNum = parseInt(tierId);
    if (isNaN(tierIdNum)) {
      return NextResponse.json({ error: 'Invalid tier ID' }, { status: 400 });
    }

    const { isOwner } = await verifyTierOwnership(tierIdNum, supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [tiers] = await pool.query<TierRow[]>(
      `SELECT tier_id, shop_id, tier_name, fee, created_at, updated_at
       FROM delivery_tiers
       WHERE tier_id = ?`,
      [tierIdNum]
    );

    if (tiers.length === 0) {
      return NextResponse.json({ error: 'Delivery tier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tiers[0]
    });
  } catch (error) {
    console.error('GET delivery tier error:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery tier' }, { status: 500 });
  }
}

// PUT /api/shopowner/payments/delivery/5 - Update a tier
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tierId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { tierId } = await params;
    const tierIdNum = parseInt(tierId);
    if (isNaN(tierIdNum)) {
      return NextResponse.json({ error: 'Invalid tier ID' }, { status: 400 });
    }

    const { isOwner } = await verifyTierOwnership(tierIdNum, supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { tier_name, fee } = body;

    if (!tier_name && fee === undefined) {
      return NextResponse.json({ 
        error: 'At least one field to update: tier_name or fee' 
      }, { status: 400 });
    }

    if (fee !== undefined && fee < 0) {
      return NextResponse.json({ error: 'Fee cannot be negative' }, { status: 400 });
    }

    if (tier_name && tier_name.length > 100) {
      return NextResponse.json({ error: 'Tier name must be less than 100 characters' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (tier_name) {
      updates.push('tier_name = ?');
      values.push(tier_name);
    }
    if (fee !== undefined) {
      updates.push('fee = ?');
      values.push(fee);
    }

    values.push(tierIdNum);
    const query = `UPDATE delivery_tiers SET ${updates.join(', ')} WHERE tier_id = ?`;

    try {
      const [result] = await pool.query<ResultSetHeader>(query, values);
      
      if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Delivery tier not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Delivery tier updated successfully'
      });
    } catch (error) {
      const mysqlError = error as { code?: string };
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ error: 'A tier with this name already exists for this shop' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('PUT delivery tier error:', error);
    return NextResponse.json({ error: 'Failed to update delivery tier' }, { status: 500 });
  }
}

// DELETE /api/shopowner/payments/delivery/5 - Delete a tier
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tierId: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { tierId } = await params;
    const tierIdNum = parseInt(tierId);
    if (isNaN(tierIdNum)) {
      return NextResponse.json({ error: 'Invalid tier ID' }, { status: 400 });
    }

    const { isOwner } = await verifyTierOwnership(tierIdNum, supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM delivery_tiers WHERE tier_id = ?',
      [tierIdNum]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Delivery tier not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery tier deleted successfully'
    });
  } catch (error) {
    console.error('DELETE delivery tier error:', error);
    return NextResponse.json({ error: 'Failed to delete delivery tier' }, { status: 500 });
  }
}