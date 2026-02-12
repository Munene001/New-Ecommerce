import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET /api/shopowner/products/123/categories
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> } 
) {
  const { productId } = await params;  
  
  let connection;
  try {
    connection = await getConnection();
    
    const [rows] = await connection.query(`
      SELECT 
        c.category_id,
        c.category_name
      FROM categories c
      JOIN product_categories pc ON c.category_id = pc.category_id
      WHERE pc.product_id = ?
      ORDER BY c.category_name
    `, [productId]);  

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
  const { productId } = await params;  
  
  let connection;
  try {
    const { category_id } = await req.json();
    
    if (!category_id) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 });
    }

    connection = await getConnection();
    
    await connection.query(
      'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)',
      [productId, category_id]  
    );

    return NextResponse.json({ 
      success: true,
      category_id
    });

  } catch (error: any) {
    console.error('Add category error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ 
        error: 'Product already has this category' 
      }, { status: 409 });
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
  const { productId } = await params; 
  
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  
  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    
    await connection.query(
      'DELETE FROM product_categories WHERE product_id = ? AND category_id = ?',
      [productId, categoryId] 
    );

    return NextResponse.json({ 
      success: true,
      category_id: categoryId
    });

  } catch (error) {
    console.error('Remove category error:', error);
    return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}