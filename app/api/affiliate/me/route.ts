// app/api/affiliate/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAffiliateAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  const { authorized, affiliateId, role } = await verifyAffiliateAccess(request);
  
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (role === 'super_admin') {
    const [affiliates] = await pool.query<RowDataPacket[]>(
      `SELECT a.affiliate_id, u.email, u.full_name, a.ref_code, a.conversion_count
       FROM affiliate a
       JOIN users u ON a.user_id = u.user_id`
    );
    return NextResponse.json({ success: true, isAdmin: true, affiliates });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT affiliate_id, ref_code, conversion_count FROM affiliate WHERE affiliate_id = ?`,
    [affiliateId]
  );
  
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    affiliate_id: rows[0].affiliate_id,
    ref_code: rows[0].ref_code,
    conversion_count: rows[0].conversion_count,
  });
}