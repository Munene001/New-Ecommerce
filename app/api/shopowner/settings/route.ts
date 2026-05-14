// app/api/shopowner/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

interface UpdateBody {
  shopId: number;  // Changed from shopSlug to shopId
  shop_name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  business_town?: string;
  business_address?: string;
  whatsapp_number?: string;
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Parse request body
    const body: UpdateBody = await request.json();
    const { 
      shopId,
      shop_name, 
      description, 
      contact_email, 
      contact_phone,
      business_town,
      business_address,
      whatsapp_number 
    } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    // 2. Verify access using helper
    const { authorized, response } = await verifyShopAccess(request, shopId);
    
    if (!authorized) {
      return response;
    }

    // 3. Update shops table
    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

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
      await pool.query<ResultSetHeader>(
        `UPDATE shops SET ${updateFields.join(', ')} WHERE shop_id = ?`,
        updateValues
      );
    }

    // 4. Update shop_settings table (whatsapp_number)
    if (whatsapp_number !== undefined) {
      await pool.query<ResultSetHeader>(
        `UPDATE shop_settings SET whatsapp_number = ? WHERE shop_id = ?`,
        [whatsapp_number, shopId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shop settings updated successfully'
    });

  } catch (error) {
    console.error('Update shop settings error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update shop settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}