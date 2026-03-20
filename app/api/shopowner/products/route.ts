import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-utlis';
import { getConnection } from '@/lib/db';

// Helper to verify that the user owns the shop
async function verifyShopOwnership(connection: any, shopId: number, supabaseUid: string): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT 1
     FROM shops s
     JOIN tenant t ON s.tenant_id = t.tenant_id
     JOIN users u ON t.user_id = u.user_id
     WHERE s.shop_id = ? AND u.supabase_uid = ?`,
    [shopId, supabaseUid]
  );
  return (rows as any[]).length > 0;
}

// GET /api/shopowner/products?shopId=1&...
export async function GET(req: NextRequest) {
  let connection;
  try {
    // Validate token
    const auth = await validateToken(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = auth.supabaseUser.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    connection = await getConnection();

    // Verify ownership
    const isOwner = await verifyShopOwnership(connection, parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ... rest of the GET logic (same as before, but using connection)
    const search = searchParams.get('search') || '';
    const categories = searchParams.get('categories');
    const singleCategory = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const inStock = searchParams.get('inStock');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE p.shop_id = ?';
    const queryParams: any[] = [shopId];

    if (search) {
      const searchTerm = `%${search}%`;
      whereClause += ` AND (
        p.product_name LIKE ? 
        OR p.description LIKE ? 
        OR p.brand LIKE ? 
        OR p.color LIKE ?
      )`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (categories) {
      const categoryArray = categories.split(',');
      const placeholders = categoryArray.map(() => '?').join(',');
      whereClause += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.product_id 
        AND pc.category_id IN (${placeholders})
      )`;
      queryParams.push(...categoryArray);
    } else if (singleCategory) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.product_id 
        AND pc.category_id = ?
      )`;
      queryParams.push(singleCategory);
    }

    if (minPrice && maxPrice) {
      whereClause += ' AND p.price BETWEEN ? AND ?';
      queryParams.push(minPrice, maxPrice);
    } else if (minPrice) {
      whereClause += ' AND p.price >= ?';
      queryParams.push(minPrice);
    } else if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      queryParams.push(maxPrice);
    }

    if (inStock === 'true') {
      whereClause += ' AND p.in_stock = 1';
    }

    let orderByClause = 'ORDER BY ';
    switch(sortBy) {
      case 'price_low':
        orderByClause += 'p.price ASC';
        break;
      case 'price_high':
        orderByClause += 'p.price DESC';
        break;
      case 'oldest':
        orderByClause += 'p.created_at ASC';
        break;
      case 'newest':
      default:
        orderByClause += 'p.created_at DESC';
        break;
    }

    // Total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const totalCount = (countResult as any[])[0].total;

    // Products with images
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
      ${orderByClause}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

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
    console.error('GET products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST /api/shopowner/products - Create product
export async function POST(req: NextRequest) {
  let connection;
  try {
    // Validate token
    const auth = await validateToken(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = auth.supabaseUser.id;

    const body = await req.json();
    const { shopId, productName, productSlug, description, price, discountPrice, inStock, attributes } = body;

    if (!shopId || !productName || !productSlug || !price || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: shopId, productName, productSlug, price, attributes' 
      }, { status: 400 });
    }

    connection = await getConnection();

    // Verify ownership
    const isOwner = await verifyShopOwnership(connection, shopId, supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get shop type
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

// DELETE /api/shopowner/products - Bulk delete
export async function DELETE(req: NextRequest) {
  let connection;
  try {
    // Validate token
    const auth = await validateToken(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = auth.supabaseUser.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const { productIds } = await req.json();
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Product IDs array required' }, { status: 400 });
    }

    connection = await getConnection();

    // Verify ownership
    const isOwner = await verifyShopOwnership(connection, parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, verify that all products belong to this shop
    const [verification] = await connection.query(
      `SELECT COUNT(*) as count FROM products 
       WHERE product_id IN (?) AND shop_id = ?`,
      [productIds, shopId]
    );
    const verifiedCount = (verification as any[])[0].count;
    if (verifiedCount !== productIds.length) {
      return NextResponse.json({ 
        error: 'Some products do not belong to this shop or do not exist' 
      }, { status: 403 });
    }

    // Delete from product_categories first
    await connection.query(
      'DELETE FROM product_categories WHERE product_id IN (?)',
      [productIds]
    );
    // Delete product images
    await connection.query(
      'DELETE FROM product_images WHERE product_id IN (?)',
      [productIds]
    );
    // Finally delete products
    const [result] = await connection.query(
      'DELETE FROM products WHERE product_id IN (?) AND shop_id = ?',
      [productIds, shopId]
    );

    return NextResponse.json({ 
      success: true, 
      deletedCount: productIds.length 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}