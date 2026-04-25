// api/shops/payments/route.ts - PUBLIC (no auth)
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface PaymentSettingsRow extends RowDataPacket {
  payment_setting_id: number;
  cod_enabled: number;
  active_payment_type: 'direct_mpesa' | 'stk_push' | null;
}

interface DirectMpesaRow extends RowDataPacket {
  type: 'paybill' | 'till' | 'pochi' | 'send_money';
  business_number: string | null;
  account_number: string | null;
  till_number: string | null;
  phone_number: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');
    
    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    // Get payment settings
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
    
    // Get direct M-Pesa config if exists
    let directMpesa = null;
    
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
    
    return NextResponse.json({
      success: true,
      data: {
        cod_enabled: setting.cod_enabled === 1,
        has_mpesa: directMpesa !== null,
        active_payment_type: setting.active_payment_type,
        direct_mpesa: directMpesa
      }
    });
    
  } catch (error) {
    console.error('GET payment settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment settings' }, { status: 500 });
  }
}