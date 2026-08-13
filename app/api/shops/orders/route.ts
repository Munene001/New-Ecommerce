import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendBuyerOrderEmail, sendSellerOrderEmail } from '@/lib/email/ordermail';
import jwt from 'jsonwebtoken';

interface OrderItem {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  product_name?: string;
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
  delivery_tier_id?: number | null;
  delivery_zone?: string | null;
  items: OrderItem[];
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  price: number;
  discount_price: number | null;
  shop_id: number;
  product_type: 'simple' | 'variable';
  stock_quantity: number;
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

interface DeliveryTierRow extends RowDataPacket {
  fee: number;
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

function getEffectivePrice(row: ProductRow | VariantRow): number {
  if (row.discount_price !== null && row.discount_price !== undefined && row.discount_price > 0) {
    return Number(row.discount_price);
  }
  return Number(row.price);
}

function normalizeId(id: any): number | null {
  if (id === null || id === undefined) return null;
  const num = Number(id);
  return isNaN(num) ? null : num;
}

function findVariantSafe(
  variants: VariantRow[], 
  variantId: any
): VariantRow | undefined {
  const normalizedId = normalizeId(variantId);
  if (normalizedId === null) return undefined;
  return variants.find(v => Number(v.variant_id) === normalizedId);
}

function findProductSafe(
  products: ProductRow[], 
  productId: any
): ProductRow | undefined {
  const normalizedId = normalizeId(productId);
  if (normalizedId === null) return undefined;
  return products.find(p => Number(p.product_id) === normalizedId);
}

async function validateProductsAndStock(shopId: number, items: OrderItem[]): Promise<{ 
  valid: boolean; 
  products: ProductRow[]; 
  variants: VariantRow[]; 
  error?: string 
}> {
  const productIds = items.map(item => normalizeId(item.product_id)).filter(id => id !== null) as number[];
  const variantIds = items
    .filter(item => item.variant_id)
    .map(item => normalizeId(item.variant_id))
    .filter(id => id !== null) as number[];
  
  const uniqueProductIds = [...new Set(productIds)];
  const productPlaceholders = uniqueProductIds.map(() => '?').join(',');
  const [products] = await pool.query<ProductRow[]>(
    `SELECT product_id, product_name, price, discount_price, shop_id, product_type, stock_quantity
     FROM products 
     WHERE product_id IN (${productPlaceholders}) AND shop_id = ?`,
    [...uniqueProductIds, shopId]
  );
  
  if (products.length !== uniqueProductIds.length) {
    return { valid: false, products: [], variants: [], error: 'One or more products not found' };
  }

  let variants: VariantRow[] = [];
  if (variantIds.length > 0) {
    const uniqueVariantIds = [...new Set(variantIds)];
    const variantPlaceholders = uniqueVariantIds.map(() => '?').join(',');
    const [variantRows] = await pool.query<VariantRow[]>(
      `SELECT variant_id, product_id, attributes, price, discount_price, stock_quantity
       FROM product_variants 
       WHERE variant_id IN (${variantPlaceholders})`,
      uniqueVariantIds
    );
    variants = variantRows;
    
    if (variants.length !== uniqueVariantIds.length) {
      return { valid: false, products: [], variants: [], error: 'One or more variants not found' };
    }
  }

  for (const item of items) {
    const product = findProductSafe(products, item.product_id);
    const variant = item.variant_id ? findVariantSafe(variants, item.variant_id) : null;
    
    if (item.variant_id && !variant) {
      return { 
        valid: false, 
        products: [], 
        variants: [], 
        error: `Variant ${item.variant_id} not found for product ${product?.product_name || 'unknown'}` 
      };
    }
    
    const availableStock = variant ? variant.stock_quantity : product?.stock_quantity || 0;
    
    if (item.quantity > availableStock) {
      return { 
        valid: false, 
        products: [], 
        variants: [], 
        error: `Insufficient stock for ${product?.product_name || 'item'}. Available: ${availableStock}` 
      };
    }
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

async function getDeliveryFee(shopId: number, tierId: number | null): Promise<{ fee: number; valid: boolean }> {
  if (!tierId) {
    return { fee: 0, valid: true };
  }
  
  const [rows] = await pool.query<DeliveryTierRow[]>(
    'SELECT fee FROM delivery_tiers WHERE tier_id = ? AND shop_id = ?',
    [tierId, shopId]
  );
  
  if (rows.length === 0) {
    return { fee: 0, valid: false };
  }
  
  return { 
    fee: Number(rows[0].fee) || 0, 
    valid: true 
  };
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
    delivery_tier_id,
    delivery_zone,
    items 
  } = body;

  if (!shop_id || !customer_name || !customer_email || !customer_phone || !payment_method || !items || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['mpesa', 'cash_on_delivery'].includes(payment_method)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
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

      const productValidation = await validateProductsAndStock(shop_id, items);
      if (!productValidation.valid) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: productValidation.error }, { status: 400 });
      }

      const deliveryResult = await getDeliveryFee(shop_id, delivery_tier_id || null);
      if (!deliveryResult.valid) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ error: 'Invalid delivery tier' }, { status: 400 });
      }
      const deliveryFee = Number(deliveryResult.fee) || 0;

      let realSubtotal = 0;
      
      const orderItemsWithDetails = items.map(item => {
        const product = findProductSafe(productValidation.products, item.product_id);
        
        let variant: VariantRow | undefined;
        if (item.variant_id) {
          variant = findVariantSafe(productValidation.variants, item.variant_id);
        }
        
        if (item.variant_id && !variant) {
          console.error(
            `[ORDER API ERROR] Variant ${item.variant_id} not found! ` +
            `Available variants: ${productValidation.variants.map(v => v.variant_id).join(', ')}`
          );
          throw new Error(`Variant ${item.variant_id} not found. Please check your cart.`);
        }
        
        const realPrice = variant 
          ? getEffectivePrice(variant) 
          : (product ? getEffectivePrice(product) : 0);
        
        if (item.variant_id && realPrice === 0) {
          console.warn(
            `[ORDER API WARNING] Variant ${item.variant_id} has price 0. ` +
            `Variant price: ${variant?.price}, Discount: ${variant?.discount_price}`
          );
        }
        
        const productName = product?.product_name || '';
        const variantAttributes = variant?.attributes || null;
        const variantName = variantAttributes ? JSON.parse(variantAttributes) : null;
        
        realSubtotal += Number(realPrice) * Number(item.quantity);
        
        return {
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          product_name: productName,
          price_at_time: realPrice,
          variant_id: item.variant_id ? Number(item.variant_id) : null,
          variant_name: variantName ? JSON.stringify(variantName) : null,
          variant_attributes: variantAttributes
        };
      });

      const total = Number(realSubtotal) + Number(deliveryFee);
      const orderNumber = await generateOrderNumber(shop_id);

      const [orderResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO orders (
          order_number, shop_id, customer_id, customer_name, customer_email, 
          customer_phone, customer_city, customer_address, special_instructions, 
          subtotal, delivery_fee, delivery_zone, total, payment_method, payment_status, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
        [
          orderNumber, shop_id, customerId, customer_name, customer_email,
          customer_phone, customer_city || null, customer_address || null, body.special_instructions || null,
          realSubtotal, deliveryFee, delivery_zone || null, total, payment_method
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

      (`✅ Order ${orderNumber} created successfully with ${orderItemsWithDetails.length} items`);

      // ✉️ Send emails synchronously for Cash on Delivery orders
      if (payment_method === 'cash_on_delivery') {
        const formattedAddress = customer_address && customer_city 
          ? `${customer_address}, ${customer_city}` 
          : customer_address || customer_city || '';

        const emailItems = orderItemsWithDetails.map(item => ({
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          price_at_time: item.price_at_time
        }));

        try {
          const emailPromises: Promise<any>[] = [
            sendBuyerOrderEmail({
              to: customer_email,
              customer_name,
              order_number: orderNumber,
              items: emailItems,
              subtotal: realSubtotal,
              delivery_fee: deliveryFee,
              delivery_zone,
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
                customer_name,
                customer_email,
                customer_phone,
                customer_address: formattedAddress,
                order_number: orderNumber,
                items: emailItems,
                subtotal: realSubtotal,
                delivery_fee: deliveryFee,
                delivery_zone,
                total,
                special_instructions: body.special_instructions,
                payment_method,
              })
            );
          }

          const results = await Promise.allSettled(emailPromises);
          
          // Log individual failures if any occurred without failing the overall route
          results.forEach((res, index) => {
            if (res.status === 'rejected') {
              console.error(`❌ Email dispatch error [Index ${index}]:`, res.reason);
            }
          });

        } catch (emailError) {
          console.error('Email sending process encountered an unexpected failure:', emailError);
        }
      }

      const orderToken = jwt.sign(
        { orderId, orderNumber },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        success: true,
        data: {
          order_id: orderId,
          order_number: orderNumber,
          order_token: orderToken,
          total_amount: total,
          message: payment_method === 'cash_on_delivery' 
            ? 'Order placed successfully' 
            : 'Order created. Complete payment to confirm your order.'
        }
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      
      if (error instanceof Error) {
        console.error('Order creation error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}