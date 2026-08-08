// app/api/shops/payments/update-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

interface TransactionRow extends RowDataPacket {
  transaction_id: number;
  order_id: number;
  status: string;
  retryable: number;
}

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  subtotal: number;
  delivery_fee: number;
  delivery_zone: string | null;
  total: number;
  special_instructions: string | null;
}

interface OrderItemRow extends RowDataPacket {
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price_at_time: number;
}

interface ShopRow extends RowDataPacket {
  shop_name: string;
  contact_email: string;
  contact_phone: string;
}

async function deductStockForOrder(orderId: number): Promise<{ success: boolean; deducted: boolean }> {
  const [items] = await pool.query<any[]>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  let deducted = false;

  for (const item of items) {
    if (item.variant_id) {
      const [stock] = await pool.query<any[]>(
        `SELECT stock_quantity FROM product_variants WHERE variant_id = ?`,
        [item.variant_id]
      );
      
      if (stock.length > 0 && stock[0].stock_quantity > 0) {
        deducted = true;
        await pool.query(
          `UPDATE product_variants 
           SET stock_quantity = GREATEST(0, stock_quantity - ?)
           WHERE variant_id = ?`,
          [item.quantity, item.variant_id]
        );
      }
    } else {
      const [stock] = await pool.query<any[]>(
        `SELECT stock_quantity FROM products WHERE product_id = ?`,
        [item.product_id]
      );
      
      if (stock.length > 0 && stock[0].stock_quantity > 0) {
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

async function getShopDetailsForOrder(orderId: number): Promise<ShopRow | null> {
  const [rows] = await pool.query<ShopRow[]>(
    `SELECT s.shop_name, s.contact_email, s.contact_phone
     FROM orders o
     JOIN shops s ON o.shop_id = s.shop_id
     WHERE o.order_id = ?`,
    [orderId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    // 🔒 STEP 1: Verify the internal secret header
    const internalSecret = req.headers.get('x-internal-secret');
    const EXPECTED_SECRET = process.env.SPRING_BOOT_INTERNAL_SECRET;

    if (!EXPECTED_SECRET || internalSecret !== EXPECTED_SECRET) {
      console.warn('🚨 Unauthorized callback attempt detected!');
      console.warn('📝 Received secret:', internalSecret);
      console.warn('🔑 Expected secret:', EXPECTED_SECRET ? '✓ Set' : '❌ Not set');
      return NextResponse.json(
        { success: false, error: 'Unauthorized origin' },
        { status: 401 }
      );
    }

    console.log('✅ Internal secret verified - processing callback');

    // STEP 2: Parse the payload
    const body = await req.json();
    const { 
      checkoutRequestId, 
      status, 
      resultCode, 
      resultDesc, 
      retryable, 
      displayMessage 
    } = body;

    console.log('📞 Received from Spring Boot:', { 
      checkoutRequestId, 
      status, 
      resultCode,
      retryable,
      displayMessage
    });

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, error: 'checkoutRequestId is required' },
        { status: 400 }
      );
    }

    // STEP 3: Rest of your existing logic...
    const [transactions] = await pool.query<TransactionRow[]>(
      `SELECT transaction_id, order_id, status, retryable
       FROM stk_push_transactions 
       WHERE checkout_request_id = ?`,
      [checkoutRequestId]
    );

    if (transactions.length === 0) {
      console.error('❌ Transaction not found for:', checkoutRequestId);
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transaction = transactions[0];
    const orderId = transaction.order_id;

    if (transaction.status !== 'pending') {
      console.log(`⚠️ Transaction already ${transaction.status}, ignoring duplicate`);
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        alreadyProcessed: true,
        status: transaction.status
      });
    }

    const isSuccess = status === 'COMPLETED';
    const retryableCodes = [1032, 1, 2001, 1037, 8006];
    const isRetryable = retryableCodes.includes(resultCode);
    const transactionStatus = isSuccess ? 'completed' : 'failed';
    const orderPaymentStatus = isSuccess ? 'paid' : 'pending';
    const orderOrderStatus = isSuccess ? 'processing' : 'pending';

    const [updateResult] = await pool.query<ResultSetHeader>(
      `UPDATE stk_push_transactions 
       SET status = ?,
           result_code = ?,
           result_description = ?,
           retryable = ?,
           updated_at = NOW()
       WHERE checkout_request_id = ? 
         AND status = 'pending'`,
      [
        transactionStatus,
        resultCode,
        resultDesc,
        isRetryable ? 1 : 0,
        checkoutRequestId
      ]
    );

    if (updateResult.affectedRows === 0) {
      console.log('⚠️ No rows updated (already processed)');
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        alreadyProcessed: true
      });
    }

    await pool.query(
      `UPDATE orders 
       SET payment_status = ?,
           order_status = ?,
           updated_at = NOW()
       WHERE order_id = ?`,
      [orderPaymentStatus, orderOrderStatus, orderId]
    );

    console.log(`✅ Order ${orderId} payment_status: ${orderPaymentStatus}, retryable: ${isRetryable}`);

    // Handle successful payment: stock deduction + emails
    if (isSuccess) {
      const [orderRows] = await pool.query<OrderRow[]>(
        `SELECT order_id, order_number, customer_email, customer_name, 
                customer_phone, customer_address, customer_city,
                subtotal, delivery_fee, delivery_zone, total, special_instructions
         FROM orders 
         WHERE order_id = ?`,
        [orderId]
      );

      if (orderRows.length > 0) {
        const order = orderRows[0];
        
        try {
          const stockResult = await deductStockForOrder(orderId);
          if (stockResult.deducted) {
            await pool.query(
              `UPDATE orders SET stock_deducted = TRUE WHERE order_id = ?`,
              [orderId]
            );
            console.log(`✅ Stock deducted for order ${orderId}`);
          } else {
            console.log(`⚠️ No stock to deduct for order ${orderId}`);
          }
        } catch (stockError) {
          console.error(`❌ Failed to deduct stock for order ${orderId}:`, stockError);
        }
        
        const [orderItems] = await pool.query<OrderItemRow[]>(
          `SELECT product_name, variant_name, quantity, price_at_time
           FROM order_items 
           WHERE order_id = ?`,
          [orderId]
        );
        
        try {
          const shopDetails = await getShopDetailsForOrder(orderId);
          
          // ✅ FIX: Convert all numeric values to Number
          const subtotal = Number(order.subtotal) || 0;
          const deliveryFee = Number(order.delivery_fee) || 0;
          const total = Number(order.total) || subtotal + deliveryFee;
          
          console.log('🔍 ====== EMAIL DEBUG ======');
          console.log('Order ID:', orderId);
          console.log('Order Number:', order.order_number);
          console.log('Subtotal:', subtotal);
          console.log('Delivery Fee:', deliveryFee);
          console.log('Total:', total);
          console.log('Shop Details exists:', !!shopDetails);
          console.log('Shop Name:', shopDetails?.shop_name);
          console.log('Contact Email:', shopDetails?.contact_email);
          console.log('============================');
          
          if (shopDetails) {
            console.log('📧 Sending buyer email to:', order.customer_email);
            await sendBuyerOrderEmail({
              to: order.customer_email,
              customer_name: order.customer_name,
              order_number: order.order_number,
              items: orderItems.map(item => ({
                product_name: item.product_name,
                variant_name: item.variant_name,
                quantity: item.quantity,
                price_at_time: Number(item.price_at_time) || 0
              })),
              subtotal: subtotal,
              delivery_fee: deliveryFee,
              delivery_zone: order.delivery_zone,
              total: total,
              seller_name: shopDetails.shop_name,
              seller_email: shopDetails.contact_email,
              seller_phone: shopDetails.contact_phone,
            });
            console.log('✅ Buyer email sent successfully to:', order.customer_email);
            
            if (shopDetails.contact_email) {
              console.log(`📤 Attempting to send seller email to: ${shopDetails.contact_email}`);
              try {
                await sendSellerOrderEmail({
                  to: shopDetails.contact_email,
                  customer_name: order.customer_name,
                  customer_email: order.customer_email,
                  customer_phone: order.customer_phone,
                  customer_address: order.customer_address || '',
                  order_number: order.order_number,
                  items: orderItems.map(item => ({
                    product_name: item.product_name,
                    variant_name: item.variant_name,
                    quantity: item.quantity,
                    price_at_time: Number(item.price_at_time) || 0
                  })),
                  subtotal: subtotal,
                  delivery_fee: deliveryFee,
                  delivery_zone: order.delivery_zone,
                  total: total,
                  special_instructions: order.special_instructions || '',
                  payment_method: 'mpesa',
                });
                console.log(`✅ Seller email sent successfully to: ${shopDetails.contact_email}`);
              } catch (sellerError) {
                console.error(`❌ Seller email FAILED for ${shopDetails.contact_email}:`, sellerError);
              }
            } else {
              console.warn(`⚠️ No contact_email found for shop: ${shopDetails.shop_name}`);
            }
            
            console.log(`📧 Confirmation emails processed for order ${order.order_number}`);
          } else {
            console.error(`❌ No shop details found for order ${orderId}`);
          }
        } catch (emailError) {
          console.error(`❌ Failed to send emails for order ${orderId}:`, emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isSuccess ? 'Payment confirmed' : (isRetryable ? 'Payment failed - retry allowed' : 'Payment failed'),
      orderId,
      status: transactionStatus,
      retryable: isRetryable,
      displayMessage: displayMessage,
      resultCode: resultCode,
      shouldRetry: isRetryable && !isSuccess
    });

  } catch (error) {
    console.error('❌ Update order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}