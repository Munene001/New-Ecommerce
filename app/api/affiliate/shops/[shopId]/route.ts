import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId: shopIdParam } = await params;
    const shopId = parseInt(shopIdParam);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop ID' }, { status: 400 });
    }

    // Check authorization – affiliate passes if they have access to this shop
    const { authorized, response } = await verifyShopAccess(request, shopId);
    if (!authorized) return response;

    const [shopRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.shop_id, s.shop_name, s.shop_slug, s.shop_type, s.created_at, s.updated_at,
        t.tenant_id, t.business_name as tenant_name,
        u.email as owner_email, u.full_name as owner_name, u.phone as owner_phone,
        COALESCE(p.product_count, 0) as product_count
       FROM shops s
       JOIN tenant t ON s.tenant_id = t.tenant_id
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN (SELECT shop_id, COUNT(*) as product_count FROM products GROUP BY shop_id) p ON s.shop_id = p.shop_id
       WHERE s.shop_id = ?`,
      [shopId]
    );

    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shop: shopRows[0],
    });
  } catch (error) {
    console.error('GET affiliate shop error:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}