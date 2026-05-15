// app/api/admin/shops/[shopId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
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