import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';
import { validateToken } from '@/lib/auth-utlis';

export async function POST(
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

  try {
    // Verify product ownership
    const [productRows] = await pool.query(
      `SELECT p.product_id
       FROM products p
       JOIN shops s ON p.shop_id = s.shop_id
       JOIN tenant t ON s.tenant_id = t.tenant_id
       WHERE p.product_id = ? AND t.user_id = (
         SELECT user_id FROM users WHERE supabase_uid = ?
       )`,
      [productId, auth.supabaseUser.id]
    );
    if ((productRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [productId]
    );
    if ((countRows as any[])[0].count >= 6) {
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

    console.log(`📸 Upload: ${originalSizeKb}KB → ${fileSizeKb}KB (q${quality})`);

    const filename = `${Date.now()}-${randomUUID().split('-')[0]}.webp`;
    const relativePath = `/${productId}/${filename}`;
    const fullPath = path.join('/home/munene/storage/originals', productId, filename);

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, compressed);

    if (isPrimary) {
      await pool.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [productId]
      );
    }

    const [result] = await pool.query(
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
  }
}