// api/shopowner/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
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

// Helper to get payment settings for a shop
async function getPaymentSettings(shopId: number): Promise<PaymentSettingsRow | null> {
  const [rows] = await pool.query<PaymentSettingsRow[]>(
    `SELECT payment_setting_id, shop_id, cod_enabled, active_payment_type 
     FROM shop_payment_settings 
     WHERE shop_id = ?`,
    [shopId]
  );
  return rows.length ? rows[0] : null;
}

// SHOPOWNER ONLY - GET payment settings for management
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shop_id');
    
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Get payment settings
    const settings = await getPaymentSettings(shopId);
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          cod_enabled: true,
          has_direct_mpesa: false,
          has_stk_push: false,
          has_any_mpesa_config: false,
          active_payment_type: null,
          direct_mpesa: null,
          stk_push: null
        }
      });
    }
    
    const codEnabled = settings.cod_enabled === 1;
    const activePaymentType = settings.active_payment_type;
    
    // Fetch direct mpesa if exists
    const [directMpesa] = await pool.query<DirectMpesaRow[]>(
      `SELECT direct_mpesa_id, type, business_number, account_number, till_number, phone_number
       FROM shop_direct_mpesa
       WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const hasDirectMpesa = directMpesa.length > 0;
    const hasStkPush = false; // TODO: Check when implemented
    const hasAnyMpesaConfig = hasDirectMpesa || hasStkPush;
    
    return NextResponse.json({
      success: true,
      data: {
        cod_enabled: codEnabled,
        has_direct_mpesa: hasDirectMpesa,
        has_stk_push: hasStkPush,
        has_any_mpesa_config: hasAnyMpesaConfig,
        can_disable_cod: hasAnyMpesaConfig,
        active_payment_type: activePaymentType,
        direct_mpesa: hasDirectMpesa ? {
          type: directMpesa[0].type,
          business_number: directMpesa[0].business_number,
          account_number: directMpesa[0].account_number,
          till_number: directMpesa[0].till_number,
          phone_number: directMpesa[0].phone_number
        } : null,
        stk_push: null
      }
    });
  } catch (error) {
    console.error('GET payment settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}

// Update COD status
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shop_id');
    
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    const body = await req.json();
    const { cod_enabled } = body;
    
    if (cod_enabled === undefined) {
      return NextResponse.json({ error: 'cod_enabled required' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // If disabling COD, check that another payment method exists
    if (cod_enabled === false) {
      const settings = await getPaymentSettings(shopId);
      
      if (settings) {
        const [directMpesa] = await pool.query<DirectMpesaRow[]>(
          `SELECT 1 FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
          [settings.payment_setting_id]
        );
        
        const hasOtherPayment = directMpesa.length > 0;
        
        if (!hasOtherPayment) {
          return NextResponse.json({ 
            error: 'Cannot disable COD. Please configure M-Pesa first' 
          }, { status: 400 });
        }
      }
    }
    
    // Create settings if not exists
    await pool.query(
      `INSERT INTO shop_payment_settings (shop_id, cod_enabled) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE cod_enabled = VALUES(cod_enabled)`,
      [shopId, cod_enabled ? 1 : 0]
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

// Save Direct M-Pesa
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shop_id');
    
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    const body = await req.json();
    const { type, business_number, account_number, till_number, phone_number } = body;
    
    if (!type || !['paybill', 'till', 'pochi', 'send_money'].includes(type)) {
      return NextResponse.json({ error: 'Valid type required' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }
    
    // Create payment settings if not exists
    const [settingsResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO shop_payment_settings (shop_id, cod_enabled) 
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE payment_setting_id = LAST_INSERT_ID(payment_setting_id)`,
      [shopId]
    );
    
    const paymentSettingId = settingsResult.insertId;
    
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
    
    // Update active_payment_type
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

// Remove Direct M-Pesa
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shop_id');
    
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const shopId = parseInt(shopIdParam, 10);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body;
    
    if (action !== 'direct-mpesa') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }
    
    const settings = await getPaymentSettings(shopId);
    
    if (settings) {
      // Delete direct mpesa configuration
      await pool.query(
        `DELETE FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
        [settings.payment_setting_id]
      );
      
      // Update active_payment_type
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = NULL WHERE shop_id = ?`,
        [shopId]
      );
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