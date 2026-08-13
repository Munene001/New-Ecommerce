import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

function normalizeId(id: any): number | null {
  if (id === null || id === undefined) return null;
  const num = Number(id);
  return isNaN(num) ? null : num;
}

interface TransactionRow extends RowDataPacket {
  transaction_id: number;
  order_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
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
  stock_deducted: number | boolean;
}

interface OrderItemRow extends RowDataPacket {
  product_id: number | null;
  variant_id: number | null;
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

function parseVariantName(variantNameStr: string | null): string | null {
  if (!variantNameStr) return null;
  try {
    const parsed = JSON.parse(variantNameStr);
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    }
    return String(parsed);
  } catch {
    return variantNameStr;
  }
}

/**
 * Deducts stock atomically based on variant or base product IDs
 */
async function deductStockForOrder(orderId: number): Promise<{ success: boolean; deducted: boolean }> {
  (`📦 [UPDATE] Starting atomic stock deduction for order ${orderId}`);
  
  const [items] = await pool.query<OrderItemRow[]>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  if (items.length === 0) {
    console.warn(`⚠️ [UPDATE] No items found for order ${orderId} to deduct stock`);
    return { success: true, deducted: false };
  }

  let anyDeducted = false;

  for (const item of items) {
    const variantId = normalizeId(item.variant_id);
    const productId = normalizeId(item.product_id);
    const qty = Number(item.quantity) || 0;

    if (qty <= 0) continue;

    if (variantId !== null) {
      (`🔍 [UPDATE] Deducting variant_id ${variantId} by ${qty}`);
      const [res] = await pool.query<ResultSetHeader>(
        `UPDATE product_variants 
         SET stock_quantity = GREATEST(0, stock_quantity - ?)
         WHERE variant_id = ? AND stock_quantity > 0`,
        [qty, variantId]
      );
      if (res.affectedRows > 0) anyDeducted = true;
    } else if (productId !== null) {
      (`🔍 [UPDATE] Deducting product_id ${productId} by ${qty}`);
      const [res] = await pool.query<ResultSetHeader>(
        `UPDATE products 
         SET stock_quantity = GREATEST(0, stock_quantity - ?)
         WHERE product_id = ? AND stock_quantity > 0`,
        [qty, productId]
      );
      if (res.affectedRows > 0) anyDeducted = true;
    }
  }
  
  (`✅ [UPDATE] Stock deduction completed. Any deducted: ${anyDeducted}`);
  return { success: true, deducted: anyDeducted };
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
  ('🔵 [UPDATE] Payment callback received from Spring Boot');
  
  try {
    // STEP 1: Verify internal secret header
    const internalSecret = req.headers.get('x-internal-secret');
    const EXPECTED_SECRET = process.env.SPRING_BOOT_INTERNAL_SECRET;

    if (!EXPECTED_SECRET || internalSecret !== EXPECTED_SECRET) {
      console.warn('🚨 [UPDATE] Unauthorized callback attempt detected!');
      return NextResponse.json(
        { success: false, error: 'Unauthorized origin' },
        { status: 401 }
      );
    }
    ('✅ [UPDATE] Internal secret verified');

    // STEP 2: Parse payload
    const body = await req.json();
    const { 
      checkoutRequestId, 
      status: springStatus, 
      resultCode, 
      resultDesc, 
      displayMessage 
    } = body;



    if (!checkoutRequestId) {
      console.error('❌ [UPDATE] Missing checkoutRequestId');
      return NextResponse.json(
        { success: false, error: 'checkoutRequestId is required' },
        { status: 400 }
      );
    }

    // STEP 3: Lookup transaction
    const [transactions] = await pool.query<TransactionRow[]>(
      `SELECT transaction_id, order_id, status, retryable
       FROM stk_push_transactions 
       WHERE checkout_request_id = ?`,
      [checkoutRequestId]
    );

    if (transactions.length === 0) {
      console.error(`❌ [UPDATE] Transaction not found for: ${checkoutRequestId}`);
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const transaction = transactions[0];
    const orderId = transaction.order_id;
    (`✅ [UPDATE] Transaction ID=${transaction.transaction_id}, OrderID=${orderId}, DB Status=${transaction.status}`);

    // Idempotency check: Process only if status is 'pending'
    if (transaction.status !== 'pending') {
      (`ℹ️ [UPDATE] Transaction already in final state: ${transaction.status}`);
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        alreadyProcessed: true,
        status: transaction.status
      });
    }

    // STEP 4: Resolve database ENUM values strictly matching table schema
    const isSuccess = springStatus === 'COMPLETED' || resultCode === 0;
    const retryableCodes = [1032, 1, 2001, 1037, 8006];
    const isRetryable = retryableCodes.includes(resultCode);

    // Matches ENUM('pending','processing','completed','failed','cancelled')
    const dbTransactionStatus: 'completed' | 'failed' | 'cancelled' = isSuccess 
      ? 'completed' 
      : (resultCode === 1032 ? 'cancelled' : 'failed');

    const orderPaymentStatus = isSuccess ? 'paid' : 'pending';
    const orderOrderStatus = isSuccess ? 'processing' : 'pending';

    // STEP 5: Update transaction state
    (`💾 [UPDATE] Updating transaction ${transaction.transaction_id} to status=${dbTransactionStatus}`);
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
        dbTransactionStatus,
        resultCode,
        resultDesc,
        isRetryable ? 1 : 0,
        checkoutRequestId
      ]
    );

    if (updateResult.affectedRows === 0) {
      (`ℹ️ [UPDATE] Race condition avoided: Transaction already updated`);
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        alreadyProcessed: true
      });
    }

    // STEP 6: Update main order status
    (`💾 [UPDATE] Updating order ${orderId}...`);
    await pool.query(
      `UPDATE orders 
       SET payment_status = ?,
           order_status = ?,
           updated_at = NOW()
       WHERE order_id = ?`,
      [orderPaymentStatus, orderOrderStatus, orderId]
    );

    // STEP 7: Handle successful payment actions (Stock + Emails)
    if (isSuccess) {
      (`💰 [UPDATE] Processing post-payment steps for order ${orderId}`);
      
      const [orderRows] = await pool.query<OrderRow[]>(
        `SELECT order_id, order_number, customer_email, customer_name, 
                customer_phone, customer_address, customer_city,
                subtotal, delivery_fee, delivery_zone, total, special_instructions, stock_deducted
         FROM orders 
         WHERE order_id = ?`,
        [orderId]
      );

      if (orderRows.length > 0) {
        const order = orderRows[0];
        const isStockAlreadyDeducted = Boolean(order.stock_deducted) && Number(order.stock_deducted) !== 0;

        // Atomic stock deduction logic
        if (!isStockAlreadyDeducted) {
          try {
            const stockResult = await deductStockForOrder(orderId);
            if (stockResult.deducted) {
              await pool.query(
                `UPDATE orders SET stock_deducted = TRUE WHERE order_id = ?`,
                [orderId]
              );
              (`✅ [UPDATE] Stock deducted and flag set for order ${orderId}`);
            }
          } catch (stockError) {
            console.error(`❌ [UPDATE] Stock deduction error for order ${orderId}:`, stockError);
          }
        }

        // Send Email Notifications asynchronously
        try {
          const shopDetails = await getShopDetailsForOrder(orderId);
          const [orderItems] = await pool.query<OrderItemRow[]>(
            `SELECT product_name, variant_name, quantity, price_at_time
             FROM order_items 
             WHERE order_id = ?`,
            [orderId]
          );

          if (shopDetails) {
            const subtotal = Number(order.subtotal) || 0;
            const deliveryFee = Number(order.delivery_fee) || 0;
            const total = Number(order.total) || subtotal + deliveryFee;

            const formattedItems = orderItems.map(item => ({
              product_name: item.product_name,
              variant_name: parseVariantName(item.variant_name),
              quantity: item.quantity,
              price_at_time: Number(item.price_at_time) || 0
            }));

            const formattedAddress = order.customer_address && order.customer_city
              ? `${order.customer_address}, ${order.customer_city}`
              : order.customer_address || order.customer_city || '';

            const emailPromises: Promise<any>[] = [
              sendBuyerOrderEmail({
                to: order.customer_email,
                customer_name: order.customer_name,
                order_number: order.order_number,
                items: formattedItems,
                subtotal,
                delivery_fee: deliveryFee,
                delivery_zone: order.delivery_zone,
                total,
                seller_name: shopDetails.shop_name,
                seller_email: shopDetails.contact_email,
                seller_phone: shopDetails.contact_phone,
              })
            ];

            if (shopDetails.contact_email) {
              emailPromises.push(
                sendSellerOrderEmail({
                  to: shopDetails.contact_email,
                  customer_name: order.customer_name,
                  customer_email: order.customer_email,
                  customer_phone: order.customer_phone,
                  customer_address: formattedAddress,
                  order_number: order.order_number,
                  items: formattedItems,
                  subtotal,
                  delivery_fee: deliveryFee,
                  delivery_zone: order.delivery_zone,
                  total,
                  special_instructions: order.special_instructions || '',
                  payment_method: 'mpesa',
                })
              );
            }

            (`📧 [UPDATE] Dispatching buyer/seller emails...`);
            const results = await Promise.allSettled(emailPromises);
            results.forEach((res, i) => {
              if (res.status === 'rejected') console.error(`❌ [UPDATE] Email ${i} failed:`, res.reason);
              else (`✅ [UPDATE] Email ${i} sent`);
            });
          }
        } catch (emailErr) {
          console.error(`❌ [UPDATE] Email orchestration failed:`, emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isSuccess ? 'Payment confirmed' : 'Payment failed',
      orderId,
      status: dbTransactionStatus,
      retryable: isRetryable,
      displayMessage
    });

  } catch (error) {
    console.error('❌ [UPDATE] Critical update-order failure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}