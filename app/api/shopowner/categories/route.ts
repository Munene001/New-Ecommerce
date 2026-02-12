import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET /api/shopowner/categories?shopId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  
  if (!shopId) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM categories WHERE shop_id = ? ORDER BY category_name',
      [shopId]
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST /api/shopowner/categories
export async function POST(req: NextRequest) {
  let connection;
  try {
    const { shopId, categoryName } = await req.json();
    
    if (!shopId || !categoryName) {
      return NextResponse.json({ error: 'shopId and categoryName required' }, { status: 400 });
    }

    connection = await getConnection();
    const [result] = await connection.query(
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
    // Handle duplicate category error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE /api/shopowner/categories?id=1
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('id');
  
  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.query(
      'DELETE FROM categories WHERE category_id = ?',
      [categoryId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}