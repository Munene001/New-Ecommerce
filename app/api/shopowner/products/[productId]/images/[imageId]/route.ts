import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { getConnection } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string; imageId: string } }
) {
  let connection;
  try {
    const { productId, imageId } = params;
    
    // Validate productId
    if (!/^\d+$/.test(productId)) {
      return new NextResponse('Invalid product ID', { status: 400 });
    }

    // Get resize parameters (default to 600 for product page)
    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('w') || '600');
    const quality = parseInt(searchParams.get('q') || '80');

    // Only allow our 3 standard sizes
    const allowedWidths = [200, 600, 1200];
    if (!allowedWidths.includes(width)) {
      return new NextResponse('Invalid width. Use 200, 600, or 1200', { status: 400 });
    }

    connection = await getConnection();

    // Get image path from database
    const [imageRows] = await connection.query(
      'SELECT image_path FROM product_images WHERE image_id = ?',
      [imageId]
    );

    if (!imageRows || (imageRows as any[]).length === 0) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imagePath = (imageRows as any[])[0].image_path;
    const fullPath = path.join('/home/munene/storage/originals', imagePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return new NextResponse('Image file not found', { status: 404 });
    }

    // Read image
    const imageBuffer = await fs.readFile(fullPath);
    
    // If width is 1200 or more, serve original (no resize needed)
    if (width >= 1200) {
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, immutable'
        }
      });
    }

    // Resize to requested width (maintain aspect ratio)
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