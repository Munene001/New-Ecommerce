import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
}

interface ProductRow extends RowDataPacket {
  shop_id: number;
}

// Helper to get shop_id from product
async function getShopIdFromProduct(productId: number): Promise<number | null> {
  const [rows] = await pool.query<ProductRow[]>(
    'SELECT shop_id FROM products WHERE product_id = ?',
    [productId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

// GET /api/shopowner/products/[productId]/categories - Get product's categories
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get shop_id from product
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const [rows] = await pool.query<CategoryRow[]>(
      `SELECT 
        c.category_id,
        c.category_name
       FROM categories c
       JOIN product_categories pc ON c.category_id = pc.category_id
       WHERE pc.product_id = ?
       ORDER BY c.category_name`,
      [productIdNum]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/shopowner/products/[productId]/categories - Add category to product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { category_id } = await req.json();
    if (!category_id) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 });
    }

    // Get shop_id from product
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    await pool.query<ResultSetHeader>(
      'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
      [productIdNum, category_id]
    );

    return NextResponse.json({ success: true, category_id });
  } catch (error) {
    console.error('Add category error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Product already has this category' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

// DELETE /api/shopowner/products/[productId]/categories?categoryId=5 - Remove category from product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
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

    // Get shop_id from product
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    await pool.query<ResultSetHeader>(
      'DELETE FROM product_categories WHERE product_id = ? AND category_id = ?',
      [productIdNum, categoryId]
    );

    return NextResponse.json({ success: true, category_id: categoryId });
  } catch (error) {
    console.error('Remove category error:', error);
    return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 });
  }
}