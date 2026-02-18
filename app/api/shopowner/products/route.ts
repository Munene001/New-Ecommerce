import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET /api/shopowner/products?shopId=1&search=shoes&category=5&page=2&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  
  if (!shopId) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  // Get filter parameters
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  let connection;
  try {
    connection = await getConnection();
    
    // Build the WHERE clause dynamically
    let whereClause = 'WHERE p.shop_id = ?';
    const queryParams: any[] = [shopId];
    
    if (search) {
      whereClause += ' AND p.product_name LIKE ?';
      queryParams.push(`%${search}%`);
    }
    
    if (category) {
      whereClause += ' AND EXISTS (SELECT 1 FROM product_categories pc WHERE pc.product_id = p.product_id AND pc.category_id = ?)';
      queryParams.push(category);
    }
    
    // Get TOTAL COUNT for pagination (with same filters)
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const totalCount = (countResult as any[])[0].total;
    
    // Get PAGINATED products with ALL images
    const [products] = await connection.query(`
      SELECT 
        p.product_id,
        p.shop_id,
        p.shop_type,
        p.product_name,
        p.product_slug,
        p.description,
        p.price,
        p.discount_price,
        p.in_stock,
        p.attributes,
        p.created_at,
        p.updated_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'image_id', pi.image_id,
              'image_path', pi.image_path,
              'is_primary', pi.is_primary,
              'created_at', pi.created_at
            )
          )
          FROM product_images pi
          WHERE pi.product_id = p.product_id
        ) as images
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);
    
    // Return products WITH pagination info
    return NextResponse.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST /api/shopowner/products (unchanged)
export async function POST(req: NextRequest) {
  let connection;
  try {
    const { 
      shopId,
      productName,
      productSlug,
      description,
      price,
      discountPrice,
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

    // Get shop_type from shops table
    const [shopRows] = await connection.query(
      'SELECT shop_type FROM shops WHERE shop_id = ?',
      [shopId]
    );
    
    if (!shopRows || (shopRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shopType = (shopRows as any[])[0].shop_type;

    // Insert product with discount_price
    const [productResult] = await connection.query(
      `INSERT INTO products 
       (shop_id, shop_type, product_name, product_slug, description, price, discount_price, in_stock, attributes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        shopType,
        productName,
        productSlug,
        description || null,
        price,
        discountPrice || null,
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
      return NextResponse.json({ error: 'Product name already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}