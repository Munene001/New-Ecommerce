import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';

async function verifyProductOwnership(productId: number, supabaseUserId: string) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM products p
     JOIN shops s ON p.shop_id = s.shop_id
     JOIN tenant t ON s.tenant_id = t.tenant_id
     WHERE p.product_id = ? AND t.user_id = (
       SELECT user_id FROM users WHERE supabase_uid = ?
     )`,
    [productId, supabaseUserId]
  );
  return (rows as any[]).length > 0;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Get authenticated user from session cookie
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    const isOwner = await verifyProductOwnership(productIdNum, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.query(
      `SELECT 
        c.category_id,
        c.category_name
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?
       ORDER BY c.category_name`,
      [productId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Get authenticated user from session cookie
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    const { category_id } = await req.json();
    if (!category_id) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 });
    }

    const isOwner = await verifyProductOwnership(productIdNum, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query(
      'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
      [productId, category_id]
    );

    return NextResponse.json({ success: true, category_id });
  } catch (error: any) {
    console.error('Add category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Product already has this category' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Get authenticated user from session cookie
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
  }

  try {
    const isOwner = await verifyProductOwnership(productIdNum, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query(
      'DELETE FROM product_categories WHERE product_id = ? AND category_id = ?',
      [productId, categoryId]
    );

    return NextResponse.json({ success: true, category_id: categoryId });
  } catch (error) {
    console.error('Remove category error:', error);
    return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 });
  }
}