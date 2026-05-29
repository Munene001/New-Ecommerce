// app/api/shopowner/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ShopRow extends RowDataPacket {
  shop_id: number;
  tenant_id: number;
}

interface UpdateBody {
  shopId: number;
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

    const { authorized, response } = await verifyShopAccess(request, shopId);
    if (!authorized) return response;

    const [shopRows] = await pool.query<ShopRow[]>(
      `SELECT tenant_id FROM shops WHERE shop_id = ?`,
      [shopId]
    );
    
    if (shopRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }
    
    const tenantId = shopRows[0].tenant_id;
    let newSlug: string | null = null;

    if (shop_name !== undefined) {
      let slug = shop_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const [existingSlugs] = await pool.query<RowDataPacket[]>(
        `SELECT business_slug FROM tenant WHERE (business_slug = ? OR business_slug LIKE ?) AND tenant_id != ?`,
        [slug, `${slug}-%`, tenantId]
      );
      
      if (existingSlugs.length > 0) {
        let maxNumber = 0;
        existingSlugs.forEach((row: any) => {
          const match = row.business_slug.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        });
        slug = `${slug}-${maxNumber + 1}`;
      }
      
      newSlug = slug;
      
      await pool.query(
        `UPDATE tenant SET business_name = ?, business_slug = ? WHERE tenant_id = ?`,
        [shop_name, slug, tenantId]
      );
      
      await pool.query(
        `UPDATE shops SET shop_name = ?, shop_slug = ? WHERE shop_id = ?`,
        [shop_name, slug, shopId]
      );
    }

    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

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

    // Check if we're updating any of the completion fields
    const isUpdatingCompletionFields = 
      contact_phone !== undefined || 
      business_town !== undefined || 
      business_address !== undefined;

    if (updateFields.length > 0) {
      updateValues.push(shopId);
      await pool.query<ResultSetHeader>(
        `UPDATE shops SET ${updateFields.join(', ')} WHERE shop_id = ?`,
        updateValues
      );
    }

    // After updating, check if all completion fields are now filled and update the flag
    if (isUpdatingCompletionFields) {
      const [currentShop] = await pool.query<RowDataPacket[]>(
        `SELECT contact_phone, business_town, business_address 
         FROM shops 
         WHERE shop_id = ?`,
        [shopId]
      );
      
      if (currentShop.length > 0) {
        const shop = currentShop[0];
        const hasAllData = !!(
          shop.contact_phone?.trim() && 
          shop.contact_phone !== 'Not set' &&
          shop.business_town?.trim() && 
          shop.business_town !== 'Not set' &&
          shop.business_address?.trim() && 
          shop.business_address !== 'Not set'
        );
        
        if (hasAllData) {
          await pool.query(
            `UPDATE shops SET business_info_complete = 1 WHERE shop_id = ?`,
            [shopId]
          );
        }
      }
    }

    if (whatsapp_number !== undefined) {
      await pool.query<ResultSetHeader>(
        `INSERT INTO shop_settings (shop_id, whatsapp_number) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE whatsapp_number = ?`,
        [shopId, whatsapp_number, whatsapp_number]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shop settings updated successfully',
      newSlug: newSlug
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