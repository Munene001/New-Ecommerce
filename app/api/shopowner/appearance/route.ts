// app/api/shopowner/appearance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function PUT(request: NextRequest) {
  try {
    
    const { 
      shopId,
      header_message,
      cart_icon,
      secondary_color
    } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    // 2. Verify access using your helper
    const { authorized, response, role } = await verifyShopAccess(request, shopId);
    
    if (!authorized) {
      return response; // Returns 401/403 with appropriate message
    }

    // 3. Validate inputs
    if (cart_icon !== undefined) {
      const validCartIcons = ['cart', 'bag', 'basket'];
      if (!validCartIcons.includes(cart_icon)) {
        return NextResponse.json(
          { success: false, error: 'Invalid cart_icon. Must be cart, bag, or basket' },
          { status: 400 }
        );
      }
    }

    if (secondary_color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(secondary_color)) {
        return NextResponse.json(
          { success: false, error: 'Invalid secondary_color format. Use hex like #f54a00' },
          { status: 400 }
        );
      }
    }

    // 4. Build update query
    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

    if (header_message !== undefined) {
      updateFields.push('header_message = ?');
      updateValues.push(header_message);
    }

    if (cart_icon !== undefined) {
      updateFields.push('cart_icon = ?');
      updateValues.push(cart_icon);
    }

    if (secondary_color !== undefined) {
      updateFields.push('secondary_color = ?');
      updateValues.push(secondary_color);
    }

    // 5. Execute update
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