// app/api/shopowner/banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OwnerCheckRow extends RowDataPacket {
  1: number;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface BannerRow extends RowDataPacket {
  banner_url: string;
}

interface BannerInsertResult extends ResultSetHeader {
  insertId: number;
}

async function verifyShopOwnership(shopId: number, supabaseUid: string): Promise<boolean> {
  const [rows] = await pool.query<OwnerCheckRow[]>(
    `SELECT 1
     FROM shops s
     JOIN tenant t ON s.tenant_id = t.tenant_id
     JOIN users u ON t.user_id = u.user_id
     WHERE s.shop_id = ? AND u.supabase_uid = ?`,
    [shopId, supabaseUid]
  );
  return rows.length > 0;
}

// GET - Get all banners for a shop
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shopSlug = searchParams.get('shopSlug');

    if (!shopSlug) {
      return NextResponse.json({ error: 'shopSlug required' }, { status: 400 });
    }

    // Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shopId = shopRows[0].shop_id;

    // Verify ownership
    const isOwner = await verifyShopOwnership(shopId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all banners for this shop (no date fields)
    const [banners] = await pool.query<RowDataPacket[]>(
      `SELECT 
        banner_id,
        banner_url,
        link_url,
        category_id,
        is_active,
        created_at
       FROM shop_banners
       WHERE shop_id = ?
       ORDER BY created_at DESC`,
      [shopId]
    );

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error('Get banners error:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST - Upload new banner
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const shopSlug = formData.get('shopSlug') as string;
    const file = formData.get('image') as File;

    if (!shopSlug || !file) {
      return NextResponse.json({ error: 'shopSlug and image are required' }, { status: 400 });
    }

    // Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shopId = shopRows[0].shop_id;

    // Verify ownership
    const isOwner = await verifyShopOwnership(shopId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check banner count limit (max 6)
    const [countRows] = await pool.query<CountRow[]>(
      'SELECT COUNT(*) as count FROM shop_banners WHERE shop_id = ?',
      [shopId]
    );
    if (countRows[0].count >= 6) {
      return NextResponse.json({ error: 'Maximum 6 banners per shop' }, { status: 400 });
    }

    // Process image upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalSizeKb = Math.round(buffer.length / 1024);
    if (originalSizeKb > 5000) {
      return NextResponse.json({ error: 'Image too large. Max 5MB.' }, { status: 400 });
    }

    // Compress image
    let quality = 75;
    let compressed = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality, effort: 4 })
      .toBuffer();

    let fileSizeKb = Math.round(compressed.length / 1024);
    while (fileSizeKb > 200 && quality > 60) {
      quality -= 5;
      compressed = await sharp(buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      fileSizeKb = Math.round(compressed.length / 1024);
    }
    while (fileSizeKb > 200 && quality > 50) {
      quality -= 5;
      compressed = await sharp(buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      fileSizeKb = Math.round(compressed.length / 1024);
    }

    // Save file
    const filename = `${Date.now()}-${randomUUID().split('-')[0]}.webp`;
    const relativePath = `/banners/${shopId}/${filename}`;
    const fullPath = path.join('/home/munene/storage/originals', relativePath);

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, compressed);

    // Insert banner record (no date fields)
    const [result] = await pool.query<BannerInsertResult>(
      `INSERT INTO shop_banners 
       (shop_id, banner_url, link_url, category_id, is_active) 
       VALUES (?, ?, ?, ?, 0)`,
      [
        shopId,
        relativePath,
        null,
        null
      ]
    );

    const bannerId = result.insertId;

    return NextResponse.json({
      success: true,
      banner_id: bannerId,
      banner_url: relativePath,
      message: 'Banner uploaded successfully'
    });

  } catch (error) {
    console.error('Upload banner error:', error);
    return NextResponse.json({ error: 'Failed to upload banner' }, { status: 500 });
  }
}

// PUT - Update banner (link, category, activate)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      banner_id,
      shopSlug,
      link_url,
      category_id,
      activate
    } = await request.json();

    if (!banner_id || !shopSlug) {
      return NextResponse.json({ error: 'banner_id and shopSlug required' }, { status: 400 });
    }

    // Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shopId = shopRows[0].shop_id;

    // Verify ownership
    const isOwner = await verifyShopOwnership(shopId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If activating, deactivate all other banners first
    if (activate === true) {
      await pool.query<ResultSetHeader>(
        'UPDATE shop_banners SET is_active = 0 WHERE shop_id = ?',
        [shopId]
      );
      await pool.query<ResultSetHeader>(
        `UPDATE shop_banners SET is_active = 1, link_url = ?, category_id = ? 
         WHERE banner_id = ? AND shop_id = ?`,
        [link_url || null, category_id || null, banner_id, shopId]
      );
    } else {
      // Update banner fields only (no activation)
      const updateFields: string[] = [];
      const updateValues: (string | number | null)[] = [];

      if (link_url !== undefined) {
        updateFields.push('link_url = ?');
        updateValues.push(link_url || null);
      }
      if (category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(category_id || null);
      }

      if (updateFields.length > 0) {
        updateValues.push(banner_id, shopId);
        await pool.query<ResultSetHeader>(
          `UPDATE shop_banners SET ${updateFields.join(', ')} WHERE banner_id = ? AND shop_id = ?`,
          updateValues
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: activate ? 'Banner activated' : 'Banner updated successfully'
    });

  } catch (error) {
    console.error('Update banner error:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE - Delete banner
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const banner_id = searchParams.get('banner_id');
    const shopSlug = searchParams.get('shopSlug');

    if (!banner_id || !shopSlug) {
      return NextResponse.json({ error: 'banner_id and shopSlug required' }, { status: 400 });
    }

    // Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    const shopId = shopRows[0].shop_id;

    // Verify ownership
    const isOwner = await verifyShopOwnership(shopId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get banner URL before deleting
    const [bannerRows] = await pool.query<BannerRow[]>(
      'SELECT banner_url FROM shop_banners WHERE banner_id = ? AND shop_id = ?',
      [banner_id, shopId]
    );

    if (bannerRows.length === 0) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const bannerUrl = bannerRows[0].banner_url;
    const fullPath = path.join('/home/munene/storage/originals', bannerUrl);

    // Delete from database
    await pool.query<ResultSetHeader>(
      'DELETE FROM shop_banners WHERE banner_id = ? AND shop_id = ?',
      [banner_id, shopId]
    );

    // Delete file from storage
    try {
      await unlink(fullPath);
    } catch {
      console.log('File already deleted or not found:', bannerUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('Delete banner error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}