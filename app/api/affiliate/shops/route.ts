import { NextRequest, NextResponse } from 'next/server';
import { verifyAffiliateAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { authorized, affiliateId, response } = await verifyAffiliateAccess(request);
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const shopType = searchParams.get('shopType');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.affiliate_id = ?';
    const queryParams: (string | number)[] = [affiliateId];

    if (tenantId) {
      whereClause += ' AND s.tenant_id = ?';
      queryParams.push(parseInt(tenantId));
    }
    if (shopType) {
      whereClause += ' AND s.shop_type = ?';
      queryParams.push(shopType);
    }
    if (search) {
      whereClause += ' AND (s.shop_name LIKE ? OR s.shop_slug LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM shops s JOIN tenant t ON s.tenant_id = t.tenant_id ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    const [shops] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.shop_id, s.shop_name, s.shop_slug, s.shop_type, s.created_at,
        t.tenant_id, t.business_name as tenant_name,
        COALESCE(p.product_count, 0) as product_count
       FROM shops s
       JOIN tenant t ON s.tenant_id = t.tenant_id
       LEFT JOIN (SELECT shop_id, COUNT(*) as product_count FROM products GROUP BY shop_id) p ON s.shop_id = p.shop_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT shop_type FROM shops s2 JOIN tenant t2 ON s2.tenant_id = t2.tenant_id WHERE t2.affiliate_id = ? GROUP BY shop_type ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_type,
        (SELECT COUNT(*) FROM shops s2 JOIN tenant t2 ON s2.tenant_id = t2.tenant_id WHERE t2.affiliate_id = ? GROUP BY shop_type ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_count,
        (SELECT shop_type FROM shops s2 JOIN tenant t2 ON s2.tenant_id = t2.tenant_id WHERE t2.affiliate_id = ? GROUP BY shop_type ORDER BY COUNT(*) ASC LIMIT 1) as least_popular_type,
        (SELECT COUNT(*) FROM shops s2 JOIN tenant t2 ON s2.tenant_id = t2.tenant_id WHERE t2.affiliate_id = ? GROUP BY shop_type ORDER BY COUNT(*) ASC LIMIT 1) as least_popular_count,
        (SELECT COUNT(*) FROM shops s2 JOIN tenant t2 ON s2.tenant_id = t2.tenant_id WHERE t2.affiliate_id = ?) as total_shops,
        (SELECT COUNT(*) FROM shops s2 JOIN tenant t2 ON s2.tenant_id = t2.tenant_id WHERE t2.affiliate_id = ? AND s2.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) as recently_created
      `,
      [affiliateId, affiliateId, affiliateId, affiliateId, affiliateId, affiliateId]
    );
    const stats = statsRows[0];

    return NextResponse.json({
      success: true,
      stats: {
        most_popular_type: stats.most_popular_type || 'N/A',
        most_popular_count: stats.most_popular_count || 0,
        least_popular_type: stats.least_popular_type || 'N/A',
        least_popular_count: stats.least_popular_count || 0,
        total_shops: stats.total_shops || 0,
        recently_created: stats.recently_created || 0,
      },
      shops,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('GET affiliate shops error:', error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}