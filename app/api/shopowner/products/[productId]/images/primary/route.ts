import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ImageRow extends RowDataPacket {
  image_path: string;
}

interface ImageMetadataRow extends RowDataPacket {
  image_id: number;
  image_path: string;
  is_primary: number;
  created_at: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  try {
    if (!/^\d+$/.test(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('w') || '600');
    const quality = parseInt(searchParams.get('q') || '80');
    const mode = searchParams.get('mode');
    const imageId = searchParams.get('imageId');

    const allowedWidths = [200, 300, 800, 1200];
    if (!allowedWidths.includes(width)) {
      return NextResponse.json(
        { error: 'Invalid width. Use 200, 300, 800, or 1200' },
        { status: 400 }
      );
    }

    // Helper function to return image response
    const createImageResponse = (buffer: Buffer) => {
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    };

    // ----- Case 1: Specific image requested by imageId -----
    if (imageId) {
      if (!/^\d+$/.test(imageId)) {
        return NextResponse.json(
          { error: 'Invalid image ID' },
          { status: 400 }
        );
      }

      const [imageRows] = await pool.query<ImageRow[]>(
        'SELECT image_path FROM product_images WHERE image_id = ? AND product_id = ?',
        [imageId, productId]
      );

      if (!imageRows || imageRows.length === 0) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }

      const imagePath = imageRows[0].image_path;
      const fullPath = path.join('/home/munene/storage/originals', imagePath);

      try {
        await fs.access(fullPath);
      } catch {
        return NextResponse.json(
          { error: 'Image file not found' },
          { status: 404 }
        );
      }

      const imageBuffer = await fs.readFile(fullPath);

      // Serve original if width >= 1200
      if (width >= 1200) {
        return createImageResponse(imageBuffer);
      }

      // Resize and convert to WebP
      const resizedBuffer = await sharp(imageBuffer)
        .resize(width, null, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();

      return createImageResponse(resizedBuffer);
    }

    // ----- Case 2: Return metadata for all images (mode=all) -----
    if (mode === 'all') {
      const [imageRows] = await pool.query<ImageMetadataRow[]>(
        `SELECT 
          image_id,
          image_path,
          is_primary,
          created_at
        FROM product_images 
        WHERE product_id = ?
        ORDER BY is_primary DESC, created_at DESC`,
        [productId]
      );

      return NextResponse.json(imageRows);
    }

    // ----- Case 3: Default – return primary image -----
    const [imageRows] = await pool.query<ImageRow[]>(
      'SELECT image_path FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1',
      [productId]
    );

    if (!imageRows || imageRows.length === 0) {
      return NextResponse.json(
        { error: 'Primary image not found' },
        { status: 404 }
      );
    }

    const imagePath = imageRows[0].image_path;
    const fullPath = path.join('/home/munene/storage/originals', imagePath);

    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'Image file not found' },
        { status: 404 }
      );
    }

    const imageBuffer = await fs.readFile(fullPath);

    if (width >= 1200) {
      return createImageResponse(imageBuffer);
    }

    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, null, {
        fit: 'cover',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return createImageResponse(resizedBuffer);

  } catch (error) {
    console.error('Serve error:', error);
    return NextResponse.json(
      { error: 'Error processing image' },
      { status: 500 }
    );
  }
}