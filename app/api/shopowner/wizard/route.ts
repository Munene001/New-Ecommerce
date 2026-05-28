// app/api/shopowner/wizard/route.ts (CLEANED)
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 });
    }
    
    const { authorized, response } = await verifyShopAccess(request, parseInt(shopId));
    if (!authorized) return response;
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         contact_phone,
         business_town,
         business_address,
         business_info_complete
       FROM shops 
       WHERE shop_id = ?`,
      [shopId]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ completed: false });
    }
    
    const shop = rows[0];
    
    const hasAllData = !!(
      shop.contact_phone?.trim() && 
      shop.contact_phone !== 'Not set' &&
      shop.business_town?.trim() && 
      shop.business_town !== 'Not set' &&
      shop.business_address?.trim() && 
      shop.business_address !== 'Not set'
    );
    
    const isComplete = shop.business_info_complete === 1 && hasAllData;
    
    if (!isComplete && hasAllData) {
      await pool.query(
        `UPDATE shops SET business_info_complete = 1 WHERE shop_id = ?`,
        [shopId]
      );
      return NextResponse.json({ completed: true });
    }
    
    const existingData = {
      phone: shop.contact_phone || '',
      business_town: shop.business_town || '',
      business_address: shop.business_address || ''
    };
    
    return NextResponse.json({ 
      completed: isComplete,
      existingData: !isComplete ? existingData : null
    });
    
  } catch (error) {
    console.error('[Wizard GET] Error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, business_town, business_address, shopId, whatsapp_number } = await request.json();
    
    if (!phone?.trim() || phone === 'Not set') {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }
    
    if (!business_town?.trim() || business_town === 'Not set') {
      return NextResponse.json({ error: 'Valid town/city is required' }, { status: 400 });
    }
    
    if (!business_address?.trim() || business_address === 'Not set') {
      return NextResponse.json({ error: 'Valid business address is required' }, { status: 400 });
    }
    
    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }
    
    const { authorized, response } = await verifyShopAccess(request, parseInt(shopId));
    if (!authorized) return response;
    
    const cleanPhone = phone.trim();
    const cleanTown = business_town.trim();
    const cleanAddress = business_address.trim();
    const cleanWhatsapp = whatsapp_number?.trim();
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      await connection.query(
        `UPDATE shops 
         SET contact_phone = ?,
             business_town = ?,
             business_address = ?,
             business_info_complete = 1
         WHERE shop_id = ?`,
        [cleanPhone, cleanTown, cleanAddress, shopId]
      );
      
      if (cleanWhatsapp) {
        await connection.query(
          `INSERT INTO shop_settings (shop_id, whatsapp_number) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE whatsapp_number = ?`,
          [shopId, cleanWhatsapp, cleanWhatsapp]
        );
      }
      
      await connection.commit();
      
      return NextResponse.json({ 
        success: true,
        message: 'Setup completed successfully'
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('[Wizard POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    );
  }
}