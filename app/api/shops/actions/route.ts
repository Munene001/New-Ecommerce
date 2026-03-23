import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-utlis';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const auth = await validateToken(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabaseUser = auth.supabaseUser;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;

  switch (action) {
    case 'addReview':
      return handleAddReview(body, supabaseUser);
    case 'replyToReview':
      return handleReplyToReview(body, supabaseUser);
    case 'toggleWishlist':
      return handleToggleWishlist(body, supabaseUser);
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

async function getInternalUserId(supabaseUserId: string) {
  const [rows] = await pool.query(
    'SELECT user_id FROM users WHERE supabase_uid = ?',
    [supabaseUserId]
  );
  const rowsArray = rows as any[];
  return rowsArray.length ? rowsArray[0].user_id : null;
}

async function handleAddReview(body: any, supabaseUser: any) {
  const { productId, rating, comment, shopSlug, productSlug } = body;

  if (!productId || !rating || !comment || !shopSlug || !productSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const productIdNum = parseInt(productId, 10);
  const ratingNum = parseInt(rating, 10);
  if (ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  try {
    const userId = await getInternalUserId(supabaseUser.id);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const [existing] = await pool.query(
      `SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ? AND parent_review_id IS NULL`,
      [productIdNum, userId]
    );
    const existingRows = existing as any[];
    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment, is_owner_reply)
       VALUES (?, ?, ?, ?, false)`,
      [productIdNum, userId, ratingNum, comment]
    );

    revalidatePath(`/${shopSlug}/${productSlug}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Add review error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

async function handleReplyToReview(body: any, supabaseUser: any) {
  const { productId, parentReviewId, comment, shopSlug, productSlug } = body;

  if (!productId || !parentReviewId || !comment || !shopSlug || !productSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const productIdNum = parseInt(productId, 10);
  const parentIdNum = parseInt(parentReviewId, 10);

  try {
    const userId = await getInternalUserId(supabaseUser.id);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Verify shop owner permission
    const [ownerCheck] = await pool.query(
      `SELECT 1
       FROM products p
       JOIN shops s ON p.shop_id = s.shop_id
       JOIN tenant t ON s.tenant_id = t.tenant_id
       WHERE p.product_id = ? AND t.user_id = ?`,
      [productIdNum, userId]
    );
    const ownerRows = ownerCheck as any[];
    if (ownerRows.length === 0) {
      return NextResponse.json(
        { error: 'Only the shop owner can reply to reviews' },
        { status: 403 }
      );
    }

    // Prevent duplicate reply
    const [existingReply] = await pool.query(
      `SELECT 1 FROM reviews 
       WHERE product_id = ? AND user_id = ? AND parent_review_id = ?`,
      [productIdNum, userId, parentIdNum]
    );
    if ((existingReply as any[]).length > 0) {
      return NextResponse.json(
        { error: 'You have already replied to this review' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO reviews (product_id, user_id, parent_review_id, rating, comment, is_owner_reply)
       VALUES (?, ?, ?, NULL, ?, ?)`,
      [productIdNum, userId, parentIdNum, comment, true]
    );

    revalidatePath(`/${shopSlug}/${productSlug}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reply to review error:', error);
    // Fallback for unexpected duplicate constraint violations
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'You have already replied to this review' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

async function handleToggleWishlist(body: any, supabaseUser: any) {
  const { productId, shopSlug, productSlug } = body;

  if (!productId || !shopSlug || !productSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const productIdNum = parseInt(productId, 10);

  try {
    const userId = await getInternalUserId(supabaseUser.id);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const [existing] = await pool.query(
      `SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?`,
      [userId, productIdNum]
    );
    const existingRows = existing as any[];
    const exists = existingRows.length > 0;

    if (exists) {
      await pool.query(
        `DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`,
        [userId, productIdNum]
      );
    } else {
      await pool.query(
        `INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)`,
        [userId, productIdNum]
      );
    }

    revalidatePath(`/${shopSlug}/${productSlug}`);
    return NextResponse.json({ success: true, isInWishlist: !exists });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}