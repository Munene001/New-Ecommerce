// app/api/shopowner/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface OwnerCheckRow extends RowDataPacket {
  '1': number;
}

interface AnalyticsResult {
  summary: {
    totalRevenue: number;
    totalPaidOrders: number;
    averageOrderValue: number;
    totalAllOrders: number;
    collectionRate: number;
    avgItemsPerOrder: number;
    returningCustomersRate: number;
    weekendVsWeekday: {
      weekend: number;
      weekday: number;
      weekend_percentage: number;
      weekday_percentage: number;
    };
  };
  topProducts: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  bestSeller: {
    product_name: string;
    revenue: number;
  } | null;
  paymentSplit: {
    mpesa: number;
    cod: number;
    mpesa_percentage: number;
    cod_percentage: number;
  };
  hourlyDistribution: Array<{
    hour: number;
    order_count: number;
  }>;
  ordersByCity: Array<{
    city: string;
    order_count: number;
    revenue: number;
  }>;
}

// Helper to verify shop ownership
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

// GET /api/shopowner/analytics?shop_id=123
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

    // 1. SUMMARY METRICS
    const [summaryResult] = await pool.query<any[]>(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN subtotal ELSE 0 END), 0) as total_revenue,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as total_paid_orders,
        COUNT(*) as total_all_orders
       FROM orders
       WHERE shop_id = ?`,
      [shopId]
    );

    const totalRevenue = parseFloat(summaryResult[0].total_revenue) || 0;
    const totalPaidOrders = summaryResult[0].total_paid_orders || 0;
    const totalAllOrders = summaryResult[0].total_all_orders || 0;
    const averageOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;
    const collectionRate = totalAllOrders > 0 ? (totalPaidOrders / totalAllOrders) * 100 : 0;

    // 2. AVG ITEMS PER ORDER (from paid orders only)
    const [avgItemsResult] = await pool.query<any[]>(
      `SELECT AVG(item_count) as avg_items
       FROM (
         SELECT oi.order_id, COUNT(*) as item_count
         FROM order_items oi
         INNER JOIN orders o ON oi.order_id = o.order_id
         WHERE o.shop_id = ? AND o.payment_status = 'paid'
         GROUP BY oi.order_id
       ) as item_counts`,
      [shopId]
    );
    const avgItemsPerOrder = parseFloat(avgItemsResult[0].avg_items) || 0;

    // 3. RETURNING CUSTOMERS RATE (from paid orders only)
    const [returningResult] = await pool.query<any[]>(
      `SELECT 
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_email END) as returning_customers,
        COUNT(DISTINCT customer_email) as total_customers
       FROM (
         SELECT customer_email, COUNT(*) as order_count
         FROM orders
         WHERE shop_id = ? AND payment_status = 'paid' AND customer_email IS NOT NULL AND customer_email != ''
         GROUP BY customer_email
       ) as customer_orders`,
      [shopId]
    );
    const returningCustomers = returningResult[0].returning_customers || 0;
    const totalCustomers = returningResult[0].total_customers || 0;
    const returningCustomersRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // 4. WEEKEND VS WEEKDAY (from paid orders only)
    const [weekendResult] = await pool.query<any[]>(
      `SELECT 
        SUM(CASE WHEN DAYOFWEEK(created_at) IN (1, 7) THEN 1 ELSE 0 END) as weekend_orders,
        SUM(CASE WHEN DAYOFWEEK(created_at) BETWEEN 2 AND 6 THEN 1 ELSE 0 END) as weekday_orders
       FROM orders
       WHERE shop_id = ? AND payment_status = 'paid'`,
      [shopId]
    );
    const weekendOrders = weekendResult[0].weekend_orders || 0;
    const weekdayOrders = weekendResult[0].weekday_orders || 0;
    const weekendPercentage = totalPaidOrders > 0 ? (weekendOrders / totalPaidOrders) * 100 : 0;
    const weekdayPercentage = totalPaidOrders > 0 ? (weekdayOrders / totalPaidOrders) * 100 : 0;

    // 5. TOP PRODUCTS (sorted by quantity sold instead of revenue)
    const [topProducts] = await pool.query<any[]>(
      `SELECT 
        oi.product_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price_at_time) as revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.shop_id = ? AND o.payment_status = 'paid'
       GROUP BY oi.product_name
       ORDER BY quantity_sold DESC
       LIMIT 5`,
      [shopId]
    );

    // 6. BEST SELLER (highest revenue from paid orders)
    const [bestSellerResult] = await pool.query<any[]>(
      `SELECT 
        oi.product_name,
        SUM(oi.quantity * oi.price_at_time) as revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.shop_id = ? AND o.payment_status = 'paid'
       GROUP BY oi.product_name
       ORDER BY revenue DESC
       LIMIT 1`,
      [shopId]
    );

    const bestSeller = bestSellerResult.length > 0 ? {
      product_name: bestSellerResult[0].product_name,
      revenue: parseFloat(bestSellerResult[0].revenue) || 0
    } : null;

    // 7. PAYMENT SPLIT (from paid orders only)
    const [paymentSplit] = await pool.query<any[]>(
      `SELECT 
        payment_method,
        COUNT(*) as count
       FROM orders
       WHERE shop_id = ? AND payment_status = 'paid'
       GROUP BY payment_method`,
      [shopId]
    );

    let mpesaCount = 0;
    let codCount = 0;
    
    paymentSplit.forEach(row => {
      if (row.payment_method === 'mpesa') {
        mpesaCount = row.count;
      } else if (row.payment_method === 'cash_on_delivery') {
        codCount = row.count;
      }
    });

    const paymentSplitResult = {
      mpesa: mpesaCount,
      cod: codCount,
      mpesa_percentage: totalPaidOrders > 0 ? (mpesaCount / totalPaidOrders) * 100 : 0,
      cod_percentage: totalPaidOrders > 0 ? (codCount / totalPaidOrders) * 100 : 0,
    };

    // 8. HOURLY DISTRIBUTION (from paid orders only)
    const [hourlyDistribution] = await pool.query<any[]>(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as order_count
       FROM orders
       WHERE shop_id = ? AND payment_status = 'paid'
       GROUP BY HOUR(created_at)
       ORDER BY hour ASC`,
      [shopId]
    );

    // Fill in all 24 hours (0-23)
    const hourlyArray = new Array(24).fill(0).map((_, hour) => ({ hour, order_count: 0 }));
    hourlyDistribution.forEach(row => {
      hourlyArray[row.hour].order_count = row.order_count;
    });

    // 9. ORDERS BY CITY (from paid orders only)
    const [ordersByCity] = await pool.query<any[]>(
      `SELECT 
        customer_city as city,
        COUNT(*) as order_count,
        COALESCE(SUM(subtotal), 0) as revenue
       FROM orders
       WHERE shop_id = ? AND payment_status = 'paid' AND customer_city IS NOT NULL AND customer_city != ''
       GROUP BY customer_city
       ORDER BY order_count DESC`,
      [shopId]
    );

    const analyticsData: AnalyticsResult = {
      summary: {
        totalRevenue,
        totalPaidOrders,
        averageOrderValue,
        totalAllOrders,
        collectionRate,
        avgItemsPerOrder,
        returningCustomersRate,
        weekendVsWeekday: {
          weekend: weekendOrders,
          weekday: weekdayOrders,
          weekend_percentage: weekendPercentage,
          weekday_percentage: weekdayPercentage,
        },
      },
      topProducts: topProducts.map(p => ({
        product_name: p.product_name,
        quantity_sold: p.quantity_sold,
        revenue: parseFloat(p.revenue) || 0,
      })),
      bestSeller,
      paymentSplit: paymentSplitResult,
      hourlyDistribution: hourlyArray,
      ordersByCity: ordersByCity.map(c => ({
        city: c.city,
        order_count: c.order_count,
        revenue: parseFloat(c.revenue) || 0,
      })),
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}