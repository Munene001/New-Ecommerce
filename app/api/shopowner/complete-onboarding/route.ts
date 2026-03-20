import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-utlis';
import { getConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  let connection;

  try {
    // 1. Validate token
    const auth = await validateToken(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUser = auth.supabaseUser;

    // 2. Get internal user_id from MySQL
    connection = await getConnection();
    const [userRows] = await connection.query(
      `SELECT user_id, role FROM users WHERE supabase_uid = ?`,
      [supabaseUser.id]
    ) as any[];
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    const userId = userRows[0].user_id;
    const userRole = userRows[0].role;

    // 3. Optionally check role (shop_owner)
    if (userRole !== 'shop_owner') {
      return NextResponse.json({ success: false, error: 'Not a shop owner' }, { status: 403 });
    }

    // 4. Parse request body
    const { shop_type } = await request.json();
    if (!shop_type || !['retail', 'clothing', 'pharmacy', 'bookshop'].includes(shop_type)) {
      return NextResponse.json({ success: false, error: 'Invalid shop type' }, { status: 400 });
    }

    // 5. Get tenant
    const [tenantRows] = await connection.query(
      `SELECT tenant_id, business_name, business_slug
       FROM tenant
       WHERE user_id = ?`,
      [userId]
    ) as any[];
    if (tenantRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }
    const tenant = tenantRows[0];

    // 6. Create shop
    const [shopResult] = await connection.query(
      `INSERT INTO shops (tenant_id, shop_name, shop_slug, shop_type)
       VALUES (?, ?, ?, ?)`,
      [tenant.tenant_id, tenant.business_name, tenant.business_slug, shop_type]
    ) as any;
    const shopId = shopResult.insertId;
    const shopSlug = tenant.business_slug;

    return NextResponse.json({
      success: true,
      message: 'Shop created successfully',
      shopId,
      shopSlug,
      redirectTo: `/dashboard/${shopSlug}`,
    });
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create shop' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}