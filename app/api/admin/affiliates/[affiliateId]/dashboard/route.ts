import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ affiliateId: string }> }
) {
  const { authorized, response } = await verifyAdminAccess(req);
  if (!authorized) return response;

  const { affiliateId } = await params;
  const id = parseInt(affiliateId);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid affiliate ID' }, { status: 400 });
  }

  // 1. Affiliate info
  const [affRows] = await pool.query<RowDataPacket[]>(
    `SELECT a.affiliate_id, u.full_name, u.email, a.conversion_count, a.created_at
     FROM affiliate a
     JOIN users u ON a.user_id = u.user_id
     WHERE a.affiliate_id = ?`,
    [id]
  );
  if (affRows.length === 0) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
  }
  const affiliate = affRows[0];

  // 2. Tenants referred by this affiliate
  const [tenants] = await pool.query<RowDataPacket[]>(
    `SELECT 
       t.tenant_id, t.business_name, t.business_slug, t.account_status, t.created_at,
       u.email as owner_email, u.full_name as owner_name, u.phone as owner_phone,
       COUNT(s.shop_id) as total_shops
     FROM tenant t
     JOIN users u ON t.user_id = u.user_id
     LEFT JOIN shops s ON t.tenant_id = s.tenant_id
     WHERE t.affiliate_id = ?
     GROUP BY t.tenant_id
     ORDER BY t.created_at DESC`,
    [id]
  );

  // 3. Shops belonging to those tenants
  const [shops] = await pool.query<RowDataPacket[]>(
    `SELECT 
       s.shop_id, s.shop_name, s.shop_slug, s.shop_type, s.created_at,
       t.tenant_id, t.business_name as tenant_name,
       COALESCE(p.product_count, 0) as product_count
     FROM shops s
     JOIN tenant t ON s.tenant_id = t.tenant_id
     LEFT JOIN (SELECT shop_id, COUNT(*) as product_count FROM products GROUP BY shop_id) p ON s.shop_id = p.shop_id
     WHERE t.affiliate_id = ?
     ORDER BY s.created_at DESC`,
    [id]
  );

  return NextResponse.json({
    affiliate,
    tenants,
    shops,
  });
}