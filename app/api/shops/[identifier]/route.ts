import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params;
  
  let connection;
  try {
    connection = await getConnection();
    
    // Check if identifier is numeric (ID) or string (slug)
    const isId = /^\d+$/.test(identifier);
    
    let query;
    if (isId) {
      query = 'SELECT shop_id, shop_type, shop_slug FROM shops WHERE shop_id = ?';
    } else {
      query = 'SELECT shop_id, shop_type, shop_slug FROM shops WHERE shop_slug = ?';
    }
    
    const [rows] = await connection.query(query, [identifier]);
    
    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shop = (rows as any[])[0];
    
    return NextResponse.json({
      shop_id: shop.shop_id,
      shop_type: shop.shop_type,
      shop_slug: shop.shop_slug
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}