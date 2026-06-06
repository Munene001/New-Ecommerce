// app/api/affiliate/tenants/[tenantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAffiliateAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { authorized, affiliateId, response } = await verifyAffiliateAccess(request);
    if (!authorized) return response;

    const { tenantId: tenantIdParam } = await params;
    const tenantId = parseInt(tenantIdParam);
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 });
    }

    // Ensure tenant belongs to this affiliate
    const [tenantRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.*,
        u.email as owner_email,
        u.full_name as owner_name,
        u.phone as owner_phone
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       WHERE t.tenant_id = ? AND t.affiliate_id = ?`,
      [tenantId, affiliateId]
    );

    if (tenantRows.length === 0) {
      return NextResponse.json({ error: 'Tenant not found or not associated with you' }, { status: 404 });
    }

    const [shops] = await pool.query<RowDataPacket[]>(
      `SELECT shop_id, shop_name, shop_slug, shop_type, created_at
       FROM shops
       WHERE tenant_id = ?`,
      [tenantId]
    );

    return NextResponse.json({
      success: true,
      tenant: tenantRows[0],
      shops
    });

  } catch (error) {
    console.error('GET affiliate tenant error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { authorized, affiliateId, response } = await verifyAffiliateAccess(request);
    if (!authorized) return response;

    const { tenantId: tenantIdParam } = await params;
    const tenantId = parseInt(tenantIdParam);
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 });
    }

    // First, check ownership
    const [checkRows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM tenant WHERE tenant_id = ? AND affiliate_id = ?`,
      [tenantId, affiliateId]
    );
    if (checkRows.length === 0) {
      return NextResponse.json({ error: 'Tenant not found or not associated with you' }, { status: 404 });
    }

    const body = await request.json();
    const { business_name, business_town, business_address } = body;

    if (!business_name || !business_town || !business_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tenant 
       SET business_name = ?, business_town = ?, business_address = ?
       WHERE tenant_id = ?`,
      [business_name, business_town, business_address, tenantId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant updated successfully'
    });

  } catch (error) {
    console.error('PUT affiliate tenant error:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}