import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    const [orders] = await pool.query<any[]>(
      `SELECT o.*, s.shop_name, s.contact_email, s.contact_phone
       FROM orders o
       JOIN shops s ON o.shop_id = s.shop_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orders[0];

    const [items] = await pool.query<any[]>(
      `SELECT product_name, variant_name, quantity, price_at_time
       FROM order_items 
       WHERE order_id = ?`,
      [orderId]
    );

    // ✅ FIX: Convert all numeric values to Number
    const subtotal = Number(order.subtotal) || 0;
    const deliveryFee = Number(order.delivery_fee) || 0;
    const total = Number(order.total) || subtotal + deliveryFee;

    const orderItems = items.map((item: any) => ({
      product_name: item.product_name,
      variant_name: item.variant_name,
      quantity: item.quantity,
      price_at_time: Number(item.price_at_time) || 0
    }));

    // Send buyer email
    await sendBuyerOrderEmail({
      to: order.customer_email,
      customer_name: order.customer_name,
      order_number: order.order_number,
      items: orderItems,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      delivery_zone: order.delivery_zone,
      total: total,
      seller_name: order.shop_name,
      seller_email: order.contact_email,
      seller_phone: order.contact_phone,
    });

    // Send seller email
    if (order.contact_email) {
      await sendSellerOrderEmail({
        to: order.contact_email,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address || '',
        order_number: order.order_number,
        items: orderItems,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        delivery_zone: order.delivery_zone,
        total: total,
        special_instructions: order.special_instructions || '',
        payment_method: order.payment_method || 'mpesa',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation emails sent successfully'
    });

  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}