import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

// Interfaces
interface OrderItem {
  product_id: number;
  quantity: number;
}

interface OrderBody {
  shop_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string;
  special_instructions?: string;
  payment_method: 'mpesa' | 'cash_on_delivery';
  subtotal: number;
  items: OrderItem[];
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  price: number;
  discount_price: number | null;
  shop_id: number;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
  shop_name: string;
  contact_email: string;
  contact_phone: string;
}

interface UserRow extends RowDataPacket {
  user_id: number;
}

// Helper to get internal user ID from supabase UID
async function getInternalUserId(supabaseUserId: string): Promise<number | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT user_id FROM users WHERE supabase_uid = ?',
    [supabaseUserId]
  );
  return rows.length ? rows[0].user_id : null;
}

// Helper to generate unique order number
async function generateOrderNumber(shopId: number): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM orders 
     WHERE shop_id = ? AND DATE(created_at) = CURDATE()`,
    [shopId]
  );
  
  const count = (rows[0]?.count || 0) + 1;
  const sequence = String(count).padStart(3, '0');
  
  return `ORD-${shopId}-${dateStr}-${sequence}`;
}

// Helper to validate products
async function validateProducts(shopId: number, items: OrderItem[]): Promise<{ valid: boolean; products: ProductRow[]; error?: string }> {
  const productIds = items.map(item => item.product_id);
  
  const [products] = await pool.query<ProductRow[]>(
    `SELECT product_id, product_name, price, discount_price, shop_id 
     FROM products 
     WHERE product_id IN (?) AND shop_id = ?`,
    [productIds, shopId]
  );
  
  if (products.length !== items.length) {
    return { valid: false, products: [], error: 'One or more products not found' };
  }
  
  return { valid: true, products };
}

// Helper to get shop details including contact_email
async function getShopDetails(shopId: number): Promise<{ shop_name: string; contact_email: string; contact_phone: string } | null> {
  const [rows] = await pool.query<ShopRow[]>(
    'SELECT shop_id, shop_name, contact_email, contact_phone FROM shops WHERE shop_id = ?',
    [shopId]
  );
  return rows.length ? rows[0] : null;
}

export async function POST(request: NextRequest) {
  // Get authenticated user from session cookie (optional - guest checkout allowed)
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  let customerId: number | null = null;
  
  // If user is logged in, get their internal user_id
  if (!authError && user) {
    customerId = await getInternalUserId(user.id);
  }

  let body: OrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate required fields
  const { 
    shop_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    customer_city, 
    customer_address, 
    payment_method, 
    subtotal, 
    items 
  } = body;

  if (!shop_id || !customer_name || !customer_email || !customer_phone || !customer_city || !customer_address || !payment_method || subtotal === undefined || !items || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate payment method
  if (!['mpesa', 'cash_on_delivery'].includes(payment_method)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  // Validate subtotal is positive
  if (subtotal <= 0) {
    return NextResponse.json({ error: 'Subtotal must be greater than 0' }, { status: 400 });
  }

  // Validate each item has quantity > 0
  for (const item of items) {
    if (item.quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }
  }

  try {
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Validate shop exists and get shop details
      const shopDetails = await getShopDetails(shop_id);
      if (!shopDetails) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }

      // Validate products
      const productValidation = await validateProducts(shop_id, items);
      if (!productValidation.valid) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: productValidation.error }, { status: 400 });
      }

      // Generate order number
      const orderNumber = await generateOrderNumber(shop_id);

      // Prepare order items with prices
      const orderItemsWithPrice = items.map(item => {
        const product = productValidation.products.find(p => p.product_id === item.product_id);
        const priceAtTime = product?.discount_price && product.discount_price > 0 
          ? product.discount_price 
          : product?.price || 0;
        return {
          ...item,
          product_id: item.product_id,
          product_name: product?.product_name || '',
          price_at_time: priceAtTime
        };
      });

      // Insert order
      const [orderResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, shop_id, customer_id, customer_name, customer_email, 
          customer_phone, customer_city, customer_address, special_instructions, 
          subtotal, payment_method, payment_status, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
        [
          orderNumber, shop_id, customerId, customer_name, customer_email,
          customer_phone, customer_city, customer_address, body.special_instructions || null,
          subtotal, payment_method
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items
      for (const item of orderItemsWithPrice) {
        await connection.query<ResultSetHeader>(
          `INSERT INTO order_items (
            order_id, product_id, product_name, quantity, price_at_time
          ) VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.product_name, item.quantity, item.price_at_time]
        );
      }

      // Commit transaction
      await connection.commit();
      connection.release();

      // Prepare email data
      const emailData = {
        orderId,
        orderNumber,
        subtotal,
        customer_name,
        customer_email,
        customer_phone,
        customer_address: `${customer_address}, ${customer_city}`,
        special_instructions: body.special_instructions,
        payment_method,
        items: orderItemsWithPrice.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price_at_time: item.price_at_time
        })),
        seller_name: shopDetails.shop_name,
        seller_email: shopDetails.contact_email,
        seller_phone: shopDetails.contact_phone
      };

      // Send emails asynchronously (non-blocking)
      // Don't await - let it run in background
      (async () => {
        try {
          // Send email to buyer
          await sendBuyerOrderEmail({
            to: customer_email,
            customer_name: customer_name,
            order_number: orderNumber,
            items: emailData.items,
            subtotal: subtotal,
            seller_name: shopDetails.shop_name,
            seller_email: shopDetails.contact_email,
            seller_phone: shopDetails.contact_phone,
          });
          
          // Send email to seller (if contact_email exists)
          if (shopDetails.contact_email) {
            await sendSellerOrderEmail({
              to: shopDetails.contact_email,
              customer_name: customer_name,
              customer_email: customer_email,
              customer_phone: customer_phone,
              customer_address: `${customer_address}, ${customer_city}`,
              order_number: orderNumber,
              items: emailData.items,
              subtotal: subtotal,
              special_instructions: body.special_instructions,
              payment_method: payment_method,
            });
          }
          
          console.log('✅ Emails sent successfully for order:', orderNumber);
        } catch (emailError) {
          // Email fails - only log error, order is already successful
          console.error('❌ Email sending failed for order:', orderNumber, emailError);
        }
      })();

      // Return success response immediately (don't wait for emails)
      return NextResponse.json({
        success: true,
        data: {
          order_id: orderId,
          order_number: orderNumber,
          total_amount: subtotal,
          message: payment_method === 'cash_on_delivery' 
            ? 'Order placed successfully' 
            : 'Order created. Complete payment to confirm your order.'
        }
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}