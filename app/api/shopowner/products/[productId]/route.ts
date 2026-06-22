import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import { unlink, rmdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
}

interface ProductVariant extends RowDataPacket {
  variant_id: number;
  product_id: number;
  attributes: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

interface ImageRow extends RowDataPacket {
  image_path: string;
}

interface ProductNameRow extends RowDataPacket {
  product_name: string;
}

interface VariantInsertResult extends ResultSetHeader {
  insertId: number;
}

// Helper to get shop_id from product
async function getShopIdFromProduct(productId: number): Promise<number | null> {
  const [rows] = await pool.query<ProductRow[]>(
    'SELECT shop_id FROM products WHERE product_id = ?',
    [productId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
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

// GET /api/shopowner/products/123
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get shop_id from product
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Get product with variants
    const [productRows] = await pool.query<ProductRow[]>(`
      SELECT 
        product_id,
        shop_id,
        shop_type,
        product_name,
        product_slug,
        description,
        price,
        discount_price,
        stock_quantity,
        product_type,
        status,
        attributes,
        created_at,
        updated_at
      FROM products 
      WHERE product_id = ?
    `, [productIdNum]);

    if (!productRows || productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productRows[0];

    // If variable product, fetch variants
    let variants: ProductVariant[] = [];
    if (product.product_type === 'variable') {
      const [variantRows] = await pool.query<ProductVariant[]>(
        `SELECT 
          variant_id,
          product_id,
          attributes,
          price,
          discount_price,
          stock_quantity,
          created_at,
          updated_at
        FROM product_variants 
        WHERE product_id = ?
        ORDER BY variant_id ASC`,
        [productIdNum]
      );
      variants = variantRows;
    }

    // Parse attributes if string
    const parsedAttributes = typeof product.attributes === 'string' 
      ? JSON.parse(product.attributes) 
      : product.attributes;

    // Build response
    const responseData: any = {
      ...product,
      attributes: parsedAttributes,
      variants: variants.map(v => ({
        ...v,
        attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes
      })),
      // For variable products, product-level price/stock should be 0
      price: product.product_type === 'variable' ? 0 : product.price,
      discount_price: product.product_type === 'variable' ? null : product.discount_price,
      stock_quantity: product.product_type === 'variable' ? 0 : product.stock_quantity,
      // Display price info
      display_price: product.product_type === 'variable' 
        ? {
            min: variants.length > 0 ? Math.min(...variants.map(v => v.discount_price || v.price)) : 0,
            max: variants.length > 0 ? Math.max(...variants.map(v => v.price)) : 0,
            formatted: variants.length > 0 
              ? (() => {
                  const min = Math.min(...variants.map(v => v.discount_price || v.price));
                  const max = Math.max(...variants.map(v => v.price));
                  return min === max ? `${min}` : `${min} - ${max}`;
                })()
              : '0'
          }
        : (product.discount_price || product.price),
      // Stock info
      stock_info: product.product_type === 'variable'
        ? {
            type: 'varies',
            total: variants.reduce((sum, v) => sum + v.stock_quantity, 0),
            variants: variants.map(v => ({
              stock: v.stock_quantity,
              attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes
            }))
          }
        : {
            type: 'simple',
            quantity: product.stock_quantity
          },
      // Can publish check
      can_publish: product.status === 'draft' && validateProduct({
        ...product,
        variants,
        attributes: parsedAttributes
      }).length === 0
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/shopowner/products/123
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      productName,
      productSlug,
      description,
      price,
      discountPrice,
      stockQuantity,
      attributes,
      productType = 'simple',
      status,
      variants = []
    } = body;

    // Basic validation
    if (!productName || !productSlug || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: productName, productSlug, attributes' 
      }, { status: 400 });
    }

    // Get shop_id from product
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
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

    // If status is changing to 'published', validate first
    if (status === 'published') {
      const validationErrors = validateProduct({
        ...body,
        product_type: productType,
        variants
      });
      
      if (validationErrors.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot publish - incomplete product',
          missing: validationErrors 
        }, { status: 400 });
      }
    }

    // Update product
    await pool.query<ResultSetHeader>(
      `UPDATE products 
       SET product_name = ?, 
           product_slug = ?, 
           description = ?, 
           price = ?, 
           discount_price = ?,
           stock_quantity = ?,
           product_type = ?,
           status = ?,
           attributes = ?
       WHERE product_id = ?`,
      [
        productName,
        productSlug,
        description || null,
        productType === 'variable' ? 0 : price,
        productType === 'variable' ? null : (discountPrice || null),
        productType === 'variable' ? 0 : (stockQuantity || 0),
        productType,
        status || 'draft', // Keep existing status if not provided
        JSON.stringify(attributes),
        productIdNum
      ]
    );

    // If variable product, handle variants
    if (productType === 'variable') {
      // Delete existing variants
      await pool.query<ResultSetHeader>(
        'DELETE FROM product_variants WHERE product_id = ?',
        [productIdNum]
      );
      
      // Insert new variants
      for (const variant of variants) {
        await pool.query<VariantInsertResult>(
          `INSERT INTO product_variants 
           (product_id, attributes, price, discount_price, stock_quantity) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            productIdNum,
            JSON.stringify(variant.attributes),
            variant.price,
            variant.discountPrice || null,
            variant.stockQuantity || 0
          ]
        );
      }
    } else {
      // If product changed from variable to simple, ensure variants are deleted
      await pool.query<ResultSetHeader>(
        'DELETE FROM product_variants WHERE product_id = ?',
        [productIdNum]
      );
    }

    return NextResponse.json({ 
      success: true,
      product_id: productIdNum,
      product_type: productType,
      status: status || 'draft'
    });
  } catch (error) {
    console.error('Product update error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/shopowner/products/123 - Also deletes image files and variants
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get shop_id from product
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // 1. Get all image paths before deleting product
    const [imageRows] = await pool.query<ImageRow[]>(
      'SELECT image_path FROM product_images WHERE product_id = ?',
      [productIdNum]
    );

    // 2. Get product name for response
    const [productRows] = await pool.query<ProductNameRow[]>(
      'SELECT product_name FROM products WHERE product_id = ?',
      [productIdNum]
    );
    const productName = productRows[0]?.product_name || 'Product';

    // 3. Delete variants (explicit - though cascade should handle)
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_variants WHERE product_id = ?',
      [productIdNum]
    );

    // 4. Delete product (cascade deletes product_images and product_categories records)
    await pool.query<ResultSetHeader>(
      'DELETE FROM products WHERE product_id = ?',
      [productIdNum]
    );

    // 5. Delete physical files from disk
    const images = imageRows;
    let deletedCount = 0;

    for (const image of images) {
      try {
        const fullPath = path.join('/home/munene/storage/originals', image.image_path);
        await unlink(fullPath);
        deletedCount++;
        
      } catch {
        console.log(`⚠️ File already deleted or not found: ${image.image_path}`);
      }
    }

    // 6. Try to delete the product folder if empty
    try {
      const productFolder = path.join('/home/munene/storage/originals', productIdNum.toString());
      await rmdir(productFolder);
      
    } catch {
      
    }

    return NextResponse.json({ 
      success: true,
      message: `${productName} deleted successfully`,
      images_deleted: deletedCount,
      total_images: images.length
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}