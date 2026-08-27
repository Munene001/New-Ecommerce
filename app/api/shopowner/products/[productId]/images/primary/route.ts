import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { verifyShopAccess } from '@/lib/role/helper';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ImageRow extends RowDataPacket {
  image_path: string;
}

interface ImageMetadataRow extends RowDataPacket {
  image_id: number;
  image_path: string;
  is_primary: number;
  created_at: Date;
}

interface ProductRow extends RowDataPacket {
  shop_id: number;
}

const STORAGE_PATH = '/home/munene/storage/originals';
const ALLOWED_WIDTHS = [200, 300, 600, 800, 1200];

async function getShopIdFromProduct(productId: number): Promise<number | null> {
  const [rows] = await pool.query<ProductRow[]>(
    'SELECT shop_id FROM products WHERE product_id = ?',
    [productId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  try {
    if (!/^\d+$/.test(productId)) {
      return new Response('Invalid product ID', { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    // Case 1: Return JSON metadata for all product images
    if (mode === 'all') {
      const [imageRows] = await pool.query<ImageMetadataRow[]>(
        `SELECT image_id, image_path, is_primary, created_at
         FROM product_images 
         WHERE product_id = ?
         ORDER BY is_primary DESC, created_at DESC`,
        [productId]
      );
      return NextResponse.json(imageRows);
    }

    // Case 2 & 3: Serve processed binary image
    const width = parseInt(searchParams.get('w') || '600', 10);
    const quality = parseInt(searchParams.get('q') || '80', 10);
    const imageId = searchParams.get('imageId');

    if (!ALLOWED_WIDTHS.includes(width)) {
      return new Response('Invalid width parameter', { status: 400 });
    }

    // Query specific image or primary image
    let query = 'SELECT image_path FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1';
    let queryParams: any[] = [productId];

    if (imageId) {
      if (!/^\d+$/.test(imageId)) {
        return new Response('Invalid image ID', { status: 400 });
      }
      query = 'SELECT image_path FROM product_images WHERE image_id = ? AND product_id = ?';
      queryParams = [imageId, productId];
    }

    const [imageRows] = await pool.query<ImageRow[]>(query, queryParams);

    if (!imageRows || imageRows.length === 0) {
      return new Response('Image record not found', { status: 404 });
    }

    const fullPath = path.join(STORAGE_PATH, imageRows[0].image_path);

    try {
      await fs.access(fullPath);
    } catch {
      return new Response('File missing on storage server', { status: 404 });
    }

    const imageBuffer = await fs.readFile(fullPath);

    // Serve original file without Sharp processing for large widths
    if (width >= 1200) {
      return new Response(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    }

    // Resize and convert image to WebP
    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, null, {
        fit: 'cover',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return new Response(new Uint8Array(resizedBuffer), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });

  } catch (error) {
    console.error('Image service error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function PATCH(
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
    const { imageId } = body;

    if (!imageId || !/^\d+$/.test(String(imageId))) {
      return NextResponse.json({ error: 'Valid imageId required' }, { status: 400 });
    }

    const imageIdNum = parseInt(String(imageId), 10);

    const shopId = await getShopIdFromProduct(productIdNum);
    if (!shopId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;

    const [checkRows] = await pool.query<ImageRow[]>(
      'SELECT image_id FROM product_images WHERE image_id = ? AND product_id = ?',
      [imageIdNum, productIdNum]
    );

    if (!checkRows || checkRows.length === 0) {
      return NextResponse.json({ error: 'Image not found for this product' }, { status: 404 });
    }

    await pool.query<ResultSetHeader>(
      'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
      [productIdNum]
    );

    await pool.query<ResultSetHeader>(
      'UPDATE product_images SET is_primary = 1 WHERE image_id = ? AND product_id = ?',
      [imageIdNum, productIdNum]
    );

    return NextResponse.json({
      success: true,
      message: 'Primary image updated successfully',
      imageId: imageIdNum
    });
  } catch (error) {
    console.error('Set primary image error:', error);
    return NextResponse.json({ error: 'Failed to set primary image' }, { status: 500 });
  }
}