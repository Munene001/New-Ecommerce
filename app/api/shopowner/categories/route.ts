import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';

// Helper to verify that the user owns the shop
async function verifyShopOwnership(shopId: number, supabaseUserId: string) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM shops s
     JOIN tenant t ON s.tenant_id = t.tenant_id
     WHERE s.shop_id = ? AND t.user_id = (
       SELECT user_id FROM users WHERE supabase_uid = ?
     )`,
    [shopId, supabaseUserId]
  );
  return (rows as any[]).length > 0;
}

// GET /api/shopowner/categories?shopId=1
export async function GET(req: NextRequest) {
  // Create Supabase client and get authenticated user
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');

  if (!shopId) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  try {
    const isOwner = await verifyShopOwnership(Number(shopId), user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE shop_id = ? ORDER BY category_name',
      [shopId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/shopowner/categories
export async function POST(req: NextRequest) {
  // Create Supabase client and get authenticated user
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { shopId, categoryName } = await req.json();

    if (!shopId || !categoryName) {
      return NextResponse.json({ error: 'shopId and categoryName required' }, { status: 400 });
    }

    const isOwner = await verifyShopOwnership(Number(shopId), user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (shop_id, category_name) VALUES (?, ?)',
      [shopId, categoryName]
    );

    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      category_id: insertId,
      category_name: categoryName
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// DELETE /api/shopowner/categories?id=1
export async function DELETE(req: NextRequest) {
  // Create Supabase client and get authenticated user
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('id');

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
  }

  try {
    // First, get the shop_id of this category to verify ownership
    const [catRows] = await pool.query(
      'SELECT shop_id FROM categories WHERE category_id = ?',
      [categoryId]
    );
    if ((catRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const shopId = (catRows as any[])[0].shop_id;

    const isOwner = await verifyShopOwnership(shopId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM categories WHERE category_id = ?', [categoryId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}