import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-utlis';
import { getConnection } from '@/lib/db';

// Helper to verify that the product belongs to a shop owned by the user
async function verifyProductOwnership(productId: number, supabaseUserId: string, connection: any) {
  const [rows] = await connection.query(
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

// GET /api/shopowner/products/123/categories
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await validateToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    const isOwner = await verifyProductOwnership(productIdNum, auth.supabaseUser.id, connection);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await connection.query(
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
  } finally {
    if (connection) await connection.end();
  }
}

// POST /api/shopowner/products/123/categories
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await validateToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  let connection;
  try {
    const { category_id } = await req.json();
    if (!category_id) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 });
    }

    connection = await getConnection();
    const isOwner = await verifyProductOwnership(productIdNum, auth.supabaseUser.id, connection);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connection.query(
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
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE /api/shopowner/products/123/categories?categoryId=5
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await validateToken(req);
  if (!auth) {
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

  let connection;
  try {
    connection = await getConnection();
    const isOwner = await verifyProductOwnership(productIdNum, auth.supabaseUser.id, connection);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connection.query(
      'DELETE FROM product_categories WHERE product_id = ? AND category_id = ?',
      [productId, categoryId]
    );

    return NextResponse.json({ success: true, category_id: categoryId });
  } catch (error) {
    console.error('Remove category error:', error);
    return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}