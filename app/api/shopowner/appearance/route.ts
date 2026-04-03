// app/api/shopowner/appearance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OwnerCheckRow extends RowDataPacket {
  1: number;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
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

export async function PUT(request: NextRequest) {
  try {
    // 1. Get authenticated user from session cookie
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { 
      shopSlug,
      header_message,
      cart_icon,
      secondary_color
    } = await request.json();

    if (!shopSlug) {
      return NextResponse.json(
        { success: false, error: 'shopSlug is required' },
        { status: 400 }
      );
    }

    // 3. Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (shopRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }
    
    const shopId = shopRows[0].shop_id;

    // 4. Verify ownership
    const isOwner = await verifyShopOwnership(shopId, user.id);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 5. Build update query for shop_settings
    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

    if (header_message !== undefined) {
      updateFields.push('header_message = ?');
      updateValues.push(header_message);
    }

    if (cart_icon !== undefined) {
      const validCartIcons = ['cart', 'bag', 'basket'];
      if (!validCartIcons.includes(cart_icon)) {
        return NextResponse.json(
          { success: false, error: 'Invalid cart_icon. Must be cart, bag, or basket' },
          { status: 400 }
        );
      }
      updateFields.push('cart_icon = ?');
      updateValues.push(cart_icon);
    }

    if (secondary_color !== undefined) {
      // Validate hex color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(secondary_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid secondary_color format. Use hex like #f54a00' },
          { status: 400 }
        );
      }
      updateFields.push('secondary_color = ?');
      updateValues.push(secondary_color);
    }

    // 6. Execute update if there are fields to update
    if (updateFields.length > 0) {
      updateValues.push(shopId);
      await pool.query<ResultSetHeader>(
        `UPDATE shop_settings SET ${updateFields.join(', ')} WHERE shop_id = ?`,
        updateValues
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appearance settings updated successfully'
    });

  } catch (error) {
    console.error('Update appearance error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update appearance settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}