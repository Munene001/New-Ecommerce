// app/api/auth/user-info/route.ts
import { NextResponse } from 'next/server'
import { getConnection } from '@/lib/db'

export async function POST(request: Request) {
  let connection
  
  try {
    const { supabase_uid } = await request.json();
    
    if (!supabase_uid) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }
    
    connection = await getConnection();
    
    // Get user info with their FIRST shop (for dashboard redirect)
    const [userResult] = await connection.execute(
      `SELECT 
        u.user_id,
        u.role,
        u.full_name,
        t.tenant_id,
        t.business_info_complete,
        s.shop_slug,
        s.shop_id,
        COUNT(s2.shop_id) as shop_count
       FROM users u 
       LEFT JOIN tenant t ON u.user_id = t.user_id 
       LEFT JOIN shops s ON t.tenant_id = s.tenant_id AND s.shop_id = (
         SELECT MIN(shop_id) FROM shops WHERE tenant_id = t.tenant_id
       )
       LEFT JOIN shops s2 ON t.tenant_id = s2.tenant_id
       WHERE u.supabase_uid = ?
       GROUP BY u.user_id, t.tenant_id, s.shop_slug, s.shop_id`,
      [supabase_uid]
    ) as [any[], any];
    
    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userResult[0];
    
    // Onboarding complete if: business_info_complete AND has at least one shop
    const onboardingComplete = Boolean(
      userData.business_info_complete && userData.shop_count > 0
    );
    
    return NextResponse.json({
      success: true,
      role: userData.role,
      fullName: userData.full_name,
      onboardingComplete: onboardingComplete,
      hasShop: userData.shop_count > 0,
      tenantId: userData.tenant_id,
      shopSlug: userData.shop_slug, // Add this for dashboard redirect
      shopId: userData.shop_id
    });
    
  } catch (error) {
    console.error('User info error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}