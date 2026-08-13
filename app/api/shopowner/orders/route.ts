import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  special_instructions: string | null;
  subtotal: number;
  delivery_fee: number;
  delivery_zone: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  viewed_by_seller: number;
}

interface CountResult extends RowDataPacket {
  total: number;
}

interface CombinedStatsResult extends RowDataPacket {
  totalCount: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  paidOrders: number;
  pendingPayment: number;
}

// Parse and validate numeric params with fallback
function parseNumberParam(param: string | null, defaultValue: number): number {
  if (!param) return defaultValue;
  const num = Number(param);
  return isNaN(num) || num < 0 ? defaultValue : Math.floor(num);
}

// Strict ISO YYYY-MM-DD validator
function isValidDateString(dateStr: string | null): boolean {
  if (!dateStr) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.exec(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

// GET /api/shopowner/orders?shop_id=1&page=1&limit=20&status=pending&date_from=2026-01-01&date_to=2026-12-31&search=ORD
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

    // Verify user authorization for this shop
    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) {
      return response;
    }

    // Pagination bounds protection
    const page = Math.max(1, parseNumberParam(searchParams.get('page'), 1));
    const rawLimit = parseNumberParam(searchParams.get('limit'), 20);
    const limit = Math.min(100, Math.max(1, rawLimit)); // Cap at 100 max per page
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status')?.trim();
    const paymentStatus = searchParams.get('payment_status')?.trim();
    const dateFrom = searchParams.get('date_from')?.trim();
    const dateTo = searchParams.get('date_to')?.trim();
    const search = searchParams.get('search')?.trim();

    if (dateFrom && !isValidDateString(dateFrom)) {
      return NextResponse.json({ error: 'Invalid date_from format (expected YYYY-MM-DD)' }, { status: 400 });
    }
    if (dateTo && !isValidDateString(dateTo)) {
      return NextResponse.json({ error: 'Invalid date_to format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    // Build base WHERE clause
    let whereClause = 'WHERE shop_id = ?';
    const queryParams: (string | number)[] = [shopId];

    if (status) {
      whereClause += ' AND order_status = ?';
      queryParams.push(status);
    }

    if (paymentStatus) {
      whereClause += ' AND payment_status = ?';
      queryParams.push(paymentStatus);
    }

    if (dateFrom) {
      whereClause += ' AND DATE(created_at) >= ?';
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND DATE(created_at) <= ?';
      queryParams.push(dateTo);
    }

    if (search) {
      whereClause += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // 1. Unified Aggregated Stats + Total Count in a single query pass
    const [statsResult] = await pool.query<CombinedStatsResult[]>(
      `SELECT 
        COUNT(*) as totalCount,
        COUNT(*) as totalOrders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processingOrders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelledOrders,
        SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paidOrders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pendingPayment
      FROM orders 
      ${whereClause}`,
      queryParams
    );

    const stats = statsResult[0];
    const totalCount = Number(stats?.totalCount) || 0;

    // 2. Unviewed Orders Count
    let unviewedWhereClause = 'WHERE shop_id = ? AND viewed_by_seller = 0';
    const unviewedParams: (string | number)[] = [shopId];
    
    if (dateFrom) {
      unviewedWhereClause += ' AND DATE(created_at) >= ?';
      unviewedParams.push(dateFrom);
    }
    if (dateTo) {
      unviewedWhereClause += ' AND DATE(created_at) <= ?';
      unviewedParams.push(dateTo);
    }
    
    const [unviewedResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM orders ${unviewedWhereClause}`,
      unviewedParams
    );
    const unviewedCount = Number(unviewedResult[0]?.total) || 0;

    // 3. Get Paginated Orders
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT 
        order_id, order_number, customer_name, customer_email, customer_phone,
        customer_city, customer_address, special_instructions, subtotal,
        delivery_fee, delivery_zone, total,
        payment_method, payment_status, order_status, created_at, updated_at,
        viewed_by_seller
       FROM orders
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    // Format output with guaranteed numeric primitives
    const formattedOrders = orders.map(order => ({
      ...order,
      order_id: Number(order.order_id),
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.delivery_fee) || 0,
      total: Number(order.total) || 0,
      viewed_by_seller: Number(order.viewed_by_seller) || 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      stats: {
        totalOrders: Number(stats?.totalOrders) || 0,
        pendingOrders: Number(stats?.pendingOrders) || 0,
        processingOrders: Number(stats?.processingOrders) || 0,
        completedOrders: Number(stats?.completedOrders) || 0,
        cancelledOrders: Number(stats?.cancelledOrders) || 0,
        totalRevenue: Number(stats?.totalRevenue) || 0,
        paidOrders: Number(stats?.paidOrders) || 0,
        pendingPayment: Number(stats?.pendingPayment) || 0,
      },
      unviewedCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}