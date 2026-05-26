// app/api/shopowner/wizard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
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
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.business_info_complete 
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       JOIN shops s ON s.tenant_id = t.tenant_id
       WHERE s.shop_id = ? AND u.supabase_uid = ?`,
      [shopId, user.id]
    );
    
    const isComplete = rows[0]?.business_info_complete === 1;
    
    return NextResponse.json({ completed: isComplete });
    
  } catch (error) {
    console.error('Error checking wizard status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, business_town, business_address, shopId } = await request.json();
    
    if (!phone || !business_town || !business_address || !shopId) {
      return NextResponse.json(
        { error: 'All fields and shopId are required' },
        { status: 400 }
      );
    }
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify shop access
    const { authorized, response } = await verifyShopAccess(request, parseInt(shopId));
    if (!authorized) return response;
    
    // Get user_id, tenant_id, and email
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.user_id, u.email, t.tenant_id 
       FROM users u 
       JOIN tenant t ON u.user_id = t.user_id 
       JOIN shops s ON s.tenant_id = t.tenant_id
       WHERE s.shop_id = ? AND u.supabase_uid = ?`,
      [shopId, user.id]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User or shop not found' }, { status: 404 });
    }
    
    const userId = rows[0].user_id;
    const tenantId = rows[0].tenant_id;
    const email = rows[0].email;
    
    // Derive full_name from email (fixed TypeScript error)
    let fullName = email.split('@')[0];
    fullName = fullName.replace(/\./g, ' ');
    fullName = fullName.replace(/\b\w/g, (char: string) => char.toUpperCase());
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Update users table (only phone, name derived from email)
      await connection.query(
        `UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?`,
        [fullName, phone, userId]
      );
      
      // 2. Update tenant table (mark as complete)
      await connection.query(
        `UPDATE tenant SET business_town = ?, business_address = ?, business_info_complete = 1 WHERE tenant_id = ?`,
        [business_town, business_address, tenantId]
      );
      
      // 3. Update shops table (sync the values)
      await connection.query(
        `UPDATE shops SET business_town = ?, business_address = ?, contact_phone = ? WHERE shop_id = ?`,
        [business_town, business_address, phone, shopId]
      );
      
      await connection.commit();
      
      return NextResponse.json({ 
        success: true,
        message: 'Wizard completed successfully'
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Wizard completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    );
  }
}