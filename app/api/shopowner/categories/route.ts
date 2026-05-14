import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
  shop_id: number;
}

interface CategoryInsertResult extends ResultSetHeader {
  insertId: number;
}

interface ShopIdRow extends RowDataPacket {
  shop_id: number;
}

// GET /api/shopowner/categories?shopId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopIdParam = searchParams.get('shopId');

  if (!shopIdParam) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  const shopId = parseInt(shopIdParam, 10);
  if (isNaN(shopId)) {
    return NextResponse.json({ error: 'Invalid shopId' }, { status: 400 });
  }

  // Verify access using helper
  const { authorized, response } = await verifyShopAccess(req, shopId);
  
  if (!authorized) {
    return response;
  }

  try {
    const [rows] = await pool.query<CategoryRow[]>(
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
  try {
    const { shopId, categoryName } = await req.json();

    if (!shopId || !categoryName) {
      return NextResponse.json({ error: 'shopId and categoryName required' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const [result] = await pool.query<CategoryInsertResult>(
      'INSERT INTO categories (shop_id, category_name) VALUES (?, ?)',
      [shopId, categoryName]
    );

    const insertId = result.insertId;

    return NextResponse.json({
      success: true,
      category_id: insertId,
      category_name: categoryName
    });
  } catch (error) {
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// DELETE /api/shopowner/categories?id=1
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('id');

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
  }

  try {
    // First, get the shop_id of this category to verify ownership
    const [catRows] = await pool.query<ShopIdRow[]>(
      'SELECT shop_id FROM categories WHERE category_id = ?',
      [categoryId]
    );
    if (catRows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const shopId = catRows[0].shop_id;

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    await pool.query<ResultSetHeader>('DELETE FROM categories WHERE category_id = ?', [categoryId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}