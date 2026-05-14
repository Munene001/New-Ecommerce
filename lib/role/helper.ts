// lib/role/helper.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export function isShopOwnerOrAdmin(role: string | null): boolean {
  return role === 'shop_owner' || role === 'super_admin';
}

export function isSuperAdmin(role: string | null): boolean {
  return role === 'super_admin';
}

// PRIMARY HELPER: For APIs that need shop access via shop_id
export async function verifyShopAccess(request: Request, shopId: number) {
  // 1. Authenticate user
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      shopId: null,
      user: null,
      role: null 
    };
  }
  
  // 2. Verify shop exists
  const [shopRows] = await pool.query<RowDataPacket[]>(
    'SELECT shop_id FROM shops WHERE shop_id = ?',
    [shopId]
  );
  
  if (shopRows.length === 0) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Shop not found' }, { status: 404 }),
      shopId: null,
      user: null,
      role: null 
    };
  }
  
  // 3. Get user role
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT role FROM users WHERE supabase_uid = ?',
    [user.id]
  );
  const userRole = userRows[0]?.role || null;
  
  // 4. Check if user has shop owner or admin role
  if (!isShopOwnerOrAdmin(userRole)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      shopId: null,
      user: null,
      role: null 
    };
  }
  
  // 5. For non-admins, verify they own this specific shop
  if (!isSuperAdmin(userRole)) {
    const [ownerCheck] = await pool.query<RowDataPacket[]>(
      `SELECT 1
       FROM shops s
       JOIN tenant t ON s.tenant_id = t.tenant_id
       JOIN users u ON t.user_id = u.user_id
       WHERE s.shop_id = ? AND u.supabase_uid = ?`,
      [shopId, user.id]
    );
    
    if (ownerCheck.length === 0) {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        shopId: null,
        user: null,
        role: null 
      };
    }
  }
  
  // All checks passed
  return { 
    authorized: true, 
    response: null,
    shopId: shopId,
    user: user,
    role: userRole 
  };
}