import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ShopRow extends RowDataPacket {
  shop_type: string;
}

interface CountResult extends RowDataPacket {
  total: number;
}

interface StatsResult extends RowDataPacket {
  totalProducts: number;
  totalDiscounted: number;
  totalInstock: number;
  totalOutOfStock: number;
}

interface ProductImage {
  image_id: number;
  image_path: string;
  is_primary: boolean;
  created_at: string;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  shop_id: number;
  shop_type: string;
  product_name: string;
  product_slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  in_stock: number;
  attributes: string;
  created_at: string;
  updated_at: string;
  images: string | ProductImage[] | null;
}

interface VerificationResult extends RowDataPacket {
  count: number;
}

interface ProductInsertResult extends ResultSetHeader {
  insertId: number;
}

// GET /api/shopowner/products?shopId=1&...
export async function GET(req: NextRequest) {
  try {
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
    const queryParams: (string | number)[] = [shopId];

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
      queryParams.push(Number(minPrice), Number(maxPrice));
    } else if (minPrice) {
      whereClause += ' AND p.price >= ?';
      queryParams.push(Number(minPrice));
    } else if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      queryParams.push(Number(maxPrice));
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

    // Get aggregated stats (apply filters except pagination)
    const [statsResult] = await pool.query<StatsResult[]>(
      `SELECT 
        COUNT(*) as totalProducts,
        SUM(CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 THEN 1 ELSE 0 END) as totalDiscounted,
        SUM(CASE WHEN p.in_stock > 0 THEN 1 ELSE 0 END) as totalInstock,
        SUM(CASE WHEN p.in_stock = 0 THEN 1 ELSE 0 END) as totalOutOfStock
      FROM products p
      ${whereClause}`,
      queryParams
    );

    // Total count for pagination
    const [countResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // Products with images (paginated)
    const [products] = await pool.query<ProductRow[]>(`
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
      success: true,
      products,
      stats: statsResult[0],
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
  }
}

// POST /api/shopowner/products - Create product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, productName, productSlug, description, price, discountPrice, inStock, attributes } = body;

    if (!shopId || !productName || !productSlug || !price || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: shopId, productName, productSlug, price, attributes' 
      }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Get shop type
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_type FROM shops WHERE shop_id = ?',
      [shopId]
    );
    if (!shopRows || shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopType = shopRows[0].shop_type;

    // Insert product
    const [productResult] = await pool.query<ProductInsertResult>(
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

    const productId = productResult.insertId;

    return NextResponse.json({ 
      success: true, 
      product_id: productId,
      shop_type: shopType
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// DELETE /api/shopowner/products - Bulk delete
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shopId');
    
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shopId' }, { status: 400 });
    }

    const { productIds } = await req.json();
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Product IDs array required' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // First, verify that all products belong to this shop
    const [verification] = await pool.query<VerificationResult[]>(
      `SELECT COUNT(*) as count FROM products 
       WHERE product_id IN (?) AND shop_id = ?`,
      [productIds, shopId]
    );
    const verifiedCount = verification[0].count;
    if (verifiedCount !== productIds.length) {
      return NextResponse.json({ 
        error: 'Some products do not belong to this shop or do not exist' 
      }, { status: 403 });
    }

    // Delete from product_categories first
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_categories WHERE product_id IN (?)',
      [productIds]
    );
    // Delete product images
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_images WHERE product_id IN (?)',
      [productIds]
    );
    
    // Finally delete products – catch foreign key constraint from order_items
    try {
      await pool.query<ResultSetHeader>(
        'DELETE FROM products WHERE product_id IN (?) AND shop_id = ?',
        [productIds, shopId]
      );
    } catch (deleteError: any) {
      // Foreign key constraint violation (product has order items)
      if (deleteError.code === 'ER_ROW_IS_REFERENCED_2' && 
          deleteError.sqlMessage?.includes('order_items')) {
        return NextResponse.json(
          { 
            error: 'Cannot delete products that have existing orders.',
            constraint: 'order_items'
          },
          { status: 400 }
        );
      }
      // Re-throw other DB errors
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: productIds.length 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
  }
}