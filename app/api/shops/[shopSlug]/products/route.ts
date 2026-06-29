import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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

interface ProductVariant {
  variant_id: number;
  attributes: Record<string, any>;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  product_slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  product_type: 'simple' | 'variable';
  created_at: Date;
  images: string | ProductImage[] | null;
  variants: string | ProductVariant[] | null;
  min_effective_price: number | null;
  max_regular_price: number | null;
  total_stock: number | null;
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
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopId = shopRows[0].shop_id;

    let whereClause = 'WHERE p.shop_id = ? AND p.status = "published"';
    const queryParams: (string | number)[] = [shopId];

    if (search) {
      const searchTerm = `%${search}%`;
      whereClause += ` AND (p.product_name LIKE ? OR p.description LIKE ?)`;
      queryParams.push(searchTerm, searchTerm);
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
      whereClause += ` AND (
        (p.product_type = 'simple' AND COALESCE(p.discount_price, p.price) BETWEEN ? AND ?) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND COALESCE(pv.discount_price, pv.price) BETWEEN ? AND ?
        ))
      )`;
      queryParams.push(Number(minPrice), Number(maxPrice));
      queryParams.push(Number(minPrice), Number(maxPrice));
    } else if (minPrice) {
      whereClause += ` AND (
        (p.product_type = 'simple' AND COALESCE(p.discount_price, p.price) >= ?) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND COALESCE(pv.discount_price, pv.price) >= ?
        ))
      )`;
      queryParams.push(Number(minPrice));
      queryParams.push(Number(minPrice));
    } else if (maxPrice) {
      whereClause += ` AND (
        (p.product_type = 'simple' AND COALESCE(p.discount_price, p.price) <= ?) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND COALESCE(pv.discount_price, pv.price) <= ?
        ))
      )`;
      queryParams.push(Number(maxPrice));
      queryParams.push(Number(maxPrice));
    }

    if (inStock) {
      whereClause += ` AND (
        (p.product_type = 'simple' AND p.stock_quantity > 0) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND pv.stock_quantity > 0
        ))
      )`;
    }

    let orderByClause = 'ORDER BY ';
    switch (sortBy) {
      case 'price_low':
        orderByClause += `
          COALESCE(
            (SELECT MIN(COALESCE(pv.discount_price, pv.price))
             FROM product_variants pv 
             WHERE pv.product_id = p.product_id),
            p.discount_price,
            p.price
          ) ASC
        `;
        break;
      case 'price_high':
        orderByClause += `
          COALESCE(
            (SELECT MAX(pv.price)
             FROM product_variants pv 
             WHERE pv.product_id = p.product_id),
            p.price,
            p.discount_price
          ) DESC
        `;
        break;
      case 'oldest':
        orderByClause += 'p.created_at ASC';
        break;
      case 'newest':
      default:
        orderByClause += 'p.created_at DESC';
        break;
    }

    const [countResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    const [products] = await pool.query<ProductRow[]>(
      `SELECT 
        p.product_id,
        p.product_name,
        p.product_slug,
        p.description,
        p.price,
        p.discount_price,
        p.stock_quantity,
        p.product_type,
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
        ) as images,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'variant_id', pv.variant_id,
              'attributes', pv.attributes,
              'price', pv.price,
              'discount_price', pv.discount_price,
              'stock_quantity', pv.stock_quantity
            )
          )
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as variants,
        (
          SELECT MIN(COALESCE(pv.discount_price, pv.price))
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as min_effective_price,
        (
          SELECT MAX(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as max_regular_price,
        (
          SELECT SUM(pv.stock_quantity)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as total_stock
      FROM products p
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const formattedProducts = products.map((p) => {
      const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
      const variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants;

      let displayPrice;
      let stockInfo;
      let inStock;

      if (p.product_type === 'variable') {
        const minPrice = p.min_effective_price || 0;
        const maxPrice = p.max_regular_price || 0;
        
        displayPrice = {
          min: minPrice,
          max: maxPrice,
          formatted: minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`,
          isRange: minPrice !== maxPrice
        };

        const totalStock = p.total_stock || 0;
        stockInfo = {
          type: 'varies',
          total: totalStock
        };

        inStock = totalStock > 0;
      } else {
        const effectivePrice = p.discount_price || p.price;
        displayPrice = effectivePrice;
        
        stockInfo = {
          type: 'simple',
          quantity: p.stock_quantity
        };

        inStock = p.stock_quantity > 0;
      }

      return {
        product_id: p.product_id,
        product_name: p.product_name,
        product_slug: p.product_slug,
        description: p.description,
        price: p.product_type === 'variable' ? 0 : p.price,
        discount_price: p.product_type === 'variable' ? null : p.discount_price,
        stock_quantity: p.product_type === 'variable' ? 0 : p.stock_quantity,
        product_type: p.product_type,
        created_at: p.created_at,
        images: images || [],
        variants: variants || [],
        display_price: displayPrice,
        stock_info: stockInfo,
        in_stock: inStock
      };
    });

    return NextResponse.json({
      products: formattedProducts,
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