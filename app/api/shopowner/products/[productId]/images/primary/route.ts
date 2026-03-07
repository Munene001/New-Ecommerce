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
    const mode = searchParams.get('mode') || 'primary'; // 'primary' or 'all'

    const allowedWidths = [200,300, 600, 1200];
    if (!allowedWidths.includes(width)) {
      return new NextResponse('Invalid width. Use 200,300, 600, or 1200', { status: 400 });
    }

    connection = await getConnection();

    if (mode === 'all') {
      // Return metadata for all images
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
    } else {
      // Return primary image
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
    }

  } catch (error) {
    console.error('Serve error:', error);
    return new NextResponse('Error processing image', { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}