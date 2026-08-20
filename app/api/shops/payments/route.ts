// api/shops/payments/route.ts - PUBLIC (no auth)
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface PaymentSettingsRow extends RowDataPacket {
  payment_setting_id: number;
  cod_enabled: number;
  active_payment_type: 'direct_mpesa' | 'stk_push' | 'kopokopo' | null;
}

interface DirectMpesaRow extends RowDataPacket {
  type: 'paybill' | 'till' | 'pochi' | 'send_money';
  business_number: string | null;
  account_number: string | null;
  till_number: string | null;
  phone_number: string | null;
}

interface KopokopoRow extends RowDataPacket {
  till_number: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const [settings] = await pool.query<PaymentSettingsRow[]>(
      `SELECT payment_setting_id, cod_enabled, active_payment_type 
       FROM shop_payment_settings 
       WHERE shop_id = ?`,
      [shopId]
    );
    
    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          cod_enabled: true,
          has_mpesa: false,
          active_payment_type: null,
          direct_mpesa: null
        }
      });
    }
    
    const setting = settings[0];
    let directMpesa = null;
    let hasStkPush = false;
    let hasKopokopo = false;
    
    // Check direct M-Pesa if active
    if (setting.active_payment_type === 'direct_mpesa') {
      const [mpesaRows] = await pool.query<DirectMpesaRow[]>(
        `SELECT type, business_number, account_number, till_number, phone_number
         FROM shop_direct_mpesa
         WHERE payment_setting_id = ?`,
        [setting.payment_setting_id]
      );
      
      if (mpesaRows.length > 0) {
        directMpesa = mpesaRows[0];
      }
    }
    
    // Check STK Push if active (exact match with STK pattern)
    if (setting.active_payment_type === 'stk_push') {
      const [stkRows] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM shop_stk_push WHERE payment_setting_id = ?`,
        [setting.payment_setting_id]
      );
      hasStkPush = stkRows.length > 0;
    }
    
    // Check Kopokopo if active (exact match with STK pattern - no details)
    if (setting.active_payment_type === 'kopokopo') {
      const [k2Rows] = await pool.query<KopokopoRow[]>(
        `SELECT till_number FROM shop_kopokopo WHERE payment_setting_id = ?`,
        [setting.payment_setting_id]
      );
      hasKopokopo = k2Rows.length > 0;
    }
    
    // has_mpesa = any M-Pesa method exists
    const hasMpesa = directMpesa !== null || hasStkPush || hasKopokopo;
    
    return NextResponse.json({
      success: true,
      data: {
        cod_enabled: setting.cod_enabled === 1,
        has_mpesa: hasMpesa,
        active_payment_type: setting.active_payment_type,
        direct_mpesa: directMpesa
        // Note: stk_push and kopokopo details are intentionally NOT returned
        // System-initiated payments don't need to display details to customers
      }
    });
    
  } catch (error) {
    console.error('GET payment settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}