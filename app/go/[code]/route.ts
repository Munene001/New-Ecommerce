// app/go/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Look up the affiliate by referral code
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT affiliate_id FROM affiliate WHERE ref_code = ?',
    [code]
  );

  if (rows.length > 0) {
    const cookieStore = await cookies();
    cookieStore.set('affiliate_id', rows[0].affiliate_id.toString(), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 60, // 60 days
      path: '/',
    });
  }


  const host = request.headers.get('host');
  
  const proto = request.headers.get('x-forwarded-proto') || 
                (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  
  
  if (!host) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://paziatech.co.ke';
    return NextResponse.redirect(new URL('/', baseUrl));
  }

  const baseUrl = `${proto}://${host}`;
  // Redirect to the home page on the same domain
  return NextResponse.redirect(new URL('/', baseUrl));
}