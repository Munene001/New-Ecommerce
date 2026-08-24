// api/shopowner/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface PaymentSettingsRow extends RowDataPacket {
  payment_setting_id: number;
  shop_id: number;
  cod_enabled: number;
  active_payment_type: 'direct_mpesa' | 'stk_push' | 'kopokopo' | null;
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

interface StkPushRow extends RowDataPacket {
  stk_push_id: number;
  payment_setting_id: number;
  type: 'paybill' | 'till';
  business_number: string | null;
  till_number: string | null;
  account_number: string | null;
  consumer_key: string;
  consumer_secret: string;
  passkey: string;
  shortcode: string;
}

interface KopokopoRow extends RowDataPacket {
  kopokopo_id: number;
  payment_setting_id: number;
  client_id: string;
  client_secret: string;
  api_key: string;
  till_number: string;
  webhook_secret: string | null;
}

async function getPaymentSettings(shopId: number): Promise<PaymentSettingsRow | null> {
  const [rows] = await pool.query<PaymentSettingsRow[]>(
    `SELECT payment_setting_id, shop_id, cod_enabled, active_payment_type 
     FROM shop_payment_settings 
     WHERE shop_id = ?`,
    [shopId]
  );
  return rows.length ? rows[0] : null;
}

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

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;

    const settings = await getPaymentSettings(shopId);
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          cod_enabled: true,
          has_direct_mpesa: false,
          has_stk_push: false,
          has_kopokopo: false,
          has_any_mpesa_config: false,
          can_disable_cod: false,
          active_payment_type: null,
          direct_mpesa: null,
          stk_push: null,
          kopokopo: null
        }
      });
    }
    
    const [directMpesa] = await pool.query<DirectMpesaRow[]>(
      `SELECT direct_mpesa_id, type, business_number, account_number, till_number, phone_number
       FROM shop_direct_mpesa
       WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const [stkPush] = await pool.query<StkPushRow[]>(
      `SELECT stk_push_id, type, business_number, till_number, account_number, 
              consumer_key, consumer_secret, passkey, shortcode
       FROM shop_stk_push
       WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const [kopokopo] = await pool.query<KopokopoRow[]>(
      `SELECT kopokopo_id, client_id, client_secret, api_key, till_number, webhook_secret
       FROM shop_kopokopo
       WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const hasDirectMpesa = directMpesa.length > 0;
    const hasStkPush = stkPush.length > 0;
    const hasKopokopo = kopokopo.length > 0;
    const hasAnyMpesaConfig = hasDirectMpesa || hasStkPush || hasKopokopo;
    
    return NextResponse.json({
      success: true,
      data: {
        cod_enabled: settings.cod_enabled === 1,
        has_direct_mpesa: hasDirectMpesa,
        has_stk_push: hasStkPush,
        has_kopokopo: hasKopokopo,
        has_any_mpesa_config: hasAnyMpesaConfig,
        can_disable_cod: hasAnyMpesaConfig,
        active_payment_type: settings.active_payment_type,
        direct_mpesa: hasDirectMpesa ? {
          type: directMpesa[0].type,
          business_number: directMpesa[0].business_number,
          account_number: directMpesa[0].account_number,
          till_number: directMpesa[0].till_number,
          phone_number: directMpesa[0].phone_number
        } : null,
        stk_push: hasStkPush ? {
          type: stkPush[0].type,
          business_number: stkPush[0].business_number,
          till_number: stkPush[0].till_number,
          account_number: stkPush[0].account_number,
          consumer_key: stkPush[0].consumer_key,
          consumer_secret: stkPush[0].consumer_secret,
          passkey: stkPush[0].passkey,
          shortcode: stkPush[0].shortcode
        } : null,
        kopokopo: hasKopokopo ? {
          client_id: kopokopo[0].client_id,
          client_secret: kopokopo[0].client_secret,
          api_key: kopokopo[0].api_key,
          till_number: kopokopo[0].till_number,
          webhook_secret: kopokopo[0].webhook_secret
        } : null
      }
    });
  } catch (error) {
    console.error('GET payment settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}

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

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;

    if (cod_enabled === false) {
      const settings = await getPaymentSettings(shopId);
      
      if (settings) {
        const [directMpesa] = await pool.query<RowDataPacket[]>(
          `SELECT 1 FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
          [settings.payment_setting_id]
        );
        
        const [stkPush] = await pool.query<RowDataPacket[]>(
          `SELECT 1 FROM shop_stk_push WHERE payment_setting_id = ?`,
          [settings.payment_setting_id]
        );
        
        const [kopokopo] = await pool.query<RowDataPacket[]>(
          `SELECT 1 FROM shop_kopokopo WHERE payment_setting_id = ?`,
          [settings.payment_setting_id]
        );
        
        const hasOtherPayment = directMpesa.length > 0 || stkPush.length > 0 || kopokopo.length > 0;
        
        if (!hasOtherPayment) {
          return NextResponse.json({ 
            error: 'Cannot disable COD. Please configure M-Pesa first' 
          }, { status: 400 });
        }
      }
    }
    
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
    const { payment_method, ...config } = body;
    
    if (!payment_method || !['direct_mpesa', 'stk_push', 'kopokopo'].includes(payment_method)) {
      return NextResponse.json({ error: 'Valid payment_method required (direct_mpesa, stk_push, or kopokopo)' }, { status: 400 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;
    
    await pool.query(
      `INSERT INTO shop_payment_settings (shop_id, cod_enabled) 
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE shop_id = VALUES(shop_id)`,
      [shopId]
    );

    const settings = await getPaymentSettings(shopId);
    if (!settings) {
      return NextResponse.json({ error: 'Failed to retrieve payment settings' }, { status: 500 });
    }
    
    const paymentSettingId = settings.payment_setting_id;
    
    if (payment_method === 'direct_mpesa') {
      const { type, business_number, account_number, till_number, phone_number } = config;
      
      if (!type || !['paybill', 'till', 'pochi', 'send_money'].includes(type)) {
        return NextResponse.json({ error: 'Valid type required for direct_mpesa' }, { status: 400 });
      }
      
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
      
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = 'direct_mpesa' WHERE shop_id = ?`,
        [shopId]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Direct M-Pesa configuration saved successfully'
      });
    }
    
    if (payment_method === 'stk_push') {
      const { type, shortcode, consumer_key, consumer_secret, passkey, business_number, till_number, account_number } = config;
      
      if (!type || !['paybill', 'till'].includes(type)) {
        return NextResponse.json({ error: 'Valid type required for stk_push (paybill or till)' }, { status: 400 });
      }
      
      if (!shortcode) {
        return NextResponse.json({ error: 'Shortcode is required' }, { status: 400 });
      }
      
      if (!consumer_key || !consumer_secret || !passkey) {
        return NextResponse.json({ error: 'Consumer Key, Consumer Secret, and Passkey are required' }, { status: 400 });
      }
      
      await pool.query(
        `INSERT INTO shop_stk_push (payment_setting_id, type, shortcode, consumer_key, consumer_secret, passkey, business_number, till_number, account_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         type = VALUES(type),
         shortcode = VALUES(shortcode),
         consumer_key = VALUES(consumer_key),
         consumer_secret = VALUES(consumer_secret),
         passkey = VALUES(passkey),
         business_number = VALUES(business_number),
         till_number = VALUES(till_number),
         account_number = VALUES(account_number)`,
        [paymentSettingId, type, shortcode, consumer_key, consumer_secret, passkey, business_number || null, till_number || null, account_number || null]
      );
      
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = 'stk_push' WHERE shop_id = ?`,
        [shopId]
      );
      
      return NextResponse.json({
        success: true,
        message: 'STK Push configuration saved successfully'
      });
    }
    
    if (payment_method === 'kopokopo') {
      const { client_id, client_secret, api_key, till_number, webhook_secret } = config;
      
      if (!client_id || !client_secret || !api_key || !till_number) {
        return NextResponse.json({ error: 'Client ID, Client Secret, API Key, and Till Number are required for Kopo Kopo' }, { status: 400 });
      }
      
      // ============================================================
      // STEP 1: Register webhook with Spring Boot FIRST
      // ============================================================
      let registrationSuccess = false;
      let registrationError = null;
      
      try {
        const springBootUrl = process.env.SPRING_BOOT_URL || 'http://localhost:8081';
        
        const registrationResponse = await fetch(`${springBootUrl}/api/webhooks/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Api-Key': process.env.SPRING_BOOT_INTERNAL_SECRET || '',
          },
          body: JSON.stringify({
            clientId: client_id,
            clientSecret: client_secret,
            apiKey: api_key,
            tillNumber: till_number,
            // webhookUrl is NOT sent - Spring Boot builds it!
          }),
        });

        const registrationData = await registrationResponse.json();
        
        if (
          (registrationResponse.ok && registrationData.success) || 
          registrationData.error?.toLowerCase().includes('already exists') ||
          registrationData.error?.toLowerCase().includes('duplicate') ||
          registrationResponse.status === 409 ||
          registrationResponse.status === 422
        ) {
          registrationSuccess = true;
          console.log('✅ Webhook active for till:', till_number);
        } else {
          registrationSuccess = false;
          registrationError = registrationData.error || 'Webhook registration failed';
          console.error('Webhook registration failed:', registrationData);
        }
      } catch (error) {
        registrationSuccess = false;
        registrationError = error instanceof Error ? error.message : 'Webhook registration error';
        console.error('Webhook registration error:', error);
      }
      
      // ============================================================
      // STEP 2: If registration failed, return error (don't save!)
      // ============================================================
      if (!registrationSuccess) {
        return NextResponse.json({
          success: false,
          error: `Failed to register webhook with Kopo Kopo: ${registrationError}. Please check your credentials and try again.`
        }, { status: 400 });
      }
      
      // ============================================================
      // STEP 3: Registration succeeded → Save to database
      // ============================================================
      await pool.query(
        `INSERT INTO shop_kopokopo (payment_setting_id, client_id, client_secret, api_key, till_number, webhook_secret)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         client_id = VALUES(client_id),
         client_secret = VALUES(client_secret),
         api_key = VALUES(api_key),
         till_number = VALUES(till_number),
         webhook_secret = VALUES(webhook_secret)`,
        [paymentSettingId, client_id, client_secret, api_key, till_number, webhook_secret || null]
      );
      
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = 'kopokopo' WHERE shop_id = ?`,
        [shopId]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Kopo Kopo configuration saved successfully and webhook registered!'
      });
    }
    
    return NextResponse.json({ error: 'Invalid payment_method' }, { status: 400 });
  } catch (error) {
    console.error('POST payment config error:', error);
    return NextResponse.json({ error: 'Failed to save payment configuration' }, { status: 500 });
  }
}

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
    
    if (!action || !['direct-mpesa', 'stk-push', 'kopokopo'].includes(action)) {
      return NextResponse.json({ error: 'Valid action required (direct-mpesa, stk-push, or kopokopo)' }, { status: 400 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;
    
    const settings = await getPaymentSettings(shopId);
    
    if (!settings) {
      return NextResponse.json({ error: 'No payment settings found' }, { status: 404 });
    }
    
    const activeType = settings.active_payment_type;
    const providerToAction: Record<string, string> = {
      'direct_mpesa': 'direct-mpesa',
      'stk_push': 'stk-push',
      'kopokopo': 'kopokopo'
    };
    
    if (activeType && providerToAction[activeType] === action) {
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = NULL WHERE shop_id = ?`,
        [shopId]
      );
    }
    
    if (action === 'direct-mpesa') {
      await pool.query(
        `DELETE FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
        [settings.payment_setting_id]
      );
    } else if (action === 'stk-push') {
      await pool.query(
        `DELETE FROM shop_stk_push WHERE payment_setting_id = ?`,
        [settings.payment_setting_id]
      );
    } else if (action === 'kopokopo') {
      await pool.query(
        `DELETE FROM shop_kopokopo WHERE payment_setting_id = ?`,
        [settings.payment_setting_id]
      );
    }
    
    const [directMpesa] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM shop_direct_mpesa WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const [stkPush] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM shop_stk_push WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const [kopokopo] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM shop_kopokopo WHERE payment_setting_id = ?`,
      [settings.payment_setting_id]
    );
    
    const hasAnyConfig = directMpesa.length > 0 || stkPush.length > 0 || kopokopo.length > 0;
    
    if (!hasAnyConfig) {
      await pool.query(
        `UPDATE shop_payment_settings SET active_payment_type = NULL WHERE shop_id = ?`,
        [shopId]
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuration removed successfully'
    });
  } catch (error) {
    console.error('DELETE payment config error:', error);
    return NextResponse.json({ error: 'Failed to remove payment configuration' }, { status: 500 });
  }
}