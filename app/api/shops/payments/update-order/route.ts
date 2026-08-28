import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

const activeProcessingKeys = new Set<string>();

interface TransactionRow extends RowDataPacket {
  transaction_id: number;
  order_id: number;
  checkout_request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retryable: number;
}

interface OrderRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  shop_id: number;
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

function normalizeId(id: unknown): number | null {
  if (id === null || id === undefined) return null;
  const num = Number(id);
  return isNaN(num) ? null : num;
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

async function deductStockForOrderTx(conn: PoolConnection, orderId: number): Promise<boolean> {
  const [items] = await conn.query<OrderItemRow[]>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  if (items.length === 0) return false;

  for (const item of items) {
    const variantId = normalizeId(item.variant_id);
    const productId = normalizeId(item.product_id);
    const qty = Number(item.quantity) || 0;

    if (qty <= 0) continue;

    if (variantId !== null) {
      const [res] = await conn.query<ResultSetHeader>(
        `UPDATE product_variants 
         SET stock_quantity = stock_quantity - ?
         WHERE variant_id = ? AND stock_quantity >= ?`,
        [qty, variantId, qty]
      );
      if (res.affectedRows === 0) {
        throw new Error(`Insufficient stock for variant_id ${variantId}`);
      }
    } else if (productId !== null) {
      const [res] = await conn.query<ResultSetHeader>(
        `UPDATE products 
         SET stock_quantity = stock_quantity - ?
         WHERE product_id = ? AND stock_quantity >= ?`,
        [qty, productId, qty]
      );
      if (res.affectedRows === 0) {
        throw new Error(`Insufficient stock for product_id ${productId}`);
      }
    }
  }

  return true;
}

async function findTransactionWithRetry(
  checkoutRequestId: string,
  orderId?: number
): Promise<TransactionRow | null> {
  const maxRetries = 3;
  const backoffMs = 150;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const [rows] = await pool.query<TransactionRow[]>(
        `SELECT transaction_id, order_id, checkout_request_id, status, retryable 
         FROM stk_push_transactions 
         WHERE checkout_request_id = ?`,
        [checkoutRequestId]
      );

      if (rows.length > 0) return rows[0];

      if (orderId) {
        const [fallbackRows] = await pool.query<TransactionRow[]>(
          `SELECT transaction_id, order_id, checkout_request_id, status, retryable 
           FROM stk_push_transactions 
           WHERE order_id = ? AND status = 'pending' 
           ORDER BY transaction_id DESC LIMIT 1`,
          [orderId]
        );

        if (fallbackRows.length > 0) return fallbackRows[0];
      }
    } catch (dbErr) {
      console.error(`❌ [UPDATE] DB query error on retry ${i + 1}:`, dbErr);
    }

    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs * (i + 1)));
    }
  }

  return null;
}

// Background email dispatcher - Non-blocking
async function triggerOrderEmails(orderId: number, order: OrderRow) {
  try {
    const [[shopRows], [orderItems]] = await Promise.all([
      pool.query<ShopRow[]>(
        `SELECT s.shop_name, s.contact_email, s.contact_phone
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE o.order_id = ?`,
        [orderId]
      ),
      pool.query<OrderItemRow[]>(
        `SELECT product_name, variant_name, quantity, price_at_time FROM order_items WHERE order_id = ?`,
        [orderId]
      )
    ]);

    const shopDetails = shopRows[0];
    if (!shopDetails) return;

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

    await Promise.allSettled(emailPromises);
    
  } catch (err) {
    console.error(`❌ [UPDATE] Async email execution failed for order ${orderId}:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const EXPECTED_SECRET = process.env.SPRING_BOOT_INTERNAL_SECRET;

    if (!EXPECTED_SECRET || internalSecret !== EXPECTED_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized origin' }, { status: 401 });
    }

    const body = await req.json();
    const {
      checkoutRequestId,
      status: springStatus,
      resultCode,
      resultDesc,
      displayMessage,
      mpesaReceiptNumber,
      orderId: providedOrderId
    } = body;

    if (!checkoutRequestId) {
      return NextResponse.json({ success: false, error: 'checkoutRequestId is required' }, { status: 400 });
    }

    if (activeProcessingKeys.has(checkoutRequestId)) {
      return NextResponse.json({ success: true, message: 'Processing in progress' }, { status: 200 });
    }

    activeProcessingKeys.add(checkoutRequestId);

    try {
      const transaction = await findTransactionWithRetry(checkoutRequestId, providedOrderId);

      if (!transaction) {
        return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
      }

      if (transaction.status !== 'pending') {
        return NextResponse.json({
          success: true,
          message: 'Already processed',
          alreadyProcessed: true,
          status: transaction.status
        });
      }

      const orderId = transaction.order_id;
      const isSuccess = springStatus === 'COMPLETED' || resultCode === 0;
      const retryableCodes = [1032, 1, 2001, 1037, 8006];
      const isRetryable = retryableCodes.includes(resultCode);

      const dbTransactionStatus = isSuccess
        ? 'completed'
        : (resultCode === 1032 ? 'cancelled' : 'failed');

      const orderPaymentStatus = isSuccess ? 'paid' : 'pending';
      const orderOrderStatus = isSuccess ? 'processing' : 'pending';

      // Atomic Update Transaction Status
      const [updateResult] = await pool.query<ResultSetHeader>(
        `UPDATE stk_push_transactions 
         SET status = ?, result_code = ?, result_description = ?, retryable = ?, mpesa_receipt_number = ?, updated_at = NOW()
         WHERE transaction_id = ? AND status = 'pending'`,
        [dbTransactionStatus, resultCode, resultDesc, isRetryable ? 1 : 0, mpesaReceiptNumber || null, transaction.transaction_id]
      );

      if (updateResult.affectedRows === 0) {
        return NextResponse.json({ success: true, message: 'Already processed', alreadyProcessed: true });
      }

      // Update Order Status
      await pool.query(
        `UPDATE orders SET payment_status = ?, order_status = ?, updated_at = NOW() WHERE order_id = ?`,
        [orderPaymentStatus, orderOrderStatus, orderId]
      );

      if (isSuccess) {
        const [orderRows] = await pool.query<OrderRow[]>(
          `SELECT order_id, order_number, customer_email, customer_name, customer_phone, customer_address, customer_city, subtotal, delivery_fee, delivery_zone, total, special_instructions, stock_deducted
           FROM orders WHERE order_id = ?`,
          [orderId]
        );

        if (orderRows.length > 0) {
          const order = orderRows[0];
          const isStockAlreadyDeducted = Boolean(order.stock_deducted) && Number(order.stock_deducted) !== 0;

          if (!isStockAlreadyDeducted) {
            let conn;
            try {
              conn = await pool.getConnection();
              await conn.beginTransaction();

              const [markResult] = await conn.query<ResultSetHeader>(
                `UPDATE orders SET stock_deducted = TRUE WHERE order_id = ? AND stock_deducted = FALSE`,
                [orderId]
              );

              if (markResult.affectedRows === 1) {
                const deducted = await deductStockForOrderTx(conn, orderId);
                if (deducted) {
                  await conn.commit();
                } else {
                  await conn.rollback();
                }
              } else {
                await conn.rollback();
              }
            } catch (stockError) {
              if (conn) await conn.rollback();
              console.error(`❌ [UPDATE] Stock deduction error for order ${orderId}:`, stockError);
            } finally {
              if (conn) conn.release();
            }
          }

          // Trigger email background worker (non-blocking)
          triggerOrderEmails(orderId, order);
        }
      }

      return NextResponse.json({
        success: true,
        message: isSuccess ? 'Payment confirmed' : 'Payment failed',
        orderId,
        status: dbTransactionStatus,
        retryable: isRetryable,
        mpesaReceiptNumber: mpesaReceiptNumber || null,
        displayMessage
      });

    } finally {
      activeProcessingKeys.delete(checkoutRequestId);
    }

  } catch (error) {
    console.error('❌ [UPDATE] Critical update-order failure:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}