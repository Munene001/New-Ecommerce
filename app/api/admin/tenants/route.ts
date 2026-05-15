// app/api/admin/tenants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { authorized, response } = await verifyAdminAccess(request);
    
    if (!authorized) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: (string | number)[] = [];

    if (status) {
      whereClause += ' AND t.account_status = ?';
      queryParams.push(status);
    }

    if (search) {
      whereClause += ' AND (t.business_name LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    const [tenants] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.tenant_id,
        t.business_name,
        t.business_slug,
        t.business_town,
        t.business_address,
        t.account_status,
        t.status_expiry_date,
        t.created_at,
        t.business_info_complete,
        u.email as owner_email,
        u.full_name as owner_name,
        u.phone as owner_phone,
        COUNT(s.shop_id) as total_shops
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN shops s ON t.tenant_id = s.tenant_id
       ${whereClause}
       GROUP BY t.tenant_id
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [statsResult] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_tenants,
        SUM(CASE WHEN t.account_status = 'free_trial' THEN 1 ELSE 0 END) as free_trial,
        SUM(CASE WHEN t.account_status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN t.account_status IN ('expired', 'suspended') THEN 1 ELSE 0 END) as expired_suspended
       FROM tenant t`
    );

    const stats = statsResult[0];

    return NextResponse.json({
      success: true,
      stats: {
        total_tenants: stats.total_tenants || 0,
        free_trial: stats.free_trial || 0,
        active: stats.active || 0,
        expired_suspended: stats.expired_suspended || 0
      },
      tenants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('GET tenants error:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}