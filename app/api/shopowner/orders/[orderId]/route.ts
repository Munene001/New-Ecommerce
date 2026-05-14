import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  shop_id: number;
  customer_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  special_instructions: string | null;
  subtotal: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow extends RowDataPacket {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
}

// Helper to get shop_id from order
async function getShopIdFromOrder(orderId: number): Promise<number | null> {
  const [rows] = await pool.query<OrderRow[]>(
    'SELECT shop_id FROM orders WHERE order_id = ?',
    [orderId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

// GET /api/shopowner/orders/123
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get shop_id from order
    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Get order details
    const [orders] = await pool.query<OrderRow[]>(
      `SELECT 
        order_id, order_number, shop_id, customer_id, customer_name, customer_email,
        customer_phone, customer_city, customer_address, special_instructions,
        subtotal, payment_method, payment_status, order_status, created_at, updated_at
       FROM orders WHERE order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const [items] = await pool.query<OrderItemRow[]>(
      `SELECT order_item_id, product_id, product_name, quantity, price_at_time
       FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order: orders[0],
      items
    });

  } catch (error) {
    console.error('GET order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PUT /api/shopowner/orders/123
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get shop_id from order
    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const body = await req.json();
    const { action, value } = body;

    // Handle cancel action
    if (action === 'cancel') {
      await pool.query(
        `UPDATE orders SET order_status = 'cancelled' WHERE order_id = ?`,
        [orderId]
      );
      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    }

    // Handle status update
    if (action === 'status') {
      const allowedStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(value)) {
        return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
      }
      
      await pool.query(
        `UPDATE orders SET order_status = ? WHERE order_id = ?`,
        [value, orderId]
      );
      return NextResponse.json({
        success: true,
        message: `Order status updated to ${value}`
      });
    }

    // Handle payment status update
    if (action === 'payment') {
      const allowedPaymentStatuses = ['pending', 'paid'];
      if (!allowedPaymentStatuses.includes(value)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
      }
      
      await pool.query(
        `UPDATE orders SET payment_status = ? WHERE order_id = ?`,
        [value, orderId]
      );
      return NextResponse.json({
        success: true,
        message: `Payment status updated to ${value}`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('PUT order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/shopowner/orders/123
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderIdParam } = await params;
    const orderId = parseInt(orderIdParam);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Get shop_id from order
    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete order items first (foreign key constraint)
      await connection.query(
        `DELETE FROM order_items WHERE order_id = ?`,
        [orderId]
      );
      
      // Delete order
      await connection.query(
        `DELETE FROM orders WHERE order_id = ?`,
        [orderId]
      );

      await connection.commit();
      
      return NextResponse.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('DELETE order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}