import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ============ DELETE SHOP (ADMIN ONLY) ============
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    // ADMIN only access
    const { authorized, response } = await verifyAdminAccess(request);
    if (!authorized) return response;

    const { shopId: shopIdParam } = await params;
    const shopId = parseInt(shopIdParam);
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop ID' }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM shops WHERE shop_id = ?',
      [shopId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Shop deleted successfully'
    });

  } catch (error) {
    console.error('DELETE shop error:', error);
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}

// ============ GET SHOP ANALYTICS (ADMIN + SHOP OWNER) ============
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId: shopIdParam } = await params;
    const shopId = parseInt(shopIdParam);
    
    if (isNaN(shopId)) {
      return NextResponse.json({ error: 'Invalid shop ID' }, { status: 400 });
    }
    
    // ADMIN or SHOP OWNER access
    const { authorized, response } = await verifyShopAccess(request, shopId);
    if (!authorized) return response;

    // Get query parameters (optional date range)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    // Get shop basic info first
    const [shopInfo] = await pool.query<RowDataPacket[]>(
      'SELECT shop_id, shop_name, shop_slug FROM shops WHERE shop_id = ?',
      [shopId]
    );

    // ============ 1. FUNNEL DATA ============
    const [funnelResult] = await pool.query<RowDataPacket[]>(
      `SELECT 
        event_type,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM shop_leads
      WHERE shop_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND event_type IN ('shop_view', 'product_view', 'add_to_cart', 'checkout_page_view', 'order_placed', 'payment_success')
      GROUP BY event_type`,
      [shopId, days]
    );

    // ============ 2. ENGAGEMENT DATA ============
    const [engagementResult] = await pool.query<RowDataPacket[]>(
      `SELECT 
        event_type,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM shop_leads
      WHERE shop_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND event_type IN ('whatsapp_click', 'phone_click')
      GROUP BY event_type`,
      [shopId, days]
    );

    // ============ 3. DYNAMIC SESSION TABLE ============
    const [eventTypes] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT event_type 
       FROM shop_leads 
       WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [shopId, days]
    );

    // If no event types, return empty response early
    if (eventTypes.length === 0) {
      const funnelMap: Record<string, number> = {
        shop_view: 0,
        product_view: 0,
        add_to_cart: 0,
        checkout_page_view: 0,
        order_placed: 0,
        payment_success: 0
      };
      
      return NextResponse.json({
        success: true,
        shop: shopInfo[0] || null,
        date_range: {
          days: days,
          from: `LAST ${days} DAYS`
        },
        summary: {
          total_sessions: 0,
          completed_sessions: 0,
          conversion_rate: '0%'
        },
        funnel: funnelMap,
        engagement: {
          whatsapp_click: { clicks: 0, sessions: 0 },
          phone_click: { clicks: 0, sessions: 0 }
        },
        sessions: [],
        available_event_types: []
      });
    }

    // Build dynamic column list
    const eventColumns = eventTypes.map(e => {
      const event = e.event_type;
      if (['checkout_page_view', 'order_placed', 'payment_success'].includes(event)) {
        return `MAX(CASE WHEN event_type = '${event}' THEN 1 ELSE 0 END) as \`${event}\``;
      }
      return `COUNT(CASE WHEN event_type = '${event}' THEN 1 END) as \`${event}\``;
    }).join(',\n        ');

    // Get sessions with dynamic columns
    const [sessions] = await pool.query<RowDataPacket[]>(
      `SELECT 
        session_id,
        MIN(created_at) as start_time,
        MAX(created_at) as last_activity,
        ANY_VALUE(ip_address) as ip_address,
        ANY_VALUE(referrer_url) as referrer_url,
        ${eventColumns},
        CASE 
          WHEN MAX(CASE WHEN event_type = 'payment_success' THEN 1 ELSE 0 END) = 1 THEN 'Completed'
          WHEN MAX(CASE WHEN event_type = 'order_placed' THEN 1 ELSE 0 END) = 1 THEN 'Dropped at Payment'
          WHEN MAX(CASE WHEN event_type = 'checkout_page_view' THEN 1 ELSE 0 END) = 1 THEN 'Dropped at Order'
          WHEN MAX(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END) = 1 THEN 'Dropped at Checkout'
          WHEN MAX(CASE WHEN event_type IN ('whatsapp_click', 'phone_click') THEN 1 ELSE 0 END) = 1 THEN 'Engaged No Purchase'
          WHEN MAX(CASE WHEN event_type IN ('product_view', 'shop_view') THEN 1 ELSE 0 END) = 1 THEN 'Just Browsing'
          ELSE 'Unknown'
        END as status
      FROM shop_leads
      WHERE shop_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY session_id
      ORDER BY last_activity DESC
      LIMIT 1000`,
      [shopId, days]
    );

    // ============ 4. SUMMARY STATS ============
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s: any) => s.status === 'Completed').length;
    const conversionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;

    // Format funnel data
    const funnelMap: Record<string, number> = {
      shop_view: 0,
      product_view: 0,
      add_to_cart: 0,
      checkout_page_view: 0,
      order_placed: 0,
      payment_success: 0
    };
    
    funnelResult.forEach((row: any) => {
      funnelMap[row.event_type] = parseInt(row.unique_sessions);
    });

    // Format engagement data
    const engagementMap: Record<string, { clicks: number; sessions: number }> = {
      whatsapp_click: { clicks: 0, sessions: 0 },
      phone_click: { clicks: 0, sessions: 0 }
    };
    
    engagementResult.forEach((row: any) => {
      engagementMap[row.event_type] = {
        clicks: row.total_clicks,
        sessions: row.unique_sessions
      };
    });

    return NextResponse.json({
      success: true,
      shop: shopInfo[0] || null,
      date_range: {
        days: days,
        from: `LAST ${days} DAYS`
      },
      summary: {
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        conversion_rate: `${conversionRate}%`
      },
      funnel: funnelMap,
      engagement: engagementMap,
      sessions: sessions,
      available_event_types: eventTypes.map((e: any) => e.event_type)
    });

  } catch (error) {
    console.error('GET shop analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}