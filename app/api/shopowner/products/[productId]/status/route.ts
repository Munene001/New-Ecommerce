import { NextRequest, NextResponse } from 'next/server';
import { verifyShopAccess } from '@/lib/role/helper';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ProductRow extends RowDataPacket {
  shop_id: number;
  shop_type: string;
  product_name: string;
  product_slug: string;
  status: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId, 10);
    
    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get shop_id from product
    const [productRows] = await pool.query<ProductRow[]>(
      'SELECT shop_id, product_name, product_slug, status FROM products WHERE product_id = ?',
      [productIdNum]
    );

    if (!productRows || productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productRows[0];
    const shopId = product.shop_id;

    // Verify access using helper
    const { authorized, response } = await verifyShopAccess(req, shopId);
    if (!authorized) return response;

    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !['draft', 'published'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "draft" or "published"' 
      }, { status: 400 });
    }

    // Prevent changing from published to draft if status is already draft
    if (product.status === 'draft' && status === 'draft') {
      return NextResponse.json({ 
        error: 'Product is already in draft status' 
      }, { status: 400 });
    }

    if (product.status === 'published' && status === 'published') {
      return NextResponse.json({ 
        error: 'Product is already published' 
      }, { status: 400 });
    }

    // If publishing from draft, check if product has required fields
    if (status === 'published' && product.status === 'draft') {
      // Optional: Add validation here for required fields
      // For example, check if product has images, price, etc.
      // const [imageCount] = await pool.query(...);
      // if (imageCount === 0) { return error }
    }

    // Update product status
    const [updateResult] = await pool.query<ResultSetHeader>(
      'UPDATE products SET status = ? WHERE product_id = ?',
      [status, productIdNum]
    );

    if (updateResult.affectedRows === 0) {
      return NextResponse.json({ 
        error: 'Failed to update product status' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Product "${product.product_name}" ${status === 'published' ? 'published' : 'moved to draft'} successfully`,
      product_id: productIdNum,
      product_name: product.product_name,
      product_slug: product.product_slug,
      status: status,
      previous_status: product.status,
    });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update product status' 
    }, { status: 500 });
  }
}