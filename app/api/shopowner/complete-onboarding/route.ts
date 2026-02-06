import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { shop_type } = await request.json();
    
    if (!shop_type || !['retail', 'clothing', 'pharmacy', 'bookshop'].includes(shop_type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid shop type' 
      }, { status: 400 });
    }

    connection = await getConnection();
    
    // Get user's tenant info
    const [tenantResult] = await connection.execute(
      `SELECT t.tenant_id, t.business_name, t.business_slug
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       WHERE u.supabase_uid = ?`,
      [user.id]
    ) as [any[], any];
    
    if (tenantResult.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tenant not found' 
      }, { status: 404 });
    }
    
    const tenant = tenantResult[0];
    
    // Create the shop (first shop inherits tenant's business slug)
    const [shopResult] = await connection.execute(
      `INSERT INTO shops (tenant_id, shop_name, shop_slug, shop_type) 
       VALUES (?, ?, ?, ?)`,
      [
        tenant.tenant_id,
        tenant.business_name,  // From tenant table
        tenant.business_slug,  // From tenant table (first shop inherits tenant slug)
        shop_type
      ]
    ) as any;
    
    const shopId = shopResult.insertId;
    
    // Note: First shop inherits tenant's business_slug
    // For additional shops in future, we would need to fetch the created shop
    // But for now, tenant.business_slug = shop.shop_slug by design
    const shopSlug = tenant.business_slug;
    
    return NextResponse.json({
      success: true,
      message: 'Shop created successfully',
      shopId: shopId,
      shopSlug: shopSlug,
      redirectTo: `/dashboard/${shopSlug}`  // Fixed: Use shopSlug variable
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