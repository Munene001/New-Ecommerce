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
  stock_deducted: number;
}

interface OrderItemRow extends RowDataPacket {
  order_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: number;
  variant_id: number | null;
  variant_name: string | null;
  variant_attributes: string | null;
}

async function getShopIdFromOrder(orderId: number): Promise<number | null> {
  const [rows] = await pool.query<OrderRow[]>(
    'SELECT shop_id FROM orders WHERE order_id = ?',
    [orderId]
  );
  return rows.length > 0 ? rows[0].shop_id : null;
}

function safeParseVariantAttributes(value: string | null): any {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

async function deductStockForOrder(orderId: number): Promise<{ success: boolean; deducted: boolean }> {
  const [items] = await pool.query<OrderItemRow[]>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  let deducted = false;

  for (const item of items) {
    if (item.variant_id) {
      const [stock] = await pool.query<RowDataPacket[]>(
        `SELECT stock_quantity FROM product_variants WHERE variant_id = ?`,
        [item.variant_id]
      );
      
      if (stock[0]?.stock_quantity > 0) {
        deducted = true;
        await pool.query(
          `UPDATE product_variants 
           SET stock_quantity = GREATEST(0, stock_quantity - ?)
           WHERE variant_id = ?`,
          [item.quantity, item.variant_id]
        );
      }
    } else {
      const [stock] = await pool.query<RowDataPacket[]>(
        `SELECT stock_quantity FROM products WHERE product_id = ?`,
        [item.product_id]
      );
      
      if (stock[0]?.stock_quantity > 0) {
        deducted = true;
        await pool.query(
          `UPDATE products 
           SET stock_quantity = GREATEST(0, stock_quantity - ?)
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }
    }
  }
  
  return { success: true, deducted };
}

async function restoreStockForOrder(orderId: number): Promise<void> {
  const [items] = await pool.query<OrderItemRow[]>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  for (const item of items) {
    if (item.variant_id) {
      await pool.query(
        `UPDATE product_variants 
         SET stock_quantity = stock_quantity + ? 
         WHERE variant_id = ?`,
        [item.quantity, item.variant_id]
      );
    } else {
      await pool.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity + ? 
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }
  }
}

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

    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const [orders] = await pool.query<OrderRow[]>(
      `SELECT 
        order_id, order_number, shop_id, customer_id, customer_name, customer_email,
        customer_phone, customer_city, customer_address, special_instructions,
        subtotal, payment_method, payment_status, order_status, created_at, updated_at,
        stock_deducted
       FROM orders WHERE order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const [items] = await pool.query<OrderItemRow[]>(
      `SELECT 
        order_item_id, product_id, product_name, quantity, price_at_time,
        variant_id, variant_name, variant_attributes
       FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order: orders[0],
      items: items.map(item => ({
        ...item,
        variant_attributes: safeParseVariantAttributes(item.variant_attributes)
      }))
    });

  } catch (error) {
    console.error('GET order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

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

    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const body = await req.json();
    const { action, value } = body;

    if (action === 'cancel') {
      const [currentOrder] = await pool.query<OrderRow[]>(
        'SELECT payment_status, stock_deducted FROM orders WHERE order_id = ?',
        [orderId]
      );
      
      if (currentOrder[0]?.payment_status === 'paid' && currentOrder[0]?.stock_deducted === 1) {
        await restoreStockForOrder(orderId);
        await pool.query(
          `UPDATE orders SET stock_deducted = FALSE WHERE order_id = ?`,
          [orderId]
        );
      }
      
      await pool.query(
        `UPDATE orders SET order_status = 'cancelled' WHERE order_id = ?`,
        [orderId]
      );
      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully'
      });
    }

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

    if (action === 'payment') {
      const allowedPaymentStatuses = ['pending', 'paid'];
      if (!allowedPaymentStatuses.includes(value)) {
        return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
      }
      
      const [currentOrder] = await pool.query<OrderRow[]>(
        'SELECT payment_status, stock_deducted FROM orders WHERE order_id = ?',
        [orderId]
      );
      const currentStatus = currentOrder[0]?.payment_status;
      const stockDeducted = currentOrder[0]?.stock_deducted === 1;
      
      if (currentStatus === 'pending' && value === 'paid') {
        const result = await deductStockForOrder(orderId);
        if (result.deducted) {
          await pool.query(
            `UPDATE orders SET stock_deducted = TRUE WHERE order_id = ?`,
            [orderId]
          );
        }
      }
      
      if (currentStatus === 'paid' && value === 'pending' && stockDeducted) {
        await restoreStockForOrder(orderId);
        await pool.query(
          `UPDATE orders SET stock_deducted = FALSE WHERE order_id = ?`,
          [orderId]
        );
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

    const shopId = await getShopIdFromOrder(orderId);
    if (!shopId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { authorized, response } = await verifyShopAccess(req, shopId);
    
    if (!authorized) {
      return response;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `DELETE FROM order_items WHERE order_id = ?`,
        [orderId]
      );
      
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