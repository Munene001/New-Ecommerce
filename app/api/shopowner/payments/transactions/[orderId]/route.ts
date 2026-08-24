import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface PaymentDetailRow extends RowDataPacket {
  order_number: string;
  order_id: number;
  customer_name: string;
  customer_phone: string;
  amount: number;
  payment_method: string;
  checkout_id: string | null;
  receipt_number: string | null;
  provider: string | null;
  result_code: number | null;
  result_description: string | null;
  status: string;
  delivery_fee: number;
  delivery_zone: string | null;
  created_at: string;
}

async function getShopIdFromOrder(orderId: number): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT shop_id FROM orders WHERE order_id = ?',
    [orderId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    // Refactored to explicitly JOIN shop_payment_settings and accurately determine Provider
    const query = `
      SELECT 
        o.order_number,
        o.order_id,
        o.customer_name,
        o.customer_phone,
        o.total AS amount,
        o.payment_status AS status,
        o.delivery_fee,
        o.delivery_zone,
        o.created_at,
        CASE
          WHEN o.payment_method = 'cash_on_delivery' THEN 'COD'
          WHEN t.transaction_id IS NOT NULL AND t.status = 'completed' THEN 'STK Push'
          WHEN d.direct_mpesa_id IS NOT NULL THEN 'Direct M-Pesa'
          ELSE 'M-Pesa'
        END AS payment_method,
        t.checkout_request_id AS checkout_id,
        t.mpesa_receipt_number AS receipt_number,
        CASE 
          WHEN t.checkout_request_id IS NOT NULL AND t.checkout_request_id LIKE 'ws_%' THEN 'Safaricom'
          WHEN t.checkout_request_id IS NOT NULL THEN 'Kopokopo'
          WHEN s.stk_push_id IS NOT NULL THEN 'Safaricom'
          WHEN k.kopokopo_id IS NOT NULL THEN 'Kopokopo'
          ELSE NULL
        END AS provider,
        t.result_code,
        t.result_description
      FROM orders o
      LEFT JOIN stk_push_transactions t ON o.order_id = t.order_id AND t.status = 'completed'
      LEFT JOIN shop_payment_settings ps ON ps.shop_id = o.shop_id
      LEFT JOIN shop_stk_push s ON s.payment_setting_id = ps.payment_setting_id
      LEFT JOIN shop_kopokopo k ON k.payment_setting_id = ps.payment_setting_id
      LEFT JOIN shop_direct_mpesa d ON d.payment_setting_id = ps.payment_setting_id
      WHERE o.order_id = ?
      LIMIT 1
    `;

    const [rows] = await pool.query<PaymentDetailRow[]>(query, [orderId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const payment = rows[0];

    return NextResponse.json({
      success: true,
      transaction: {
        order_number: payment.order_number,
        order_id: Number(payment.order_id),
        customer_name: payment.customer_name,
        customer_phone: payment.customer_phone,
        amount: Number(payment.amount) || 0,
        payment_method: payment.payment_method,
        checkout_id: payment.checkout_id || null,
        receipt_number: payment.receipt_number || null,
        provider: payment.provider || null,
        result_code: payment.result_code !== null ? Number(payment.result_code) : null,
        result_description: payment.result_description || null,
        status: payment.status,
        delivery_fee: Number(payment.delivery_fee) || 0,
        delivery_zone: payment.delivery_zone || null,
        created_at: payment.created_at,
      }
    });

  } catch (error) {
    console.error('GET payment detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    );
  }
}