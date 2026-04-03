import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ReviewBody {
  productId: string;
  rating: string;
  comment: string;
  shopSlug: string;
  productSlug: string;
}

interface ReplyBody {
  productId: string;
  parentReviewId: string;
  comment: string;
  shopSlug: string;
  productSlug: string;
}

interface WishlistBody {
  productId: string;
  shopSlug: string;
  productSlug: string;
}

interface UserRow extends RowDataPacket {
  user_id: number;
}

interface ExistingRow extends RowDataPacket {
  1: number;
}

export async function POST(request: NextRequest) {
  // Get authenticated user from session cookie
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;

  switch (action) {
    case 'addReview':
      return handleAddReview(body, user);
    case 'replyToReview':
      return handleReplyToReview(body, user);
    case 'toggleWishlist':
      return handleToggleWishlist(body, user);
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

async function getInternalUserId(supabaseUserId: string): Promise<number | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT user_id FROM users WHERE supabase_uid = ?',
    [supabaseUserId]
  );
  return rows.length ? rows[0].user_id : null;
}

async function handleAddReview(body: ReviewBody, supabaseUser: { id: string }) {
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

    const [existing] = await pool.query<ExistingRow[]>(
      `SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ? AND parent_review_id IS NULL`,
      [productIdNum, userId]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO reviews (product_id, user_id, rating, comment, is_owner_reply)
       VALUES (?, ?, ?, ?, false)`,
      [productIdNum, userId, ratingNum, comment]
    );

    revalidatePath(`/${shopSlug}/${productSlug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add review error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

async function handleReplyToReview(body: ReplyBody, supabaseUser: { id: string }) {
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
    const [ownerCheck] = await pool.query<ExistingRow[]>(
      `SELECT 1
       FROM products p
       JOIN shops s ON p.shop_id = s.shop_id
       JOIN tenant t ON s.tenant_id = t.tenant_id
       WHERE p.product_id = ? AND t.user_id = ?`,
      [productIdNum, userId]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json(
        { error: 'Only the shop owner can reply to reviews' },
        { status: 403 }
      );
    }

    // Prevent duplicate reply
    const [existingReply] = await pool.query<ExistingRow[]>(
      `SELECT 1 FROM reviews 
       WHERE product_id = ? AND user_id = ? AND parent_review_id = ?`,
      [productIdNum, userId, parentIdNum]
    );
    if (existingReply.length > 0) {
      return NextResponse.json(
        { error: 'You have already replied to this review' },
        { status: 400 }
      );
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO reviews (product_id, user_id, parent_review_id, rating, comment, is_owner_reply)
       VALUES (?, ?, ?, NULL, ?, ?)`,
      [productIdNum, userId, parentIdNum, comment, true]
    );

    revalidatePath(`/${shopSlug}/${productSlug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reply to review error:', error);
    const mysqlError = error as { code?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'You have already replied to this review' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

async function handleToggleWishlist(body: WishlistBody, supabaseUser: { id: string }) {
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

    const [existing] = await pool.query<ExistingRow[]>(
      `SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = ?`,
      [userId, productIdNum]
    );
    const exists = existing.length > 0;

    if (exists) {
      await pool.query<ResultSetHeader>(
        `DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`,
        [userId, productIdNum]
      );
    } else {
      await pool.query<ResultSetHeader>(
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