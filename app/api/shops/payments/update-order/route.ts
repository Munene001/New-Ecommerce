// app/api/shops/payments/update-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

// --- TYPES ---

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

// --- HELPER FUNCTIONS ---

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

function extractTillNumber(body: Record<string, any>): string | null {
  if (body.tillNumber) return body.tillNumber;

  const rawCallback = body.rawCallback;
  if (rawCallback) {
    if (rawCallback.data?.attributes?.till_number) {
      return rawCallback.data.attributes.till_number;
    }
    if (rawCallback.event?.resource?.till_number) {
      return rawCallback.event.resource.till_number;
    }
  }

  return null;
}

async function getKopokopoTillByShopId(shopId: number): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT k.till_number 
     FROM shop_kopokopo k
     JOIN shop_payment_settings ps ON k.payment_setting_id = ps.payment_setting_id
     WHERE ps.shop_id = ?`,
    [shopId]
  );
  return rows.length > 0 ? rows[0].till_number : null;
}

async function deductStockForOrderTx(conn: PoolConnection, orderId: number): Promise<boolean> {
  console.log(`📦 [UPDATE] Starting atomic stock deduction transaction for order ${orderId}`);

  const [items] = await conn.query<OrderItemRow[]>(
    `SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?`,
    [orderId]
  );

  if (items.length === 0) {
    console.warn(`⚠️ [UPDATE] No items found for order ${orderId} to deduct stock`);
    return false;
  }

  for (const item of items) {
    const variantId = normalizeId(item.variant_id);
    const productId = normalizeId(item.product_id);
    const qty = Number(item.quantity) || 0;

    if (qty <= 0) continue;

    if (variantId !== null) {
      console.log(`🔍 [UPDATE] Deducting variant_id ${variantId} by ${qty}`);
      const [res] = await conn.query<ResultSetHeader>(
        `UPDATE product_variants 
         SET stock_quantity = stock_quantity - ?
         WHERE variant_id = ? AND stock_quantity >= ?`,
        [qty, variantId, qty]
      );
      if (res.affectedRows === 0) {
        throw new Error(`Insufficient stock for variant_id ${variantId}. Requested: ${qty}, Available: less than ${qty}`);
      }
    } else if (productId !== null) {
      console.log(`🔍 [UPDATE] Deducting product_id ${productId} by ${qty}`);
      const [res] = await conn.query<ResultSetHeader>(
        `UPDATE products 
         SET stock_quantity = stock_quantity - ?
         WHERE product_id = ? AND stock_quantity >= ?`,
        [qty, productId, qty]
      );
      if (res.affectedRows === 0) {
        throw new Error(`Insufficient stock for product_id ${productId}. Requested: ${qty}, Available: less than ${qty}`);
      }
    }
  }

  return true;
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

// --- TRANSACTION LOOKUP WITH RETRY ---

async function findTransactionWithRetry(
  checkoutRequestId: string,
  orderId?: number
): Promise<TransactionRow | null> {
  const maxRetries = 3;
  const backoffMs = 150;

  for (let i = 0; i < maxRetries; i++) {
    // Primary Lookup by checkout_request_id
    const [rows] = await pool.query<TransactionRow[]>(
      `SELECT transaction_id, order_id, checkout_request_id, status, retryable 
       FROM stk_push_transactions 
       WHERE checkout_request_id = ?`,
      [checkoutRequestId]
    );

    if (rows.length > 0) {
      console.log(`✅ [UPDATE] Transaction found by checkoutRequestId: ${checkoutRequestId}`);
      return rows[0];
    }

    // Fallback Lookup by order_id if passed
    if (orderId) {
      const [fallbackRows] = await pool.query<TransactionRow[]>(
        `SELECT transaction_id, order_id, checkout_request_id, status, retryable 
         FROM stk_push_transactions 
         WHERE order_id = ? AND status = 'pending' 
         ORDER BY transaction_id DESC LIMIT 1`,
        [orderId]
      );

      if (fallbackRows.length > 0) {
        console.log(`✅ [UPDATE] Resolved race condition via order_id fallback: ${orderId}`);
        return fallbackRows[0];
      }
    }

    if (i < maxRetries - 1) {
      console.log(`⏳ [UPDATE] Transaction not found, retry ${i + 1}/${maxRetries}...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs * (i + 1)));
    }
  }

  return null;
}

// --- MAIN ROUTE HANDLER ---

export async function POST(req: NextRequest) {
  console.log('🔵 [UPDATE] Payment callback received from Spring Boot');

  try {
    // 1. Verify internal secret header
    const internalSecret = req.headers.get('x-internal-secret');
    const EXPECTED_SECRET = process.env.SPRING_BOOT_INTERNAL_SECRET;

    if (!EXPECTED_SECRET || internalSecret !== EXPECTED_SECRET) {
      console.warn('🚨 [UPDATE] Unauthorized callback attempt detected!');
      return NextResponse.json(
        { success: false, error: 'Unauthorized origin' },
        { status: 401 }
      );
    }
    console.log('✅ [UPDATE] Internal secret verified');

    // 2. Parse payload
    const body = await req.json();
    const {
      checkoutRequestId,
      status: springStatus,
      resultCode,
      resultDesc,
      displayMessage,
      mpesaReceiptNumber,
      isKopokopo,
      tillNumber: providedTillNumber,
      orderId: providedOrderId
    } = body;

    if (!checkoutRequestId) {
      console.error('❌ [UPDATE] Missing checkoutRequestId');
      return NextResponse.json(
        { success: false, error: 'checkoutRequestId is required' },
        { status: 400 }
      );
    }

    // 3. Query transaction with retry + orderId fallback
    const transaction = await findTransactionWithRetry(checkoutRequestId, providedOrderId);

    if (!transaction) {
      console.error(`❌ [UPDATE] Transaction not found after retries for: ${checkoutRequestId}`);
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const orderId = transaction.order_id;

    // 4. Patch checkout_request_id if matched via fallback
    if (transaction.checkout_request_id !== checkoutRequestId) {
      console.log(`🔄 [UPDATE] Updating transaction with checkoutRequestId: ${checkoutRequestId}`);
      await pool.query(
        `UPDATE stk_push_transactions 
         SET checkout_request_id = ? 
         WHERE transaction_id = ?`,
        [checkoutRequestId, transaction.transaction_id]
      );
    }

    // 5. Handle Kopokopo callbacks
    if (isKopokopo) {
      console.log('🔐 [UPDATE] Processing Kopo Kopo callback');

      let tillNumber = providedTillNumber || extractTillNumber(body);
      
      if (!tillNumber) {
        console.log('🔍 [UPDATE] tillNumber missing from callback, looking up from DB...');
        
        const [orderRows] = await pool.query<OrderRow[]>(
          `SELECT shop_id FROM orders WHERE order_id = ?`,
          [orderId]
        );
        
        if (orderRows.length > 0) {
          const shopId = orderRows[0].shop_id;
          tillNumber = await getKopokopoTillByShopId(shopId);
          if (tillNumber) {
            console.log(`✅ [UPDATE] tillNumber found in DB: ${tillNumber}`);
          }
        }
      }
      
      if (!tillNumber) {
        console.warn('⚠️ [UPDATE] Could not resolve tillNumber, but continuing with order update');
      } else {
        console.log(`✅ [UPDATE] Processing for till: ${tillNumber}`);
      }
    }

    // 6. Idempotency Check
    if (transaction.status !== 'pending') {
      console.log(`ℹ️ [UPDATE] Transaction already in final state: ${transaction.status}`);
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        alreadyProcessed: true,
        status: transaction.status
      });
    }

    // 7. Map Status & Enums
    const isSuccess = springStatus === 'COMPLETED' || resultCode === 0;
    const retryableCodes = [1032, 1, 2001, 1037, 8006];
    const isRetryable = retryableCodes.includes(resultCode);

    const dbTransactionStatus: 'completed' | 'failed' | 'cancelled' = isSuccess
      ? 'completed'
      : (resultCode === 1032 ? 'cancelled' : 'failed');

    const orderPaymentStatus = isSuccess ? 'paid' : 'pending';
    const orderOrderStatus = isSuccess ? 'processing' : 'pending';

    // 8. Atomic Transaction State Update (including mpesa_receipt_number)
    console.log(`💾 [UPDATE] Updating transaction ${transaction.transaction_id} to status=${dbTransactionStatus}, receipt=${mpesaReceiptNumber || 'NULL'}`);
    const [updateResult] = await pool.query<ResultSetHeader>(
      `UPDATE stk_push_transactions 
       SET status = ?,
           result_code = ?,
           result_description = ?,
           retryable = ?,
           mpesa_receipt_number = ?,
           updated_at = NOW()
       WHERE transaction_id = ? AND status = 'pending'`,
      [
        dbTransactionStatus,
        resultCode,
        resultDesc,
        isRetryable ? 1 : 0,
        mpesaReceiptNumber || null,
        transaction.transaction_id
      ]
    );

    if (updateResult.affectedRows === 0) {
      console.log(`ℹ️ [UPDATE] Race condition avoided: Transaction already updated`);
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        alreadyProcessed: true
      });
    }

    // 9. Update Order Status
    console.log(`💾 [UPDATE] Updating order ${orderId}...`);
    await pool.query(
      `UPDATE orders 
       SET payment_status = ?,
           order_status = ?,
           updated_at = NOW()
       WHERE order_id = ?`,
      [orderPaymentStatus, orderOrderStatus, orderId]
    );

    // 10. Post-Payment Processing
    if (isSuccess) {
      console.log(`💰 [UPDATE] Processing post-payment steps for order ${orderId}`);
      
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

        if (!isStockAlreadyDeducted) {
          const conn = await pool.getConnection();
          try {
            await conn.beginTransaction();

            const [markResult] = await conn.query<ResultSetHeader>(
              `UPDATE orders SET stock_deducted = TRUE WHERE order_id = ? AND stock_deducted = FALSE`,
              [orderId]
            );

            if (markResult.affectedRows === 1) {
              const deducted = await deductStockForOrderTx(conn, orderId);
              if (deducted) {
                await conn.commit();
                console.log(`✅ [UPDATE] Stock transaction committed for order ${orderId}`);
              } else {
                await conn.rollback();
                console.log(`⚠️ [UPDATE] No stock items deducted; transaction rolled back.`);
              }
            } else {
              await conn.rollback();
            }
          } catch (stockError) {
            await conn.rollback();
            console.error(`❌ [UPDATE] Transactional stock deduction error for order ${orderId}:`, stockError);
          } finally {
            conn.release();
          }
        }

        // Email Orchestration
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

            const results = await Promise.allSettled(emailPromises);
            results.forEach((res, i) => {
              if (res.status === 'rejected') console.error(`❌ [UPDATE] Email ${i} failed:`, res.reason);
              else console.log(`✅ [UPDATE] Email ${i} sent`);
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
      mpesaReceiptNumber: mpesaReceiptNumber || null,
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