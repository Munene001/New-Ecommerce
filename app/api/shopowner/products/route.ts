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
  totalInventoryItems: number;
  totalInstock: number;
  totalOutOfStock: number;
  totalDrafts: number;
}

interface ProductImage {
  image_id: number;
  image_path: string;
  is_primary: boolean;
  created_at: string;
}

interface ProductVariant {
  variant_id: number;
  attributes: Record<string, any>;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
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
  stock_quantity: number;
  product_type: 'simple' | 'variable';
  status: 'draft' | 'published';
  attributes: string;
  created_at: string;
  updated_at: string;
  images: string | ProductImage[] | null;
  variants: string | ProductVariant[] | null;
  min_variant_price: number | null;
  max_variant_price: number | null;
  total_variant_stock: number | null;
}

interface VerificationResult extends RowDataPacket {
  count: number;
}

interface ProductInsertResult extends ResultSetHeader {
  insertId: number;
}

interface VariantInsertResult extends ResultSetHeader {
  insertId: number;
}

function safeParseJSON(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

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

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const inStock = searchParams.get('inStock');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build conditional where clause for the specific visual pagination rows
    let whereClause = 'WHERE p.shop_id = ?';
    const queryParams: (string | number)[] = [shopId];

    if (status) {
      whereClause += ' AND p.status = ?';
      queryParams.push(status);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      whereClause += ` AND (
        p.product_name LIKE ? 
        OR p.description LIKE ? 
        OR p.attributes LIKE ?
      )`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        WHERE pc.product_id = p.product_id 
        AND pc.category_id = ?
      )`;
      queryParams.push(category);
    }

    if (minPrice && maxPrice) {
      whereClause += ` AND (
        (p.product_type = 'simple' AND p.price BETWEEN ? AND ?) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND pv.price BETWEEN ? AND ?
        ))
      )`;
      queryParams.push(Number(minPrice), Number(maxPrice), Number(minPrice), Number(maxPrice));
    } else if (minPrice) {
      whereClause += ` AND (
        (p.product_type = 'simple' AND p.price >= ?) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND pv.price >= ?
        ))
      )`;
      queryParams.push(Number(minPrice), Number(minPrice));
    } else if (maxPrice) {
      whereClause += ` AND (
        (p.product_type = 'simple' AND p.price <= ?) OR
        (p.product_type = 'variable' AND EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.product_id 
          AND pv.price <= ?
        ))
      )`;
      queryParams.push(Number(maxPrice), Number(maxPrice));
    }

    if (inStock === 'true') {
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
    switch(sortBy) {
      case 'price_low':
        orderByClause += 'COALESCE(p.discount_price, p.price) ASC';
        break;
      case 'price_high':
        orderByClause += 'COALESCE(p.discount_price, p.price) DESC';
        break;
      case 'oldest':
        orderByClause += 'p.created_at ASC';
        break;
      case 'newest':
      default:
        orderByClause += 'p.created_at DESC';
        break;
    }

    // Fixed: Compute true global dashboard aggregates for this specific shop independently
    const [statsResult] = await pool.query<StatsResult[]>(
      `WITH global_shop_products AS (
        SELECT p.product_id, p.product_type, p.status, p.stock_quantity
        FROM products p
        WHERE p.shop_id = ?
      ),
      inventory_counts AS (
        SELECT 
          gsp.product_id,
          CASE 
            WHEN gsp.product_type = 'simple' THEN 1
            WHEN gsp.product_type = 'variable' THEN (
              SELECT COUNT(*) 
              FROM product_variants pv 
              WHERE pv.product_id = gsp.product_id
            )
            ELSE 0
          END as inventory_count,
          CASE 
            WHEN gsp.product_type = 'simple' THEN gsp.stock_quantity > 0
            WHEN gsp.product_type = 'variable' THEN EXISTS (
              SELECT 1 FROM product_variants pv 
              WHERE pv.product_id = gsp.product_id 
              AND pv.stock_quantity > 0
            )
            ELSE false
          END as in_stock
        FROM global_shop_products gsp
      )
      SELECT 
        COUNT(DISTINCT gsp.product_id) as totalProducts,
        COALESCE(SUM(ic.inventory_count), 0) as totalInventoryItems,
        COALESCE(SUM(CASE WHEN ic.in_stock = true THEN 1 ELSE 0 END), 0) as totalInstock,
        COALESCE(SUM(CASE WHEN ic.in_stock = false THEN 1 ELSE 0 END), 0) as totalOutOfStock,
        COALESCE(SUM(CASE WHEN gsp.status = 'draft' THEN 1 ELSE 0 END), 0) as totalDrafts
      FROM global_shop_products gsp
      LEFT JOIN inventory_counts ic ON gsp.product_id = ic.product_id`,
      [shopId]
    );

    const [countResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

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
        p.stock_quantity,
        p.product_type,
        p.status,
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
        ) as images,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'variant_id', pv.variant_id,
              'attributes', pv.attributes,
              'price', pv.price,
              'discount_price', pv.discount_price,
              'stock_quantity', pv.stock_quantity,
              'created_at', pv.created_at,
              'updated_at', pv.updated_at
            )
          )
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as variants,
        (
          SELECT MIN(COALESCE(pv.discount_price, pv.price))
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as min_variant_price,
        (
          SELECT MAX(pv.price)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as max_variant_price,
        (
          SELECT SUM(pv.stock_quantity)
          FROM product_variants pv
          WHERE pv.product_id = p.product_id
        ) as total_variant_stock
      FROM products p
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    const formattedProducts = products.map(p => {
      const variants = safeParseJSON(p.variants);
      const images = safeParseJSON(p.images);
      
      let displayPrice: any;
      let stockInfo: any;

      if (p.product_type === 'variable') {
        const minPrice = p.min_variant_price || 0;
        const maxPrice = p.max_variant_price || 0;
        displayPrice = {
          min: minPrice,
          max: maxPrice,
          formatted: minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`,
          isRange: minPrice !== maxPrice
        };
        stockInfo = {
          type: 'varies',
          total: p.total_variant_stock || 0,
          variants: variants.map((v: any) => ({
            stock: v.stock_quantity,
            attributes: v.attributes
          }))
        };
      } else {
        displayPrice = p.discount_price || p.price;
        stockInfo = {
          type: 'simple',
          quantity: p.stock_quantity
        };
      }

      return {
        product_id: p.product_id,
        shop_id: p.shop_id,
        shop_type: p.shop_type,
        product_name: p.product_name,
        product_slug: p.product_slug,
        description: p.description,
        price: p.product_type === 'variable' ? 0 : p.price,
        discount_price: p.product_type === 'variable' ? null : p.discount_price,
        stock_quantity: p.product_type === 'variable' ? 0 : p.stock_quantity,
        product_type: p.product_type,
        status: p.status,
        attributes: p.attributes,
        created_at: p.created_at,
        updated_at: p.updated_at,
        variants: p.product_type === 'variable' ? variants : [],
        images: images,
        display_price: displayPrice,
        stock_info: stockInfo,
        in_stock: p.product_type === 'variable' 
          ? (p.total_variant_stock || 0) > 0 
          : p.stock_quantity > 0,
        can_publish: p.status === 'draft'
      };
    });

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      stats: statsResult[0] || {
        totalProducts: 0,
        totalInventoryItems: 0,
        totalInstock: 0,
        totalOutOfStock: 0,
        totalDrafts: 0,
      },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      shopId, 
      productName, 
      productSlug, 
      description, 
      price, 
      discountPrice, 
      stockQuantity,
      attributes,
      productType = 'simple',
      status = 'draft',
      variants = []
    } = body;

    if (!shopId || !productName || !productSlug || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    if (productType === 'variable') {
      if (!variants || variants.length < 2) {
        return NextResponse.json({ 
          error: 'Variable products must have at least 2 variants' 
        }, { status: 400 });
      }
      for (const variant of variants) {
        if (!variant.price || variant.price <= 0) {
          return NextResponse.json({ 
            error: 'Each variant must have a price greater than 0' 
          }, { status: 400 });
        }
        if (!variant.attributes || Object.keys(variant.attributes).length === 0) {
          return NextResponse.json({ 
            error: 'Each variant must have attributes' 
          }, { status: 400 });
        }
      }
    } else {
      if (!price || price <= 0) {
        return NextResponse.json({ 
          error: 'Price must be greater than 0' 
        }, { status: 400 });
      }
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_type FROM shops WHERE shop_id = ?',
      [shopId]
    );
    if (!shopRows || shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopType = shopRows[0].shop_type;

    const [productResult] = await pool.query<ProductInsertResult>(
      `INSERT INTO products 
       (shop_id, shop_type, product_name, product_slug, description, 
        price, discount_price, stock_quantity, product_type, status, attributes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        shopType,
        productName,
        productSlug,
        description || null,
        productType === 'variable' ? 0 : price,
        productType === 'variable' ? null : (discountPrice || null),
        productType === 'variable' ? 0 : (stockQuantity || 0),
        productType,
        status,
        JSON.stringify(attributes)
      ]
    );

    const productId = productResult.insertId;

    if (productType === 'variable') {
      for (const variant of variants) {
        await pool.query<VariantInsertResult>(
          `INSERT INTO product_variants 
           (product_id, attributes, price, discount_price, stock_quantity) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            productId,
            JSON.stringify(variant.attributes),
            variant.price,
            variant.discountPrice || null,
            variant.stockQuantity || 0
          ]
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      product_id: productId,
      shop_type: shopType,
      product_type: productType,
      status: status
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

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

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

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

    await pool.query<ResultSetHeader>(
      'DELETE FROM product_categories WHERE product_id IN (?)',
      [productIds]
    );
    
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_images WHERE product_id IN (?)',
      [productIds]
    );
    
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_variants WHERE product_id IN (?)',
      [productIds]
    );
    
    try {
      await pool.query<ResultSetHeader>(
        'DELETE FROM products WHERE product_id IN (?) AND shop_id = ?',
        [productIds, shopId]
      );
    } catch (deleteError: any) {
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