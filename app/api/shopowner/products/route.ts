import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET /api/shopowner/products?shopId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  
  if (!shopId) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();
    
    const [products] = await connection.query(`
      SELECT 
        product_id,
        shop_id,
        shop_type,
        product_name,
        product_slug,
        description,
        price,
        in_stock,
        attributes,
        created_at,
        updated_at
      FROM products 
      WHERE shop_id = ?
      ORDER BY created_at DESC
    `, [shopId]);
    
    // ✅ MySQL2 automatically parses JSON columns
    // Return products directly - attributes is already an object
    return NextResponse.json(products);
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST /api/shopowner/products
export async function POST(req: NextRequest) {
  let connection;
  try {
    const { 
      shopId,
      productName,
      productSlug,
      description,
      price,
      inStock,
      attributes 
    } = await req.json();

    // Validation
    if (!shopId || !productName || !productSlug || !price || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: shopId, productName, productSlug, price, attributes' 
      }, { status: 400 });
    }

    connection = await getConnection();

    // Get shop_type from shops table (INHERITANCE)
    const [shopRows] = await connection.query(
      'SELECT shop_type FROM shops WHERE shop_id = ?',
      [shopId]
    );
    
    if (!shopRows || (shopRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shopType = (shopRows as any[])[0].shop_type;

    // Insert product
    const [productResult] = await connection.query(
      `INSERT INTO products 
       (shop_id, shop_type, product_name, product_slug, description, price, in_stock, attributes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        shopType,
        productName,
        productSlug,
        description || null,
        price,
        inStock === undefined ? true : inStock,
        JSON.stringify(attributes)
      ]
    );

    const productId = (productResult as any).insertId;

    return NextResponse.json({ 
      success: true, 
      product_id: productId,
      shop_type: shopType
    }, { status: 201 });

  } catch (error: any) {
    console.error('Product creation error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}