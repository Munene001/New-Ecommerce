// app/api/shops/[shopSlug]/banner-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface BannerRow extends RowDataPacket {
  banner_url: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const width = parseInt(searchParams.get('w') || '1200');
    const quality = parseInt(searchParams.get('q') || '80');
    const bannerId = searchParams.get('bannerId');

    const allowedWidths = [200, 300, 800, 1200];
    if (!allowedWidths.includes(width)) {
      return NextResponse.json(
        { error: 'Invalid width. Use 200, 300, 800, or 1200' },
        { status: 400 }
      );
    }

    let query: string;
    let queryParams: (string | number)[];

    // Case 1: Specific banner requested (for dashboard list)
    if (bannerId) {
      query = `
        SELECT sb.banner_url
        FROM shop_banners sb
        JOIN shops s ON sb.shop_id = s.shop_id
        WHERE s.shop_slug = ? AND sb.banner_id = ?
      `;
      queryParams = [shopSlug, bannerId];
    } 
    // Case 2: Default - return active banner (for public shop)
    else {
      query = `
        SELECT sb.banner_url
        FROM shop_banners sb
        JOIN shops s ON sb.shop_id = s.shop_id
        WHERE s.shop_slug = ?
          AND sb.is_active = 1
        LIMIT 1
      `;
      queryParams = [shopSlug];
    }

    const [bannerRows] = await pool.query<BannerRow[]>(query, queryParams);

    if (!bannerRows || bannerRows.length === 0) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    const bannerUrl = bannerRows[0].banner_url;
    const fullPath = path.join('/home/munene/storage/originals', bannerUrl);

    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'Banner image not found' },
        { status: 404 }
      );
    }

    const imageBuffer = await fs.readFile(fullPath);

    // Serve original if width >= 1200
    if (width >= 1200) {
      return new NextResponse(imageBuffer as any, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      });
    }

    // Resize and convert to WebP
    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, null, {
        fit: 'cover',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(resizedBuffer as any, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });

  } catch (error) {
    console.error('Serve banner error:', error);
    return NextResponse.json(
      { error: 'Error processing banner' },
      { status: 500 }
    );
  }
}