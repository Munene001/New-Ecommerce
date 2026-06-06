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
  
  // Fetch user_id and role
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT user_id, role FROM users WHERE supabase_uid = ?',
    [user.id]
  );
  if (userRows.length === 0) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      shopId: null,
      user: null,
      role: null 
    };
  }
  const dbUserId = userRows[0].user_id;
  const userRole = userRows[0].role;

  // 1. Affiliate access check
  if (userRole === 'affiliate') {
    const [affiliateCheck] = await pool.query<RowDataPacket[]>(
      `SELECT 1
       FROM affiliate a
       JOIN tenant t ON a.affiliate_id = t.affiliate_id
       JOIN shops s ON t.tenant_id = s.tenant_id
       WHERE a.user_id = ? AND s.shop_id = ?`,
      [dbUserId, shopId]
    );
    if (affiliateCheck.length > 0) {
      return { 
        authorized: true, 
        response: undefined,
        shopId: shopId,
        user: user,
        role: userRole 
      };
    }
    // Fall through to forbidden if no match
  }

  // 2. Shop owner or admin check
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

// New: verify affiliate dashboard access (affiliate or super admin)
export async function verifyAffiliateAccess(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      affiliateId: null,
      role: null 
    };
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.role, a.affiliate_id 
     FROM users u 
     LEFT JOIN affiliate a ON u.user_id = a.user_id 
     WHERE u.supabase_uid = ?`,
    [user.id]
  );
  if (rows.length === 0) {
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'User not found' }, { status: 404 }),
      affiliateId: null,
      role: null 
    };
  }

  const role = rows[0].role;
  const affiliateId = rows[0].affiliate_id;

  // Super admin always has access (can view all affiliates)
  if (role === 'super_admin') {
    return { 
      authorized: true, 
      response: undefined,
      affiliateId: null,
      role 
    };
  }

  // Affiliate must have a valid affiliate record
  if (role === 'affiliate' && affiliateId) {
    return { 
      authorized: true, 
      response: undefined,
      affiliateId,
      role 
    };
  }

  return { 
    authorized: false, 
    response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    affiliateId: null,
    role: null 
  };
}