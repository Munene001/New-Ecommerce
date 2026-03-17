import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { getConnection } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  let connection;
  try {
    if (!/^\d+$/.test(productId)) {
      return new NextResponse('Invalid product ID', { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('w') || '600');
    const quality = parseInt(searchParams.get('q') || '80');
    const mode = searchParams.get('mode'); // 'primary' or 'all' (optional)
    const imageId = searchParams.get('imageId'); // new: fetch a specific image

    const allowedWidths = [200, 300, 800, 1200];
    if (!allowedWidths.includes(width)) {
      return new NextResponse('Invalid width. Use 200, 300, 800, or 1200', { status: 400 });
    }

    connection = await getConnection();

    // ----- Case 1: Specific image requested by imageId -----
    if (imageId) {
      if (!/^\d+$/.test(imageId)) {
        return new NextResponse('Invalid image ID', { status: 400 });
      }

      const [imageRows] = await connection.query(
        'SELECT image_path FROM product_images WHERE image_id = ? AND product_id = ?',
        [imageId, productId]
      );

      if (!imageRows || (imageRows as any[]).length === 0) {
        return new NextResponse('Image not found', { status: 404 });
      }

      const imagePath = (imageRows as any[])[0].image_path;
      const fullPath = path.join('/home/munene/storage/originals', imagePath);

      try {
        await fs.access(fullPath);
      } catch {
        return new NextResponse('Image file not found', { status: 404 });
      }

      const imageBuffer = await fs.readFile(fullPath);

      // Serve original if width >= 1200
      if (width >= 1200) {
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=86400, immutable'
          }
        });
      }

      // Resize and convert to WebP
      const resizedBuffer = await sharp(imageBuffer)
        .resize(width, null, {
          fit: 'cover',
          withoutEnlargement: true
        })
        .webp({ quality })
        .toBuffer();

      return new NextResponse(resizedBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, immutable'
        }
      });
    }

    // ----- Case 2: Return metadata for all images (mode=all) -----
    if (mode === 'all') {
      const [imageRows] = await connection.query(
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
    const [imageRows] = await connection.query(
      'SELECT image_path FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1',
      [productId]
    );

    if (!imageRows || (imageRows as any[]).length === 0) {
      return new NextResponse('Primary image not found', { status: 404 });
    }

    const imagePath = (imageRows as any[])[0].image_path;
    const fullPath = path.join('/home/munene/storage/originals', imagePath);

    try {
      await fs.access(fullPath);
    } catch {
      return new NextResponse('Image file not found', { status: 404 });
    }

    const imageBuffer = await fs.readFile(fullPath);

    if (width >= 1200) {
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, immutable'
        }
      });
    }

    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, null, {
        fit: 'cover',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(resizedBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, immutable'
      }
    });

  } catch (error) {
    console.error('Serve error:', error);
    return new NextResponse('Error processing image', { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}