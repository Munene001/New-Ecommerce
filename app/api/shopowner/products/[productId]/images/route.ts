import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
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

interface ImageInsertResult extends ResultSetHeader {
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

    // Process upload
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalSizeKb = Math.round(buffer.length / 1024);
    if (originalSizeKb > 5000) {
      return NextResponse.json({ error: 'Image too large. Max 5MB.' }, { status: 400 });
    }

    const [countRows] = await pool.query<CountRow[]>(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [productIdNum]
    );
    if (countRows[0].count >= 6) {
      return NextResponse.json({ error: 'Maximum 6 images per product' }, { status: 400 });
    }

    let quality = 75;
    let compressed = await sharp(buffer)
      .resize(1000, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality, effort: 4 })
      .toBuffer();

    let fileSizeKb = Math.round(compressed.length / 1024);
    while (fileSizeKb > 200 && quality > 60) {
      quality -= 5;
      compressed = await sharp(buffer)
        .resize(1000, null, { withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      fileSizeKb = Math.round(compressed.length / 1024);
    }
    while (fileSizeKb > 200 && quality > 50) {
      quality -= 5;
      compressed = await sharp(buffer)
        .resize(1000, null, { withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      fileSizeKb = Math.round(compressed.length / 1024);
    }

  

    const filename = `${Date.now()}-${randomUUID().split('-')[0]}.webp`;
    const relativePath = `/${productIdNum}/${filename}`;
    const fullPath = path.join('/home/munene/storage/originals', productIdNum.toString(), filename);

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, compressed);

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

    const imageId = result.insertId;

    return NextResponse.json({
      success: true,
      image_id: imageId,
      image_path: relativePath,
      url: `/api/shopowner/product/${productIdNum}/images/${imageId}`,
      is_primary: isPrimary,
      size_kb: fileSizeKb,
      quality_used: quality
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}