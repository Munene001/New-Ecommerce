import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

interface UserDataRow extends RowDataPacket {
  user_id: number;
  role: string;
  full_name: string;
  phone: string;
  tenant_id: number | null;
  business_info_complete: number | null;
  shop_slug: string | null;
  shop_id: number | null;
  shop_count: number;
}

export async function POST() {
  const requestId = Math.random().toString(36).substring(2, 9);
  
  
  

  try {
    // 1. Authenticate with Supabase
    
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error(`❌ [${requestId}] Supabase Auth Error:`, authError);
      return NextResponse.json(
        { success: false, error: 'Authentication failed', details: authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      console.warn(`⚠️ [${requestId}] Unauthorized access attempt: No active user found in session cookie.`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      )
    }

    const supabase_uid = user.id
    
    

    // 2. Query MySQL Database
    
    const startTime = Date.now();

    const [userResult] = await pool.execute<UserDataRow[]>(
      `SELECT 
        u.user_id,
        u.role,
        u.full_name,
        u.phone,
        t.tenant_id,
        t.business_info_complete,
        s.shop_slug,
        s.shop_id,
        (SELECT COUNT(*) FROM shops WHERE tenant_id = t.tenant_id) as shop_count
       FROM users u 
       LEFT JOIN tenant t ON u.user_id = t.user_id 
       LEFT JOIN shops s ON t.tenant_id = s.tenant_id AND s.shop_id = (
         SELECT MIN(shop_id) FROM shops WHERE tenant_id = t.tenant_id
       )
       WHERE u.supabase_uid = ?`,
      [supabase_uid]
    );

    const queryDuration = Date.now() - startTime;
    
    

    if (userResult.length === 0) {
      console.warn(`⚠️ [${requestId}] User with supabase_uid ${supabase_uid} not found in MySQL 'users' table.`);
      
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    const userData = userResult[0];
    console.log(`👤 [${requestId}] Retrieved User Row:`, {
      user_id: userData.user_id,
      role: userData.role,
      full_name: userData.full_name,
      tenant_id: userData.tenant_id,
      shop_slug: userData.shop_slug,
      shop_count: userData.shop_count,
    });

    const onboardingComplete = Boolean(
      userData.business_info_complete && Number(userData.shop_count) > 0
    );

    const responsePayload = {
      success: true,
      role: userData.role,
      fullName: userData.full_name,
      phone: userData.phone,
      onboardingComplete: onboardingComplete,
      hasShop: Number(userData.shop_count) > 0,
      tenantId: userData.tenant_id,
      shopSlug: userData.shop_slug,
      shopId: userData.shop_id
    };

    
    

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error(`💥 [${requestId}] FATAL API ROUTE CRASH:`, error);
    console.error(`Stack trace:`, error.stack);
    

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}