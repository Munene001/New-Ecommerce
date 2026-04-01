import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, } from 'mysql2';

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

interface CountResult extends RowDataPacket {
  total: number;
}

interface ProductImage {
  image_id: number;
  image_path: string;
  is_primary: boolean;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
  in_stock: number;
  created_at: Date;
  images: string | ProductImage[] | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const search = searchParams.get('search') || '';
  const categoriesParam = searchParams.get('categories');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sortBy') || 'newest';
  const inStock = searchParams.get('inStock') === 'true';

  try {
    // First get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopId = shopRows[0].shop_id;

    // Build WHERE clause
    let whereClause = 'WHERE p.shop_id = ?';
    const queryParams: (string | number)[] = [shopId];

    if (search) {
      const searchTerm = `%${search}%`;
      whereClause += ` AND (p.product_name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.color LIKE ?)`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (categoriesParam) {
      const categories = categoriesParam.split(',');
      const placeholders = categories.map(() => '?').join(',');
      whereClause += ` AND EXISTS (
        SELECT 1 FROM product_categories pc
        WHERE pc.product_id = p.product_id AND pc.category_id IN (${placeholders})
      )`;
      queryParams.push(...categories);
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

    if (inStock) {
      whereClause += ' AND p.in_stock = 1';
    }

    // ORDER BY
    let orderByClause = 'ORDER BY ';
    switch (sortBy) {
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

    // Count total
    const [countResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // Fetch products
    const [products] = await pool.query<ProductRow[]>(
      `SELECT 
        p.product_id,
        p.product_name,
        p.product_slug,
        p.price,
        p.discount_price,
        p.in_stock,
        p.created_at,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'image_id', pi.image_id,
              'image_path', pi.image_path,
              'is_primary', pi.is_primary
            )
          )
          FROM product_images pi
          WHERE pi.product_id = p.product_id
        ) as images
      FROM products p
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

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
    console.error('Public products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}