// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// ============ GET SHOP OWNER ANALYTICS (ADMIN ONLY) ============
export async function GET(request: NextRequest) {
  try {
    // ADMIN only access
    const { authorized, response } = await verifyAdminAccess(request);
    if (!authorized) return response;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // ============ 1. FUNNEL DATA (Signup stages only) ============
    const [funnelResult] = await pool.query<RowDataPacket[]>(
      `SELECT 
        event_type,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM shopowner_leads
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND event_type IN ('signup_email', 'email_verification_sent', 'email_verification_success')
      GROUP BY event_type`,
      [days]
    );

    // ============ 2. ENGAGEMENT DATA (WhatsApp & Phone) ============
    const [engagementResult] = await pool.query<RowDataPacket[]>(
      `SELECT 
        event_type,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM shopowner_leads
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND event_type IN ('whatsapp_click', 'phone_click')
      GROUP BY event_type`,
      [days]
    );

    // ============ 3. DYNAMIC VISITOR TABLE (One row per IP) ============
    // Get all event types for the date range
    const [eventTypes] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT event_type 
       FROM shopowner_leads 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // If no event types, return empty response early
    if (eventTypes.length === 0) {
      return NextResponse.json({
        success: true,
        date_range: { days: days, from: `LAST ${days} DAYS` },
        summary: {
          unique_visitors: 0,
          signups_started: 0,
          verifications_sent: 0,
          verifications_success: 0
        },
        funnel: {
          signup_email: 0,
          email_verification_sent: 0,
          email_verification_success: 0
        },
        engagement: {
          whatsapp_click: { clicks: 0, unique_visitors: 0 },
          phone_click: { clicks: 0, unique_visitors: 0 }
        },
        visitors: [],
        available_event_types: []
      });
    }

    // Build dynamic column list for event counts
    const eventColumns = eventTypes.map(e => {
      const event = e.event_type;
      return `SUM(CASE WHEN event_type = '${event}' THEN 1 ELSE 0 END) as \`${event}\``;
    }).join(',\n        ');

    // Get visitors grouped by IP address
    const [visitors] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ip_address,
        COUNT(*) as total_events,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity,
        ANY_VALUE(referrer_url) as referrer_url,
        ${eventColumns},
        CASE 
          WHEN SUM(CASE WHEN event_type = 'email_verification_success' THEN 1 ELSE 0 END) > 0 THEN 'Completed Signup'
          WHEN SUM(CASE WHEN event_type = 'email_verification_sent' THEN 1 ELSE 0 END) > 0 THEN 'Dropped at Verification'
          WHEN SUM(CASE WHEN event_type = 'signup_email' THEN 1 ELSE 0 END) > 0 THEN 'Dropped at Signup'
          WHEN SUM(CASE WHEN event_type IN ('whatsapp_click', 'phone_click') THEN 1 ELSE 0 END) > 0 THEN 'Engaged'
          ELSE 'Just Browsing'
        END as status
      FROM shopowner_leads
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY ip_address
      ORDER BY last_activity DESC
      LIMIT 1000`,
      [days]
    );

    // ============ 4. SUMMARY STATS ============
    const uniqueVisitors = visitors.length;
    
    // Calculate funnel counts
    const funnelMap: Record<string, number> = {
      signup_email: 0,
      email_verification_sent: 0,
      email_verification_success: 0
    };
    
    funnelResult.forEach((row: any) => {
      funnelMap[row.event_type] = parseInt(row.unique_visitors);
    });

    // Calculate engagement counts
    const engagementMap: Record<string, { clicks: number; unique_visitors: number }> = {
      whatsapp_click: { clicks: 0, unique_visitors: 0 },
      phone_click: { clicks: 0, unique_visitors: 0 }
    };
    
    engagementResult.forEach((row: any) => {
      engagementMap[row.event_type] = {
        clicks: row.total_clicks,
        unique_visitors: row.unique_visitors
      };
    });

    return NextResponse.json({
      success: true,
      date_range: {
        days: days,
        from: `LAST ${days} DAYS`
      },
      summary: {
        unique_visitors: uniqueVisitors,
        signups_started: funnelMap.signup_email,
        verifications_sent: funnelMap.email_verification_sent,
        verifications_success: funnelMap.email_verification_success
      },
      funnel: funnelMap,
      engagement: engagementMap,
      visitors: visitors,
      available_event_types: eventTypes.map((e: any) => e.event_type)
    });

  } catch (error) {
    console.error('GET shop owner analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}