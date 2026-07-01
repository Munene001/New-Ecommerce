// app/api/shopowner/products/[productId]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';
import { verifyShopAccess } from '@/lib/role/helper';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ProductRow extends RowDataPacket {
  shop_id: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface ImageRow extends RowDataPacket {
  image_path: string;
  is_primary: number;
}

interface ImageInsertResult extends ResultSetHeader {
  insertId: number;
}

async function getShopIdFromProduct(productId: number): Promise<number | null> {
  const [rows] = await pool.query<ProductRow[]>(
    'SELECT shop_id FROM products WHERE product_id = ?',
    [productId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;

    const formData = await req.formData();
    const file = formData.get('image') as File;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalSizeKb = Math.round(buffer.length / 1024);
    
    if (originalSizeKb > 8000) {
      return NextResponse.json({ error: 'Image too large. Max 5MB.' }, { status: 400 });
    }

    const [countRows] = await pool.query<CountRow[]>(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [productIdNum]
    );
    if (countRows[0].count >= 6) {
      return NextResponse.json({ error: 'Maximum 6 images per product' }, { status: 400 });
    }

    const quality = originalSizeKb <= 150 ? 80 : 65;
    
    const webpBuffer = await sharp(buffer)
      .resize(1000, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality, effort: 4 })
      .toBuffer();
    
    const finalSizeKb = Math.round(webpBuffer.length / 1024);

    const filename = `${Date.now()}-${randomUUID().split('-')[0]}.webp`;
    const relativePath = `/${productIdNum}/${filename}`;
    const fullPath = path.join('/home/munene/storage/originals', productIdNum.toString(), filename);

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, webpBuffer);

    if (isPrimary) {
      await pool.query<ResultSetHeader>(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [productIdNum]
      );
    }

    const [result] = await pool.query<ImageInsertResult>(
      `INSERT INTO product_images (product_id, image_path, is_primary) 
       VALUES (?, ?, ?)`,
      [productIdNum, relativePath, isPrimary]
    );

    return NextResponse.json({
      success: true,
      image_id: result.insertId,
      image_path: relativePath,
      url: `/api/shopowner/products/${productIdNum}/images?imageId=${result.insertId}`,
      is_primary: isPrimary,
      size_kb: finalSizeKb,
      quality_used: quality,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// ✅ NEW: DELETE function for removing images
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

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('imageId');

    if (!imageId || !/^\d+$/.test(imageId)) {
      return NextResponse.json({ error: 'Valid imageId required' }, { status: 400 });
    }

    const imageIdNum = parseInt(imageId, 10);

    // Verify shop access
    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;

    // Get image path and check if it's primary
    const [imageRows] = await pool.query<ImageRow[]>(
      'SELECT image_path, is_primary FROM product_images WHERE image_id = ? AND product_id = ?',
      [imageIdNum, productIdNum]
    );

    if (!imageRows || imageRows.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imagePath = imageRows[0].image_path;
    const isPrimary = imageRows[0].is_primary === 1;

    // Delete from database
    await pool.query<ResultSetHeader>(
      'DELETE FROM product_images WHERE image_id = ? AND product_id = ?',
      [imageIdNum, productIdNum]
    );

    // If it was primary, set another image as primary
    if (isPrimary) {
      await pool.query<ResultSetHeader>(
        'UPDATE product_images SET is_primary = 1 WHERE product_id = ? LIMIT 1',
        [productIdNum]
      );
    }

    // Delete physical file
    const fullPath = path.join('/home/munene/storage/originals', imagePath);
    try {
      await unlink(fullPath);
    } catch (error) {
     
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      wasPrimary: isPrimary
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}