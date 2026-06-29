import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';

interface OrderItem {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  price: number;
  product_name: string;
  variant_name?: string | null;
}

interface OrderBody {
  shop_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city?: string | null;
  customer_address?: string | null;
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
  product_type: 'simple' | 'variable';
}

interface VariantRow extends RowDataPacket {
  variant_id: number;
  product_id: number;
  attributes: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
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

async function getInternalUserId(supabaseUserId: string): Promise<number | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT user_id FROM users WHERE supabase_uid = ?',
    [supabaseUserId]
  );
  return rows.length ? rows[0].user_id : null;
}

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

async function validateProducts(shopId: number, items: OrderItem[]): Promise<{ valid: boolean; products: ProductRow[]; variants: VariantRow[]; error?: string }> {
  const productIds = items.map(item => item.product_id);
  const variantIds = items.filter(item => item.variant_id).map(item => item.variant_id);
  
  const [products] = await pool.query<ProductRow[]>(
    `SELECT product_id, product_name, price, discount_price, shop_id, product_type
     FROM products 
     WHERE product_id IN (?) AND shop_id = ?`,
    [productIds, shopId]
  );
  
  if (products.length !== items.length) {
    return { valid: false, products: [], variants: [], error: 'One or more products not found' };
  }

  let variants: VariantRow[] = [];
  if (variantIds.length > 0) {
    const [variantRows] = await pool.query<VariantRow[]>(
      `SELECT variant_id, product_id, attributes, price, discount_price, stock_quantity
       FROM product_variants 
       WHERE variant_id IN (?)`,
      [variantIds]
    );
    variants = variantRows;
  }
  
  return { valid: true, products, variants };
}

async function getShopDetails(shopId: number): Promise<{ shop_name: string; contact_email: string; contact_phone: string } | null> {
  const [rows] = await pool.query<ShopRow[]>(
    'SELECT shop_id, shop_name, contact_email, contact_phone FROM shops WHERE shop_id = ?',
    [shopId]
  );
  return rows.length ? rows[0] : null;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  let customerId: number | null = null;
  
  if (!authError && user) {
    customerId = await getInternalUserId(user.id);
  }

  let body: OrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

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

  if (!shop_id || !customer_name || !customer_email || !customer_phone || !payment_method || subtotal === undefined || !items || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['mpesa', 'cash_on_delivery'].includes(payment_method)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  if (subtotal <= 0) {
    return NextResponse.json({ error: 'Subtotal must be greater than 0' }, { status: 400 });
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
    }
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const shopDetails = await getShopDetails(shop_id);
      if (!shopDetails) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }

      const productValidation = await validateProducts(shop_id, items);
      if (!productValidation.valid) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: productValidation.error }, { status: 400 });
      }

      const orderNumber = await generateOrderNumber(shop_id);

      const orderItemsWithDetails = items.map(item => {
        const product = productValidation.products.find(p => p.product_id === item.product_id);
        let variant: VariantRow | undefined;
        if (item.variant_id) {
          variant = productValidation.variants.find(v => v.variant_id === item.variant_id);
        }
        
        const priceAtTime = item.price || (variant?.discount_price || variant?.price || product?.discount_price || product?.price || 0);
        const productName = item.product_name || product?.product_name || '';
        const variantName = item.variant_name || (variant ? JSON.stringify(variant.attributes) : null);
        const variantAttributes = variant ? variant.attributes : null;
        
        return {
          ...item,
          product_name: productName,
          price_at_time: priceAtTime,
          variant_id: item.variant_id || null,
          variant_name: variantName,
          variant_attributes: variantAttributes
        };
      });

      const [orderResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, shop_id, customer_id, customer_name, customer_email, 
          customer_phone, customer_city, customer_address, special_instructions, 
          subtotal, payment_method, payment_status, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
        [
          orderNumber, shop_id, customerId, customer_name, customer_email,
          customer_phone, customer_city || null, customer_address || null, body.special_instructions || null,
          subtotal, payment_method
        ]
      );

      const orderId = orderResult.insertId;

      for (const item of orderItemsWithDetails) {
        await connection.query<ResultSetHeader>(
          `INSERT INTO order_items (
            order_id, product_id, product_name, quantity, price_at_time,
            variant_id, variant_name, variant_attributes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId, 
            item.product_id, 
            item.product_name, 
            item.quantity, 
            item.price_at_time,
            item.variant_id,
            item.variant_name,
            item.variant_attributes
          ]
        );
      }

      await connection.commit();
      connection.release();

      const emailData = {
        orderId,
        orderNumber,
        subtotal,
        customer_name,
        customer_email,
        customer_phone,
        customer_address: customer_address && customer_city ? `${customer_address}, ${customer_city}` : customer_address || customer_city || '',
        special_instructions: body.special_instructions,
        payment_method,
        items: orderItemsWithDetails.map(item => ({
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          price_at_time: item.price_at_time
        })),
        seller_name: shopDetails.shop_name,
        seller_email: shopDetails.contact_email,
        seller_phone: shopDetails.contact_phone
      };

      (async () => {
        try {
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
          
          if (shopDetails.contact_email) {
            await sendSellerOrderEmail({
              to: shopDetails.contact_email,
              customer_name: customer_name,
              customer_email: customer_email,
              customer_phone: customer_phone,
              customer_address: customer_address && customer_city ? `${customer_address}, ${customer_city}` : customer_address || customer_city || '',
              order_number: orderNumber,
              items: emailData.items,
              subtotal: subtotal,
              special_instructions: body.special_instructions,
              payment_method: payment_method,
            });
          }
          
          console.log('✅ Emails sent successfully for order:', orderNumber);
        } catch (emailError) {
          console.error('❌ Email sending failed for order:', orderNumber, emailError);
        }
      })();

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