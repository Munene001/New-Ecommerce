import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  user_id: number;
}

interface OrderRow extends RowDataPacket {
  customer_id: number | null;
}

export async function getOrderAccess(
  req: NextRequest,
  orderId: number,
  existingCustomerId?: number | null
): Promise<{ granted: boolean; userId?: number; error?: string }> {
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is missing.');
    return { granted: false, error: 'Server configuration error' };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [rows] = await pool.query<UserRow[]>(
        'SELECT user_id FROM users WHERE supabase_uid = ?',
        [user.id]
      );

      if (rows.length > 0) {
        const userId = rows[0].user_id;
        
        let customerId = existingCustomerId;

        if (customerId === undefined) {
          const [orderRows] = await pool.query<OrderRow[]>(
            'SELECT customer_id FROM orders WHERE order_id = ?',
            [orderId]
          );
          customerId = orderRows.length > 0 ? orderRows[0].customer_id : null;
        }

        if (customerId !== null && customerId === userId) {
          return { granted: true, userId };
        }
      }
    }
  } catch {
    // Fall through to guest JWT check
  }

  const authHeader = req.headers.get('authorization');
  const token = 
    authHeader?.replace('Bearer ', '') || 
    req.nextUrl.searchParams.get('token');

  if (!token) {
    return { granted: false, error: 'Authentication required to view this order' };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { orderId: number };
    
    if (Number(decoded.orderId) === Number(orderId)) {
      return { granted: true };
    }
    return { granted: false, error: 'Token does not match this order' };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { granted: false, error: 'Access token expired' };
    }
    return { granted: false, error: 'Invalid access token' };
  }
}