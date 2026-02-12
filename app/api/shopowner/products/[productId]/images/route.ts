import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getConnection } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  let connection;
  try {
    const productId = params.productId;
    
    // Validate productId
    if (!/^\d+$/.test(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // ✅ MAX 5MB
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalSizeKb = Math.round(buffer.length / 1024);
    if (originalSizeKb > 5000) {
      return NextResponse.json({ 
        error: 'Image too large. Max 5MB.' 
      }, { status: 400 });
    }

    connection = await getConnection();

    // Check image count (max 6)
    const [countRows] = await connection.query(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [productId]
    );
    
    if ((countRows as any[])[0].count >= 6) {
      return NextResponse.json({ 
        error: 'Maximum 6 images per product' 
      }, { status: 400 });
    }

    // SMART COMPRESSION - WebP, target 150-200KB
    let quality = 80;
    let compressed = await sharp(buffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ 
        quality,
        effort: 4
      })
      .toBuffer();
    
    let fileSizeKb = Math.round(compressed.length / 1024);
    
    // Reduce quality until under 200KB or minimum quality 60
    while (fileSizeKb > 200 && quality > 60) {
      quality -= 5;
      compressed = await sharp(buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      fileSizeKb = Math.round(compressed.length / 1024);
    }

    console.log(`📸 Upload: ${originalSizeKb}KB → ${fileSizeKb}KB (q${quality})`);

    // Generate filename
    const filename = `${Date.now()}-${randomUUID().split('-')[0]}.webp`;
    const relativePath = `/${productId}/${filename}`;
    const fullPath = path.join('/home/munene/storage/originals', productId, filename);

    // Save file
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, compressed);

    // Handle primary image
    if (isPrimary) {
      await connection.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [productId]
      );
    }

    // Save to database
    const [result] = await connection.query(
      `INSERT INTO product_images (product_id, image_path, is_primary) 
       VALUES (?, ?, ?)`,
      [productId, relativePath, isPrimary]
    );

    const imageId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      image_id: imageId,
      image_path: relativePath,
      url: `/api/shopowner/product/${productId}/images/${imageId}`,
      is_primary: isPrimary,
      size_kb: fileSizeKb,
      quality_used: quality
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}