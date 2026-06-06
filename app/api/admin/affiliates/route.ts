import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request);
  if (!authorized) return response;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        a.affiliate_id AS id,
        a.user_id,
        u.email,
        u.full_name,
        a.conversion_count,
        a.created_at
      FROM affiliate a
      JOIN users u ON a.user_id = u.user_id
      ORDER BY a.created_at DESC
    `);
    return NextResponse.json({ affiliates: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request);
  if (!authorized) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing affiliate ID' }, { status: 400 });
  }

  try {
    // Remove foreign key references in tenant (set NULL)
    await pool.query('UPDATE tenant SET affiliate_id = NULL WHERE affiliate_id = ?', [id]);
    // Delete the affiliate record
    await pool.query('DELETE FROM affiliate WHERE affiliate_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete affiliate' }, { status: 500 });
  }
}