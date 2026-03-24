// app/api/shopowner/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';

async function verifyShopOwnership(shopId: number, supabaseUid: string): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT 1
     FROM shops s
     JOIN tenant t ON s.tenant_id = t.tenant_id
     JOIN users u ON t.user_id = u.user_id
     WHERE s.shop_id = ? AND u.supabase_uid = ?`,
    [shopId, supabaseUid]
  );
  return (rows as any[]).length > 0;
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
      shop_name, 
      description, 
      contact_email, 
      contact_phone,
      business_town,
      business_address,
      whatsapp_number 
    } = await request.json();

    if (!shopSlug) {
      return NextResponse.json(
        { success: false, error: 'shopSlug is required' },
        { status: 400 }
      );
    }

    // 3. Get shop_id from slug
    const [shopRows] = await pool.query(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    ) as any[];
    
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

    // 5. Update shops table
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (shop_name !== undefined) {
      updateFields.push('shop_name = ?');
      updateValues.push(shop_name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    if (contact_email !== undefined) {
      updateFields.push('contact_email = ?');
      updateValues.push(contact_email);
    }
    
    if (contact_phone !== undefined) {
      updateFields.push('contact_phone = ?');
      updateValues.push(contact_phone);
    }

    if (business_town !== undefined) {
      updateFields.push('business_town = ?');
      updateValues.push(business_town);
    }

    if (business_address !== undefined) {
      updateFields.push('business_address = ?');
      updateValues.push(business_address);
    }

    if (updateFields.length > 0) {
      updateValues.push(shopId);
      await pool.query(
        `UPDATE shops SET ${updateFields.join(', ')} WHERE shop_id = ?`,
        updateValues
      );
    }

    // 6. Update shop_settings table (whatsapp_number)
    if (whatsapp_number !== undefined) {
      await pool.query(
        `UPDATE shop_settings SET whatsapp_number = ? WHERE shop_id = ?`,
        [whatsapp_number, shopId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shop settings updated successfully'
    });

  } catch (error: any) {
    console.error('Update shop settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update shop settings' },
      { status: 500 }
    );
  }
}