// api/shopowner/payments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface PaymentSettingsRow extends RowDataPacket {
  payment_setting_id: number;
  shop_id: number;
  cod_enabled: number;
  active_payment_type: 'direct_mpesa' | 'stk_push' | null;
}

interface DirectMpesaRow extends RowDataPacket {
  direct_mpesa_id: number;
  payment_setting_id: number;
  type: 'paybill' | 'till' | 'pochi' | 'send_money';
  business_number: string | null;
  account_number: string | null;
  till_number: string | null;
  phone_number: string | null;
}

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
}

// Helper to verify that the user owns the shop
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

// Helper to get or create payment settings for a shop
async function getOrCreatePaymentSettings(shopId: number): Promise<number> {
  const [existing] = await pool.query<PaymentSettingsRow[]>(
    `SELECT payment_setting_id FROM shop_payment_settings WHERE shop_id = ?`,
    [shopId]
  );
  
  if (existing.length > 0) {
    return existing[0].payment_setting_id;
  }
  
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO shop_payment_settings (shop_id, cod_enabled, active_payment_type) VALUES (?, TRUE, NULL)`,
    [shopId]
  );
  
  return result.insertId;
}

// GET /api/shopowner/payments?shop_id=1
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create payment settings
    const paymentSettingId = await getOrCreatePaymentSettings(parseInt(shopId));
    
    // Fetch payment settings
    const [settings] = await pool.query<PaymentSettingsRow[]>(
      `SELECT payment_setting_id, shop_id, cod_enabled, active_payment_type
       FROM shop_payment_settings
       WHERE shop_id = ?`,
      [shopId]
    );
    
    const setting = settings[0];
    const codEnabled = setting.cod_enabled === 1;
    const activePaymentType = setting.active_payment_type;
    
    // Fetch direct mpesa if exists
    const [directMpesa] = await pool.query<DirectMpesaRow[]>(
      `SELECT direct_mpesa_id, type, business_number, account_number, till_number, phone_number
       FROM shop_direct_mpesa
       WHERE payment_setting_id = ?`,
      [paymentSettingId]
    );
    
    const hasDirectMpesa = directMpesa.length > 0;
    const hasStkPush = false; // TODO: Check shop_stk_push table when implemented
    const hasAnyMpesaConfig = hasDirectMpesa || hasStkPush;
    const canDisableCod = hasAnyMpesaConfig;
    
    return NextResponse.json({
      success: true,
      data: {
        cod_enabled: codEnabled,
        has_direct_mpesa: hasDirectMpesa,
        has_stk_push: hasStkPush,
        has_any_mpesa_config: hasAnyMpesaConfig,
        can_disable_cod: canDisableCod,
        active_payment_type: activePaymentType,
        direct_mpesa: hasDirectMpesa ? {
          type: directMpesa[0].type,
          business_number: directMpesa[0].business_number,
          account_number: directMpesa[0].account_number,
          till_number: directMpesa[0].till_number,
          phone_number: directMpesa[0].phone_number
        } : null,
        stk_push: null // TODO: Add when implemented
      }
    });
  } catch (error) {
    console.error('GET payment settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}

// PUT /api/shopowner/payments?shop_id=1 - Update COD status
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const body = await req.json();
    const { cod_enabled } = body;
    
    if (cod_enabled === undefined) {
      return NextResponse.json({ error: 'cod_enabled required' }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If disabling COD, check that another payment method exists
    if (cod_enabled === false) {
      const paymentSettingId = await getOrCreatePaymentSettings(parseInt(shopId));
      
      const [directMpesa] = await pool.query<DirectMpesaRow[]>(
        `SELECT 1 FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
        [paymentSettingId]
      );
      
      // TODO: Check STK Push when implemented
      const hasOtherPayment = directMpesa.length > 0;
      
      if (!hasOtherPayment) {
        return NextResponse.json({ 
          error: 'Cannot disable COD. Please configure Direct M-Pesa or STK Push first' 
        }, { status: 400 });
      }
    }
    
    // Update COD status
    await pool.query(
      `UPDATE shop_payment_settings SET cod_enabled = ? WHERE shop_id = ?`,
      [cod_enabled ? 1 : 0, shopId]
    );
    
    return NextResponse.json({
      success: true,
      message: `COD ${cod_enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('PUT COD status error:', error);
    return NextResponse.json({ error: 'Failed to update COD status' }, { status: 500 });
  }
}

// POST /api/shopowner/payments?shop_id=1 - Save Direct M-Pesa
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const body = await req.json();
    const { type, business_number, account_number, till_number, phone_number } = body;
    
    if (!type || !['paybill', 'till', 'pochi', 'send_money'].includes(type)) {
      return NextResponse.json({ error: 'Valid type required (paybill, till, pochi, send_money)' }, { status: 400 });
    }
    
    // Validate required fields based on type
    if (type === 'paybill' && !business_number) {
      return NextResponse.json({ error: 'business_number required for paybill' }, { status: 400 });
    }
    if ((type === 'till' || type === 'pochi') && !till_number) {
      return NextResponse.json({ error: 'till_number required for till/pochi' }, { status: 400 });
    }
    if (type === 'send_money' && !phone_number) {
      return NextResponse.json({ error: 'phone_number required for send_money' }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get or create payment settings
    const paymentSettingId = await getOrCreatePaymentSettings(parseInt(shopId));
    
    // Upsert direct mpesa configuration
    await pool.query(
      `INSERT INTO shop_direct_mpesa (payment_setting_id, type, business_number, account_number, till_number, phone_number)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       type = VALUES(type),
       business_number = VALUES(business_number),
       account_number = VALUES(account_number),
       till_number = VALUES(till_number),
       phone_number = VALUES(phone_number)`,
      [paymentSettingId, type, business_number || null, account_number || null, till_number || null, phone_number || null]
    );
    
    // Update active_payment_type to direct_mpesa
    await pool.query(
      `UPDATE shop_payment_settings SET active_payment_type = 'direct_mpesa' WHERE shop_id = ?`,
      [shopId]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Direct M-Pesa configuration saved successfully'
    });
  } catch (error) {
    console.error('POST direct mpesa error:', error);
    return NextResponse.json({ error: 'Failed to save Direct M-Pesa configuration' }, { status: 500 });
  }
}

// DELETE /api/shopowner/payments?shop_id=1 - Remove Direct M-Pesa
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseUid = user.id;

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body;
    
    // Only handle direct-mpesa deletion for now
    if (action !== 'direct-mpesa') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify ownership
    const isOwner = await verifyShopOwnership(parseInt(shopId), supabaseUid);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get payment setting id
    const paymentSettingId = await getOrCreatePaymentSettings(parseInt(shopId));
    
    // Delete direct mpesa configuration
    await pool.query(
      `DELETE FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
      [paymentSettingId]
    );
    
    // Check if STK Push exists (TODO when implemented)
    const hasStkPush = false;
    
    // Update active_payment_type to NULL if no other payment method
    if (!hasStkPush) {
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = NULL WHERE shop_id = ?`,
        [shopId]
      );
      
      // If COD is disabled, enable it
      const [settings] = await pool.query<PaymentSettingsRow[]>(
        `SELECT cod_enabled FROM shop_payment_settings WHERE shop_id = ?`,
        [shopId]
      );
      
      if (settings[0] && settings[0].cod_enabled === 0) {
        await pool.query(
          `UPDATE shop_payment_settings SET cod_enabled = 1 WHERE shop_id = ?`,
          [shopId]
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Direct M-Pesa configuration removed successfully'
    });
  } catch (error) {
    console.error('DELETE direct mpesa error:', error);
    return NextResponse.json({ error: 'Failed to remove Direct M-Pesa configuration' }, { status: 500 });
  }
}