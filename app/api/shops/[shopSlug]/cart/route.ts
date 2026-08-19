
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

interface SimpleProductRow extends RowDataPacket {
  product_id: number;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  status: string;
}

interface VariantRow extends RowDataPacket {
  variant_id: number;
  product_id: number;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  status: string;
}

interface CartItemPayload {
  product_id: number;
  variant_id?: number | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;

  try {
    const body = await req.json();
    const items: CartItemPayload[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ products: [], variants: [] });
    }

    // 1. Resolve Shop
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );

    if (shopRows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopId = shopRows[0].shop_id;

    // 2. Separate Simple Product IDs and Variant IDs
    const simpleProductIds = Array.from(
      new Set(
        items
          .filter((i) => !i.variant_id)
          .map((i) => Number(i.product_id))
          .filter(Boolean)
      )
    );

    const variantIds = Array.from(
      new Set(
        items
          .filter((i) => i.variant_id)
          .map((i) => Number(i.variant_id))
          .filter(Boolean)
      )
    );

    let simpleProducts: SimpleProductRow[] = [];
    let variants: VariantRow[] = [];

    // 3. Batch query simple products
    if (simpleProductIds.length > 0) {
      const placeholders = simpleProductIds.map(() => '?').join(',');
      const [pRows] = await pool.query<SimpleProductRow[]>(
        `SELECT 
          product_id, 
          price, 
          discount_price, 
          stock_quantity, 
          status 
         FROM products 
         WHERE shop_id = ? AND product_id IN (${placeholders})`,
        [shopId, ...simpleProductIds]
      );
      simpleProducts = pRows;
    }

    // 4. Batch query variant items
    if (variantIds.length > 0) {
      const placeholders = variantIds.map(() => '?').join(',');
      const [vRows] = await pool.query<VariantRow[]>(
        `SELECT 
          pv.variant_id, 
          pv.product_id, 
          pv.price, 
          pv.discount_price, 
          pv.stock_quantity, 
          p.status 
         FROM product_variants pv
         JOIN products p ON pv.product_id = p.product_id
         WHERE p.shop_id = ? AND pv.variant_id IN (${placeholders})`,
        [shopId, ...variantIds]
      );
      variants = vRows;
    }

    return NextResponse.json({
      products: simpleProducts.map((p) => ({
        product_id: p.product_id,
        price: Number(p.price),
        discount_price: p.discount_price !== null ? Number(p.discount_price) : null,
        stock_quantity: p.stock_quantity,
        in_stock: p.stock_quantity > 0 && p.status === 'published',
        is_published: p.status === 'published',
      })),
      variants: variants.map((v) => ({
        variant_id: v.variant_id,
        product_id: v.product_id,
        price: Number(v.price),
        discount_price: v.discount_price !== null ? Number(v.discount_price) : null,
        stock_quantity: v.stock_quantity,
        in_stock: v.stock_quantity > 0 && v.status === 'published',
        is_published: v.status === 'published',
      })),
    });
  } catch (error) {
    console.error('Cart verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify cart items' },
      { status: 500 }
    );
  }
}