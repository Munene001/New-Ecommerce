import { NextRequest, NextResponse } from 'next/server';
import { unlink, rmdir } from 'fs/promises';
import path from 'path';
import { getConnection } from '@/lib/db';
import { validateToken } from '@/lib/auth-utlis';

// Helper to verify that the product belongs to a shop owned by the user
async function verifyProductOwnership(productId: number, supabaseUserId: string, connection: any) {
  const [rows] = await connection.query(
    `SELECT 1
     FROM products p
     JOIN shops s ON p.shop_id = s.shop_id
     JOIN tenant t ON s.tenant_id = t.tenant_id
     WHERE p.product_id = ? AND t.user_id = (
       SELECT user_id FROM users WHERE supabase_uid = ?
     )`,
    [productId, supabaseUserId]
  );
  return (rows as any[]).length > 0;
}

// GET /api/shopowner/products/123
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  // Authenticate
  const auth = await validateToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();

    // Verify ownership
    const isOwner = await verifyProductOwnership(productIdNum, auth.supabaseUser.id, connection);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [productRows] = await connection.query(`
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
    `, [productId]);

    if (!productRows || (productRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = (productRows as any[])[0];
    return NextResponse.json(product);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// PUT /api/shopowner/products/123
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await validateToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  let connection;
  try {
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

    connection = await getConnection();

    // Verify ownership
    const isOwner = await verifyProductOwnership(productIdNum, auth.supabaseUser.id, connection);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connection.query(
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
        productId
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Product update error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Product slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// DELETE /api/shopowner/products/123 - Also deletes image files
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await validateToken(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  let connection;
  try {
    connection = await getConnection();

    // Verify ownership before any deletion
    const isOwner = await verifyProductOwnership(productIdNum, auth.supabaseUser.id, connection);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. GET ALL IMAGE PATHS BEFORE DELETING PRODUCT
    const [imageRows] = await connection.query(
      'SELECT image_path FROM product_images WHERE product_id = ?',
      [productId]
    );

    // 2. GET PRODUCT NAME FOR RESPONSE
    const [productRows] = await connection.query(
      'SELECT product_name FROM products WHERE product_id = ?',
      [productId]
    );
    const productName = (productRows as any[])[0]?.product_name || 'Product';

    // 3. DELETE PRODUCT (DB CASCADE DELETES product_images RECORDS)
    await connection.query('DELETE FROM products WHERE product_id = ?', [productId]);

    // 4. DELETE PHYSICAL FILES FROM DISK
    const images = imageRows as any[];
    let deletedCount = 0;

    for (const image of images) {
      try {
        const fullPath = path.join('/home/munene/storage/originals', image.image_path);
        await unlink(fullPath);
        deletedCount++;
        console.log(`✅ Deleted file: ${image.image_path}`);
      } catch (err) {
        console.log(`⚠️ File already deleted or not found: ${image.image_path}`);
      }
    }

    // 5. TRY TO DELETE THE PRODUCT FOLDER IF EMPTY
    try {
      const productFolder = path.join('/home/munene/storage/originals', productId);
      await rmdir(productFolder);
      console.log(`✅ Deleted empty folder: ${productFolder}`);
    } catch (err) {
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
  } finally {
    if (connection) await connection.end();
  }
}