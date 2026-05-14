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
  in_stock: number;
  attributes: string;
  created_at: string;
  updated_at: string;
}

interface ImageRow extends RowDataPacket {
  image_path: string;
}

interface ProductNameRow extends RowDataPacket {
  product_name: string;
}

// Helper to get shop_id from product
async function getShopIdFromProduct(productId: number): Promise<number | null> {
  const [rows] = await pool.query<ProductRow[]>(
    'SELECT shop_id FROM products WHERE product_id = ?',
    [productId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
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
        in_stock,
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
    return NextResponse.json(product);
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

    const {
      productName,
      productSlug,
      description,
      price,
      discountPrice,
      inStock,
      attributes
    } = await req.json();

    if (!productName || !productSlug || !price || !attributes) {
      return NextResponse.json({ 
        error: 'Missing required fields: productName, productSlug, price, attributes' 
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

    await pool.query<ResultSetHeader>(
      `UPDATE products 
       SET product_name = ?, 
           product_slug = ?, 
           description = ?, 
           price = ?, 
           discount_price = ?,
           in_stock = ?, 
           attributes = ?
       WHERE product_id = ?`,
      [
        productName,
        productSlug,
        description || null,
        price,
        discountPrice || null,
        inStock,
        JSON.stringify(attributes),
        productIdNum
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product update error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/shopowner/products/123 - Also deletes image files
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

    // 3. Delete product (cascade deletes product_images records)
    await pool.query<ResultSetHeader>('DELETE FROM products WHERE product_id = ?', [productIdNum]);

    // 4. Delete physical files from disk
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

    // 5. Try to delete the product folder if empty
    try {
      const productFolder = path.join('/home/munene/storage/originals', productIdNum.toString());
      await rmdir(productFolder);
      
    } catch {
      // Folder not empty or doesn't exist - ignore
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