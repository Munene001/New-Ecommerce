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
  attributes: string | Record<string, any>;
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

// Helper to validate product before publishing
function validateProduct(product: any): string[] {
  const errors: string[] = [];

  if (!product.product_name || product.product_name.trim() === '') {
    errors.push('Product name is required');
  }

  if (!product.product_slug || product.product_slug.trim() === '') {
    errors.push('Product slug is required');
  }

  if (!product.attributes || Object.keys(product.attributes).length === 0) {
    errors.push('Product attributes are required');
  }

  if (product.product_type === 'simple') {
    if (!product.price || product.price <= 0) {
      errors.push('Price must be greater than 0');
    }
  } else if (product.product_type === 'variable') {
    if (!product.variants || product.variants.length < 2) {
      errors.push('Variable products must have at least 2 variants');
    } else {
      for (let i = 0; i < product.variants.length; i++) {
        const variant = product.variants[i];
        if (!variant.price || variant.price <= 0) {
          errors.push(`Variant ${i + 1}: Price must be greater than 0`);
        }
        if (!variant.attributes || Object.keys(variant.attributes).length === 0) {
          errors.push(`Variant ${i + 1}: Attributes are required`);
        }
      }
    }
  }

  return errors;
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
    const status = searchParams.get('status'); // NEW: filter by status
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE p.shop_id = ?';
    const queryParams: (string | number)[] = [shopId];

    // NEW: Filter by status
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

    // Updated price filtering - handle both simple and variable
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

    // Updated stock filtering
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

    // Get aggregated stats (apply filters except pagination)
    const [statsResult] = await pool.query<StatsResult[]>(
      `SELECT 
        COUNT(*) as totalProducts,
        SUM(CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 THEN 1 ELSE 0 END) as totalDiscounted,
        SUM(CASE WHEN p.stock_quantity > 0 THEN 1 ELSE 0 END) as totalInstock,
        SUM(CASE WHEN p.stock_quantity = 0 THEN 1 ELSE 0 END) as totalOutOfStock,
        SUM(CASE WHEN p.status = 'draft' THEN 1 ELSE 0 END) as totalDrafts
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

    // Products with images and variant info (paginated)
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

    // Format products for response
    const formattedProducts = products.map(p => {
      const variants = p.variants ? JSON.parse(p.variants as string) : [];
      const images = p.images ? JSON.parse(p.images as string) : [];
      
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
        ...p,
        price: p.product_type === 'variable' ? 0 : p.price,
        discount_price: p.product_type === 'variable' ? null : p.discount_price,
        stock_quantity: p.product_type === 'variable' ? 0 : p.stock_quantity,
        variants: p.product_type === 'variable' ? variants : [],
        images,
        display_price: displayPrice,
        stock_info: stockInfo,
        can_publish: p.status === 'draft' && validateProduct(p).length === 0
      };
    });

    return NextResponse.json({
      success: true,
      products: formattedProducts,
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
      variants = []
    } = body;

    // Basic validation
    if (!shopId || !productName || !productSlug || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: shopId, productName, productSlug, attributes' 
      }, { status: 400 });
    }

    // Validate based on product type
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
      // Simple product
      if (!price || price <= 0) {
        return NextResponse.json({ 
          error: 'Price must be greater than 0' 
        }, { status: 400 });
      }
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

    // Insert product - always draft by default
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
        'draft', // Always draft by default
        JSON.stringify(attributes)
      ]
    );

    const productId = productResult.insertId;

    // If variable, insert variants
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
      status: 'draft'
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
    
    // Delete product variants (cascade should handle this, but explicit is safer)
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_variants WHERE product_id IN (?)',
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