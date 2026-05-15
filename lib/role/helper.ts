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

export async function verifyShopAccess(request: Request, shopId: number) {
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
  
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT role FROM users WHERE supabase_uid = ?',
    [user.id]
  );
  const userRole = userRows[0]?.role || null;
  
  if (!isShopOwnerOrAdmin(userRole)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      shopId: null,
      user: null,
      role: null 
    };
  }
  
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
  
  return { 
    authorized: true, 
    response: undefined,
    shopId: shopId,
    user: user,
    role: userRole 
  };
}

export async function verifyAdminAccess(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
      role: null 
    };
  }
  
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT role FROM users WHERE supabase_uid = ?',
    [user.id]
  );
  const userRole = userRows[0]?.role || null;
  
  if (!isSuperAdmin(userRole)) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
      role: null 
    };
  }
  
  return { 
    authorized: true, 
    response: undefined,
    user: user,
    role: userRole 
  };
}