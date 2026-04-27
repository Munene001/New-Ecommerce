import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
}

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

interface StatsResult extends RowDataPacket {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  paidOrders: number;
  pendingPayment: number;
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

// GET /api/shopowner/orders?shop_id=1&page=1&limit=20&status=pending&date_from=2024-01-01&date_to=2024-12-31&search=ORD
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

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');

    // Build WHERE clause
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

    // Get total count
    const [countResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      queryParams
    );
    const totalCount = countResult[0].total;

    // Get aggregated stats
    const [statsResult] = await pool.query<StatsResult[]>(
      `SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processingOrders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as completedOrders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelledOrders,
        SUM(CASE WHEN payment_status = 'paid' THEN subtotal ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paidOrders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pendingPayment
      FROM orders 
      ${whereClause}`,
      queryParams
    );

    // Get unviewed count (global, not affected by filters except shop_id)
    let unviewedWhereClause = 'WHERE shop_id = ?';
    const unviewedParams: (string | number)[] = [shopId];
    
    // Optional: Apply date filters to unviewed count if needed
    if (dateFrom) {
      unviewedWhereClause += ' AND DATE(created_at) >= ?';
      unviewedParams.push(dateFrom);
    }
    if (dateTo) {
      unviewedWhereClause += ' AND DATE(created_at) <= ?';
      unviewedParams.push(dateTo);
    }
    
    const [unviewedResult] = await pool.query<CountResult[]>(
      `SELECT COUNT(*) as total 
       FROM orders 
       ${unviewedWhereClause} AND viewed_by_seller = 0`,
      unviewedParams
    );
    const unviewedCount = unviewedResult[0]?.total || 0;

    // Get paginated orders
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT 
        order_id, order_number, customer_name, customer_email, customer_phone,
        customer_city, customer_address, special_instructions, subtotal,
        payment_method, payment_status, order_status, created_at, updated_at,
        viewed_by_seller
       FROM orders
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      success: true,
      orders,
      stats: statsResult[0],
      unviewedCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}