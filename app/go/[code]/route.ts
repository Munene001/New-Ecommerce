import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT affiliate_id FROM affiliate WHERE ref_code = ?',
    [code]
  );
  
  if (rows.length > 0) {
    const cookieStore = await cookies();
    cookieStore.set('affiliate_id', rows[0].affiliate_id.toString(), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 60,
      path: '/',
    });
  }
  
  return NextResponse.redirect(new URL('/', request.url));
}