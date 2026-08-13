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
  customer_email: string;
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

    if (user && user.email) {
      const [rows] = await pool.query<UserRow[]>(
        'SELECT user_id FROM users WHERE supabase_uid = ?',
        [user.id]
      );

      if (rows.length > 0) {
        const userId = rows[0].user_id;
        const userEmail = user.email.toLowerCase().trim();
        
        let customerId = existingCustomerId;
        let orderEmail: string | null = null;

        // ✅ OPTIMIZATION: Fetch order details if customerId is undefined OR null (to check email match)
        if (customerId === undefined || customerId === null) {
          const [orderRows] = await pool.query<OrderRow[]>(
            'SELECT customer_id, customer_email FROM orders WHERE order_id = ?',
            [orderId]
          );
          if (orderRows.length > 0) {
            customerId = orderRows[0].customer_id;
            orderEmail = orderRows[0].customer_email?.toLowerCase().trim() || null;
          }
        }

        // ✅ Check if user owns the order by customer_id OR matching email
        const isOwnerByCustomerId = customerId !== null && customerId === userId;
        const isOwnerByEmail = orderEmail !== null && orderEmail === userEmail;

        if (isOwnerByCustomerId || isOwnerByEmail) {
          // ✅ If order is a guest order (customer_id IS NULL), claim it!
          if (customerId === null && orderEmail === userEmail) {
            await pool.query(
              'UPDATE orders SET customer_id = ? WHERE order_id = ?',
              [userId, orderId]
            );
          }
          return { granted: true, userId };
        }
      }
    }
  } catch {
    // Fall through to guest JWT check
  }

  // Guest JWT token check
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