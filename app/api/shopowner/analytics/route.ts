// app/api/shopowner/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';

type SourceKey = 'online' | 'pos';

interface AnalyticsResult {
  heroUnit: {
    type: 'variant' | 'product';
    name: string;
    parent_product: string;
    variant_id: number | null;
    product_id: number;
    quantity_sold: number;
    revenue: number;
  } | null;
  heroProduct: {
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    top_variant: { variant_id: number; variant_name: string; quantity_sold: number } | null;
  } | null;
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
  topProducts: Array<{ product_name: string; quantity_sold: number; revenue: number }>;
  bestSeller: { product_name: string; revenue: number };
  paymentSplit: { mpesa: number; cod: number; mpesa_percentage: number; cod_percentage: number };
  hourlyDistribution: Array<{ hour: number; order_count: number }>;
  ordersByCity: Array<{ city: string; order_count: number; revenue: number }>;
  topVariants: Array<{ variant_id: number; variant_name: string; product_name: string; quantity_sold: number; revenue: number }>;
  sourceSplit: { online: { orders: number; revenue: number }; pos: { orders: number; revenue: number } };
  monthlySeries: Array<{ ym: string; orders: number; revenue: number }>;
  appliedFilters: { date_from: string | null; date_to: string | null; source: SourceKey | null };
}

// ---------- helpers ----------
function isValidDateString(s: string | null): boolean {
  if (!s) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return d instanceof Date && !isNaN(d.getTime());
}

function buildOrdersFilter(
  shopId: number,
  dateFrom: string | null,
  dateTo: string | null,
  source: SourceKey | null,
  paidOnly: boolean = true
): { sql: string; params: (string | number)[] } {
  let sql = ' WHERE o.shop_id = ?';
  const params: (string | number)[] = [shopId];

  if (paidOnly) sql += " AND o.payment_status = 'paid'";
  if (source) {
    sql += ' AND o.source = ?';
    params.push(source);
  }
  if (dateFrom) {
    sql += ' AND o.created_at >= ?';
    params.push(`${dateFrom} 00:00:00`);
  }
  if (dateTo) {
    sql += ' AND o.created_at <= ?';
    params.push(`${dateTo} 23:59:59`);
  }
  return { sql, params };
}

function isSourceKey(v: unknown): v is SourceKey {
  return v === 'online' || v === 'pos';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id');

    if (!shopId) {
      return NextResponse.json({ error: 'shop_id required' }, { status: 400 });
    }

    const access = await verifyShopAccess(req, parseInt(shopId));
    if (!access.authorized) {
      return access.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawShopId: unknown = access.shopId;
    if (typeof rawShopId !== 'number' || isNaN(rawShopId)) {
      return NextResponse.json({ error: 'Shop not resolved for this session' }, { status: 400 });
    }
    const shopIdNum: number = rawShopId;

    const mode = searchParams.get('mode')?.trim();

    // =====================================================================
    // MODE: periods
    // =====================================================================
    if (mode === 'periods') {
      const [rows] = await pool.query<any[]>(
        `SELECT
           DATE_FORMAT(o.created_at, '%Y-%m') AS ym,
           COUNT(*) AS orders,
           COALESCE(SUM(o.subtotal), 0) AS revenue
         FROM orders o
         WHERE o.shop_id = ? AND o.payment_status = 'paid'
         GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
         ORDER BY ym DESC`,
        [shopIdNum]
      );

      const periods = rows.map(r => ({
        ym: String(r.ym),
        orders: Number(r.orders) || 0,
        revenue: parseFloat(String(r.revenue)) || 0,
      }));

      return NextResponse.json({ success: true, periods });
    }

    // =====================================================================
    // MODE: analytics (default)
    // =====================================================================
    const dateFrom = searchParams.get('date_from')?.trim() || null;
    const dateTo = searchParams.get('date_to')?.trim() || null;
    const sourceParam = searchParams.get('source')?.trim();
    const source: SourceKey | null = isSourceKey(sourceParam) ? sourceParam : null;

    if (dateFrom && !isValidDateString(dateFrom))
      return NextResponse.json({ error: 'Invalid date_from (YYYY-MM-DD)' }, { status: 400 });
    if (dateTo && !isValidDateString(dateTo))
      return NextResponse.json({ error: 'Invalid date_to (YYYY-MM-DD)' }, { status: 400 });
    if (dateFrom && dateTo && dateFrom > dateTo)
      return NextResponse.json({ error: 'date_from must be <= date_to' }, { status: 400 });

    // filtered for paid-only queries
    const fPaid = buildOrdersFilter(shopIdNum, dateFrom, dateTo, source, true);
    // filtered but NOT paid-only (used by summary so it can count all orders)
    const fAll = buildOrdersFilter(shopIdNum, dateFrom, dateTo, source, false);

    // =====================================================================
    // 0a. HERO UNIT
    // =====================================================================
    const [heroUnitRows] = await pool.query<any[]>(
      `SELECT
         oi.product_id,
         oi.variant_id,
         oi.product_name,
         COALESCE(oi.variant_name, oi.product_name) AS unit_name,
         SUM(oi.quantity) AS quantity_sold,
         SUM(oi.quantity * oi.price_at_time) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       ${fPaid.sql}
       GROUP BY oi.product_id, oi.variant_id, oi.product_name, oi.variant_name
       ORDER BY quantity_sold DESC, revenue DESC
       LIMIT 1`,
      fPaid.params
    );

    let heroUnit: AnalyticsResult['heroUnit'] = null;
    if (heroUnitRows.length > 0) {
      const row = heroUnitRows[0];
      const rawVariantId: unknown = row.variant_id;
      const variantId: number | null =
        rawVariantId === null || rawVariantId === undefined ? null : Number(rawVariantId);

      heroUnit = {
        type: variantId !== null ? 'variant' : 'product',
        name: variantId !== null ? String(row.unit_name) : String(row.product_name),
        parent_product: String(row.product_name),
        variant_id: variantId,
        product_id: Number(row.product_id),
        quantity_sold: Number(row.quantity_sold) || 0,
        revenue: parseFloat(String(row.revenue)) || 0,
      };
    }

    // =====================================================================
    // 0b. HERO PRODUCT
    // =====================================================================
    const [heroProductRows] = await pool.query<any[]>(
      `SELECT
         oi.product_id,
         oi.product_name,
         SUM(oi.quantity) AS quantity_sold,
         SUM(oi.quantity * oi.price_at_time) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       ${fPaid.sql}
       GROUP BY oi.product_id, oi.product_name
       ORDER BY quantity_sold DESC, revenue DESC
       LIMIT 1`,
      fPaid.params
    );

    let heroProduct: AnalyticsResult['heroProduct'] = null;
    if (heroProductRows.length > 0) {
      const hp = heroProductRows[0];
      const hpProductId: number = Number(hp.product_id);

      const heroProductParams: (string | number)[] = [...fPaid.params, hpProductId];

      const [topVariantRows] = await pool.query<any[]>(
        `SELECT
           oi.variant_id,
           oi.variant_name,
           SUM(oi.quantity) AS quantity_sold
         FROM order_items oi
         INNER JOIN orders o ON oi.order_id = o.order_id
         ${fPaid.sql} AND oi.product_id = ? AND oi.variant_id IS NOT NULL
         GROUP BY oi.variant_id, oi.variant_name
         ORDER BY quantity_sold DESC
         LIMIT 1`,
        heroProductParams
      );

      let topVariant: { variant_id: number; variant_name: string; quantity_sold: number } | null = null;
      if (topVariantRows.length > 0) {
        const tv = topVariantRows[0];
        topVariant = {
          variant_id: Number(tv.variant_id),
          variant_name: String(tv.variant_name),
          quantity_sold: Number(tv.quantity_sold) || 0,
        };
      }

      heroProduct = {
        product_id: hpProductId,
        product_name: String(hp.product_name),
        quantity_sold: Number(hp.quantity_sold) || 0,
        revenue: parseFloat(String(hp.revenue)) || 0,
        top_variant: topVariant,
      };
    }

    // =====================================================================
    // 1. SUMMARY — filtered, but counts all orders (paid + unpaid)
    // =====================================================================
    const [summaryResult] = await pool.query<any[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.subtotal ELSE 0 END), 0) AS total_revenue,
         COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) AS total_paid_orders,
         COUNT(*) AS total_all_orders
       FROM orders o${fAll.sql}`,
      fAll.params
    );

    const totalRevenue = parseFloat(String(summaryResult[0].total_revenue)) || 0;
    const totalPaidOrders = Number(summaryResult[0].total_paid_orders) || 0;
    const totalAllOrders = Number(summaryResult[0].total_all_orders) || 0;
    const averageOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;
    const collectionRate = totalAllOrders > 0 ? (totalPaidOrders / totalAllOrders) * 100 : 0;

    // =====================================================================
    // 2. AVG ITEMS PER ORDER — filtered
    // =====================================================================
    const [avgItemsResult] = await pool.query<any[]>(
      `SELECT COALESCE(AVG(item_count), 0) AS avg_items
       FROM (
         SELECT oi.order_id, COUNT(*) AS item_count
         FROM order_items oi
         INNER JOIN orders o ON oi.order_id = o.order_id
         ${fPaid.sql}
         GROUP BY oi.order_id
       ) AS item_counts`,
      fPaid.params
    );
    const avgItemsPerOrder = parseFloat(String(avgItemsResult[0].avg_items)) || 0;

    // =====================================================================
    // 3. RETURNING CUSTOMERS — filtered
    // =====================================================================
    const [returningResult] = await pool.query<any[]>(
      `SELECT
         COALESCE(COUNT(DISTINCT CASE WHEN order_count > 1 THEN customer_email END), 0) AS returning_customers,
         COALESCE(COUNT(DISTINCT customer_email), 0) AS total_customers
       FROM (
         SELECT o.customer_email, COUNT(*) AS order_count
         FROM orders o${fPaid.sql}
           AND o.customer_email IS NOT NULL AND o.customer_email <> ''
         GROUP BY o.customer_email
       ) AS customer_orders`,
      fPaid.params
    );
    const returningCustomers = Number(returningResult[0].returning_customers) || 0;
    const totalCustomers = Number(returningResult[0].total_customers) || 0;
    const returningCustomersRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // =====================================================================
    // 4. WEEKEND VS WEEKDAY — filtered
    // =====================================================================
    const [weekendResult] = await pool.query<any[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN DAYOFWEEK(o.created_at) IN (1,7) THEN 1 ELSE 0 END), 0) AS weekend_orders,
         COALESCE(SUM(CASE WHEN DAYOFWEEK(o.created_at) BETWEEN 2 AND 6 THEN 1 ELSE 0 END), 0) AS weekday_orders
       FROM orders o${fPaid.sql}`,
      fPaid.params
    );
    const weekendOrders = Number(weekendResult[0].weekend_orders) || 0;
    const weekdayOrders = Number(weekendResult[0].weekday_orders) || 0;
    const weekendPercentage = totalPaidOrders > 0 ? (weekendOrders / totalPaidOrders) * 100 : 0;
    const weekdayPercentage = totalPaidOrders > 0 ? (weekdayOrders / totalPaidOrders) * 100 : 0;

    // =====================================================================
    // 5. TOP PRODUCTS — filtered
    // =====================================================================
    const [topProducts] = await pool.query<any[]>(
      `SELECT
         oi.product_name,
         COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
         COALESCE(SUM(oi.quantity * oi.price_at_time), 0) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       ${fPaid.sql}
       GROUP BY oi.product_name
       ORDER BY quantity_sold DESC
       LIMIT 5`,
      fPaid.params
    );

    // =====================================================================
    // 6. BEST SELLER — filtered
    // =====================================================================
    const [bestSellerResult] = await pool.query<any[]>(
      `SELECT
         oi.product_name,
         COALESCE(SUM(oi.quantity * oi.price_at_time), 0) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       ${fPaid.sql}
       GROUP BY oi.product_name
       ORDER BY revenue DESC
       LIMIT 1`,
      fPaid.params
    );

    const bestSeller = bestSellerResult.length > 0 ? {
      product_name: String(bestSellerResult[0].product_name),
      revenue: parseFloat(String(bestSellerResult[0].revenue)) || 0,
    } : {
      product_name: 'No products sold yet',
      revenue: 0,
    };

    // =====================================================================
    // 7. PAYMENT SPLIT — filtered
    // =====================================================================
    const [paymentSplitRows] = await pool.query<any[]>(
      `SELECT o.payment_method, COUNT(*) AS count
       FROM orders o${fPaid.sql}
       GROUP BY o.payment_method`,
      fPaid.params
    );

    let mpesaCount = 0;
    let codCount = 0;
    paymentSplitRows.forEach(row => {
      if (row.payment_method === 'mpesa') mpesaCount = Number(row.count) || 0;
      else if (row.payment_method === 'cash_on_delivery') codCount = Number(row.count) || 0;
    });

    const paymentSplitResult = {
      mpesa: mpesaCount,
      cod: codCount,
      mpesa_percentage: totalPaidOrders > 0 ? (mpesaCount / totalPaidOrders) * 100 : 0,
      cod_percentage: totalPaidOrders > 0 ? (codCount / totalPaidOrders) * 100 : 0,
    };

    // =====================================================================
    // 8. HOURLY DISTRIBUTION — filtered
    // =====================================================================
    const [hourlyRows] = await pool.query<any[]>(
      `SELECT HOUR(o.created_at) AS hour, COUNT(*) AS order_count
       FROM orders o${fPaid.sql}
       GROUP BY HOUR(o.created_at)`,
      fPaid.params
    );

    const hourlyArray = new Array(24).fill(0).map((_, hour) => ({ hour, order_count: 0 }));
    hourlyRows.forEach(row => {
      const h = Number(row.hour);
      if (h >= 0 && h < 24) hourlyArray[h].order_count = Number(row.order_count) || 0;
    });

    // =====================================================================
    // 9. ORDERS BY CITY — filtered
    // =====================================================================
    const [ordersByCity] = await pool.query<any[]>(
      `SELECT
         COALESCE(o.customer_city, 'Unknown') AS city,
         COUNT(*) AS order_count,
         COALESCE(SUM(o.subtotal), 0) AS revenue
       FROM orders o${fPaid.sql}
       GROUP BY o.customer_city
       ORDER BY order_count DESC`,
      fPaid.params
    );

    // =====================================================================
    // 10. TOP VARIANTS — filtered
    // =====================================================================
    const [topVariants] = await pool.query<any[]>(
      `SELECT oi.variant_id, oi.variant_name, oi.product_name,
              COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
              COALESCE(SUM(oi.quantity * oi.price_at_time), 0) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       ${fPaid.sql} AND oi.variant_id IS NOT NULL
       GROUP BY oi.variant_id, oi.variant_name, oi.product_name
       ORDER BY quantity_sold DESC
       LIMIT 5`,
      fPaid.params
    );

    // =====================================================================
    // 11. SOURCE SPLIT — filtered (ignores source param, both sides shown)
    // =====================================================================
    const fSplit = buildOrdersFilter(shopIdNum, dateFrom, dateTo, null, true);
    const [sourceRows] = await pool.query<any[]>(
      `SELECT o.source, COUNT(*) AS orders, COALESCE(SUM(o.subtotal), 0) AS revenue
       FROM orders o${fSplit.sql}
       GROUP BY o.source`,
      fSplit.params
    );

    const sourceSplit: AnalyticsResult['sourceSplit'] = {
      online: { orders: 0, revenue: 0 },
      pos: { orders: 0, revenue: 0 },
    };
    sourceRows.forEach(r => {
      const src: unknown = r.source;
      if (src === 'online' || src === 'pos') {
        const key: SourceKey = src;
        sourceSplit[key] = {
          orders: Number(r.orders) || 0,
          revenue: parseFloat(String(r.revenue)) || 0,
        };
      }
    });

    // =====================================================================
    // 12. MONTHLY SERIES — filtered
    // =====================================================================
    const [monthlyRows] = await pool.query<any[]>(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS ym,
              COUNT(*) AS orders,
              COALESCE(SUM(o.subtotal), 0) AS revenue
       FROM orders o${fPaid.sql}
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
       ORDER BY ym ASC`,
      fPaid.params
    );
    const monthlySeries = monthlyRows.map(r => ({
      ym: String(r.ym),
      orders: Number(r.orders) || 0,
      revenue: parseFloat(String(r.revenue)) || 0,
    }));

    // =====================================================================
    // RESPONSE
    // =====================================================================
    const analyticsData: AnalyticsResult = {
      heroUnit,
      heroProduct,
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
        product_name: String(p.product_name),
        quantity_sold: Number(p.quantity_sold) || 0,
        revenue: parseFloat(String(p.revenue)) || 0,
      })),
      bestSeller,
      paymentSplit: paymentSplitResult,
      hourlyDistribution: hourlyArray,
      ordersByCity: ordersByCity.map(c => ({
        city: String(c.city) || 'Unknown',
        order_count: Number(c.order_count) || 0,
        revenue: parseFloat(String(c.revenue)) || 0,
      })),
      topVariants: topVariants.map(v => ({
        variant_id: Number(v.variant_id),
        variant_name: String(v.variant_name),
        product_name: String(v.product_name),
        quantity_sold: Number(v.quantity_sold) || 0,
        revenue: parseFloat(String(v.revenue)) || 0,
      })),
      sourceSplit,
      monthlySeries,
      appliedFilters: { date_from: dateFrom, date_to: dateTo, source },
    };

    return NextResponse.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}