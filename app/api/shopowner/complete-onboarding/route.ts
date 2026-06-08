import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  user_id: number;
  role: string;
  email: string;
  phone: string;
}

interface TenantRow extends RowDataPacket {
  tenant_id: number;
  business_name: string;
  business_slug: string;
  business_town: string;
  business_address: string;
}

interface ShopInsertResult extends ResultSetHeader {
  insertId: number;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user from session cookie
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get internal user_id from MySQL using Supabase user ID
    const [userRows] = await pool.query<UserRow[]>(
      `SELECT user_id, role, email, phone FROM users WHERE supabase_uid = ?`,
      [user.id]
    );
    
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const userId = userRows[0].user_id;
    const userRole = userRows[0].role;
    const userEmail = userRows[0].email;
    const userPhone = userRows[0].phone;

    // 3. Optionally check role (shop_owner)
    if (userRole !== 'shop_owner') {
      return NextResponse.json({ success: false, error: 'Not a shop owner' }, { status: 403 });
    }

    // 4. Parse request body
    const { shop_type } = await request.json();
    if (!shop_type || !['retail', 'clothing', 'pharmacy', 'bookshop'].includes(shop_type)) {
      return NextResponse.json({ success: false, error: 'Invalid shop type' }, { status: 400 });
    }

    // 5. Get tenant (including town and address)
    const [tenantRows] = await pool.query<TenantRow[]>(
      `SELECT tenant_id, business_name, business_slug, business_town, business_address
       FROM tenant
       WHERE user_id = ?`,
      [userId]
    );
    
    if (tenantRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }
    
    const tenant = tenantRows[0];

    // 6. Create shop with contact info AND town/address from tenant
    const [shopResult] = await pool.query<ShopInsertResult>(
      `INSERT INTO shops (tenant_id, shop_name, shop_slug, shop_type, contact_email, contact_phone, business_town, business_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant.tenant_id,
        tenant.business_name,
        tenant.business_slug,
        shop_type,
        userEmail,
        userPhone,
        tenant.business_town,
        tenant.business_address
      ]
    );
    
    const shopId = shopResult.insertId;
    const shopSlug = tenant.business_slug;

    // 7. Create shop settings with defaults and whatsapp from user
    await pool.query<ResultSetHeader>(
      `INSERT INTO shop_settings 
       (shop_id, primary_color, secondary_color, whatsapp_number, product_card_style, cart_icon) 
       VALUES (?, '#000000', '#000000', ?, 'standard', 'cart')`,
      [shopId, userPhone]
    );

 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
fetch(`${baseUrl}/api/shops/shop-slugs`, { method: 'POST' }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Shop created successfully',
      shopId,
      shopSlug,
      redirectTo: `/dashboard/${shopSlug}`,
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create shop';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}