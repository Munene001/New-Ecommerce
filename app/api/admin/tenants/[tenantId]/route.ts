// app/api/admin/tenants/[tenantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { authorized, response } = await verifyAdminAccess(request);
    if (!authorized) return response;

    const { tenantId: tenantIdParam } = await params;
    const tenantId = parseInt(tenantIdParam);
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 });
    }

    const [tenantRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.*,
        u.email as owner_email,
        u.full_name as owner_name,
        u.phone as owner_phone
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       WHERE t.tenant_id = ?`,
      [tenantId]
    );

    if (tenantRows.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
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
    console.error('GET tenant error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { authorized, response } = await verifyAdminAccess(request);
    if (!authorized) return response;

    const { tenantId: tenantIdParam } = await params;
    const tenantId = parseInt(tenantIdParam);
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 });
    }

    const body = await request.json();
    const { business_name, business_town, business_address } = body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tenant 
       SET business_name = ?, business_town = ?, business_address = ?
       WHERE tenant_id = ?`,
      [business_name, business_town, business_address, tenantId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant updated successfully'
    });

  } catch (error) {
    console.error('PUT tenant error:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { authorized, response } = await verifyAdminAccess(request);
    if (!authorized) return response;

    const { tenantId: tenantIdParam } = await params;
    const tenantId = parseInt(tenantIdParam);
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 });
    }

    const body = await request.json();
    const { account_status } = body;

    if (!['free_trial', 'active', 'expired', 'suspended'].includes(account_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tenant SET account_status = ? WHERE tenant_id = ?`,
      [account_status, tenantId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('PATCH tenant error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { authorized, response } = await verifyAdminAccess(request);
    if (!authorized) return response;

    const { tenantId: tenantIdParam } = await params;
    const tenantId = parseInt(tenantIdParam);
    if (isNaN(tenantId)) {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM tenant WHERE tenant_id = ?',
      [tenantId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant and all associated shops deleted successfully'
    });

  } catch (error) {
    console.error('DELETE tenant error:', error);
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
  }
}