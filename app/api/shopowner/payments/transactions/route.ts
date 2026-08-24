import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface TransactionRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  payment_method: string;
  checkout_id: string | null;
  receipt_number: string | null;
  created_at: string;
}

interface StatsRow extends RowDataPacket {
  totalRevenue: number;
  monthlyRevenue: number;
  stkPayments: number;
  stkPaymentRate: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

function parseNumberParam(param: string | null, defaultValue: number): number {
  if (!param) return defaultValue;
  const num = Number(param);
  return isNaN(num) || num < 0 ? defaultValue : Math.floor(num);
}

function isValidDateString(dateStr: string | null): boolean {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.exec(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get('shop_id');
    
    if (!shopIdParam) {
      return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });
    }

    const shopId = parseNumberParam(shopIdParam, 0);
    if (shopId === 0) {
      return NextResponse.json({ error: 'Invalid shop_id' }, { status: 400 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    const page = Math.max(1, parseNumberParam(searchParams.get('page'), 1));
    const rawLimit = parseNumberParam(searchParams.get('limit'), 20);
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = (page - 1) * limit;

    const paymentType = searchParams.get('payment_type')?.trim();
    const dateFrom = searchParams.get('date_from')?.trim();
    const dateTo = searchParams.get('date_to')?.trim();
    const search = searchParams.get('search')?.trim();

    if (dateFrom && !isValidDateString(dateFrom)) {
      return NextResponse.json({ error: 'Invalid date_from format (expected YYYY-MM-DD)' }, { status: 400 });
    }
    if (dateTo && !isValidDateString(dateTo)) {
      return NextResponse.json({ error: 'Invalid date_to format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    let whereClause = 'WHERE o.shop_id = ? AND o.payment_status = "paid"';
    const queryParams: (string | number)[] = [shopId];

    if (paymentType) {
      if (paymentType === 'stk') {
        whereClause += ' AND t.transaction_id IS NOT NULL AND t.status = "completed"';
      } else if (paymentType === 'direct') {
        whereClause += ' AND (o.payment_method IN ("direct_mpesa", "till", "paybill", "pochi", "send_money") OR (o.payment_method = "mpesa" AND t.transaction_id IS NULL))';
      } else if (paymentType === 'cod') {
        whereClause += ' AND o.payment_method = "cash_on_delivery"';
      } else if (paymentType === 'mpesa') {
        whereClause += ' AND o.payment_method = "mpesa"';
      }
    }

    if (dateFrom) {
      whereClause += ' AND DATE(o.created_at) >= ?';
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND DATE(o.created_at) <= ?';
      queryParams.push(dateTo);
    }

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Optimization: Avoid nested subqueries using direct JOINs for metric aggregations
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total ELSE 0 END), 0) AS totalRevenue,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' 
          AND MONTH(o.created_at) = MONTH(CURRENT_DATE()) 
          AND YEAR(o.created_at) = YEAR(CURRENT_DATE()) 
          THEN o.total ELSE 0 END), 0) AS monthlyRevenue,
        COALESCE((
          SELECT COUNT(st.transaction_id) 
          FROM stk_push_transactions st
          JOIN orders ord ON st.order_id = ord.order_id
          WHERE st.status = 'completed' AND ord.shop_id = ?
        ), 0) AS stkPayments,
        COALESCE(ROUND(
          (
            SELECT COUNT(st.transaction_id) 
            FROM stk_push_transactions st
            JOIN orders ord ON st.order_id = ord.order_id
            WHERE st.status = 'completed' AND ord.shop_id = ?
          ) / NULLIF((SELECT COUNT(*) FROM orders WHERE shop_id = ? AND payment_method = 'mpesa' AND payment_status = 'paid'), 0) * 100, 2
        ), 0) AS stkPaymentRate
      FROM orders o
      WHERE o.shop_id = ? AND o.payment_status = 'paid'
    `;

    const [statsRows] = await pool.query<StatsRow[]>(statsQuery, [shopId, shopId, shopId, shopId]);
    const stats = statsRows[0] || {
      totalRevenue: 0,
      monthlyRevenue: 0,
      stkPayments: 0,
      stkPaymentRate: 0,
    };

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM orders o
      LEFT JOIN stk_push_transactions t ON o.order_id = t.order_id AND t.status = 'completed'
      ${whereClause}
    `;

    const [countRows] = await pool.query<CountRow[]>(countQuery, queryParams);
    const totalCount = Number(countRows[0]?.total) || 0;

    const transactionsQuery = `
      SELECT 
        o.order_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.total AS amount,
        o.created_at,
        CASE
          WHEN o.payment_method = 'cash_on_delivery' THEN 'COD'
          WHEN t.transaction_id IS NOT NULL AND t.status = 'completed' THEN 'STK Push'
          WHEN o.payment_method IN ('direct_mpesa', 'till', 'paybill', 'pochi', 'send_money') OR (o.payment_method = 'mpesa' AND t.transaction_id IS NULL) THEN 'Direct M-Pesa'
          ELSE 'M-Pesa'
        END AS payment_method,
        t.checkout_request_id AS checkout_id,
        t.mpesa_receipt_number AS receipt_number
      FROM orders o
      LEFT JOIN stk_push_transactions t ON o.order_id = t.order_id AND t.status = 'completed'
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [transactions] = await pool.query<TransactionRow[]>(
      transactionsQuery,
      [...queryParams, limit, offset]
    );

    const formattedTransactions = transactions.map(row => ({
      order_id: Number(row.order_id),
      order_number: row.order_number,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      amount: Number(row.amount) || 0,
      payment_method: row.payment_method,
      checkout_id: row.checkout_id || null,
      receipt_number: row.receipt_number || null,
      created_at: row.created_at,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue: Number(stats.totalRevenue) || 0,
        monthlyRevenue: Number(stats.monthlyRevenue) || 0,
        stkPayments: Number(stats.stkPayments) || 0,
        stkPaymentRate: Number(stats.stkPaymentRate) || 0,
      },
      transactions: formattedTransactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });

  } catch (error) {
    console.error('GET transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}