import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendWelcomeEmail } from '@/lib/email/onBoard';
import { User } from '@supabase/supabase-js';

interface VerifyBody {
  email: string;
  code?: string;
  business_name?: string;
  phone?: string;
  resend?: boolean;
  userType?: 'shop_owner' | 'customer';
  redirect?: string;
}

interface MinimalUser {
  id: string;
  email: string;
  aud: string;
  role: string;
  user_metadata: {
    full_name: string;
    avatar_url: string;
  };
}

async function handleUserCreation(
  user: MinimalUser | User,
  body: VerifyBody,
  userType: 'shop_owner' | 'customer'
) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (userType === 'shop_owner') {
      const [existingBusiness] = await conn.query<RowDataPacket[]>(
        `SELECT business_name FROM tenant WHERE LOWER(business_name) = LOWER(?)`,
        [body.business_name]
      );
      if (existingBusiness.length > 0) {
        await conn.rollback();
        return {
          success: false,
          error: 'This business name is already taken. Please choose another.',
          status: 400,
        };
      }

      let fullName = body.email.split('@')[0];
      fullName = fullName.replace(/\./g, ' ');
      fullName = fullName.replace(/\b\w/g, (c) => c.toUpperCase());
      const phone = '+254712345678';

      const [userResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO users (supabase_uid, full_name, email, phone, role) VALUES (?, ?, ?, ?, 'shop_owner')`,
        [user.id, fullName, body.email, phone]
      );
      const userId = userResult.insertId;

      let slug = body.business_name!
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const [existingSlugs] = await conn.query<RowDataPacket[]>(
        `SELECT business_slug FROM tenant WHERE business_slug = ? OR business_slug LIKE ?`,
        [slug, `${slug}-%`]
      );

      if (existingSlugs.length > 0) {
        let maxNumber = 0;
        existingSlugs.forEach((row: any) => {
          const match = row.business_slug.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        });
        slug = `${slug}-${maxNumber + 1}`;
      }

      const businessTown = 'Not set';
      const businessAddress = 'Not set';

      let affiliateIdFromCookie: number | null = null;
      try {
        const cookieStore = await cookies();
        const cookieValue = cookieStore.get('affiliate_id')?.value;
        if (cookieValue) affiliateIdFromCookie = parseInt(cookieValue, 10);
      } catch {
        // ignore cookie read errors
      }

      const [tenantResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) VALUES (?, ?, ?, ?, ?)`,
        [userId, body.business_name, slug, businessTown, businessAddress]
      );
      const tenantId = tenantResult.insertId;

      if (affiliateIdFromCookie) {
        await conn.execute(
          `UPDATE tenant SET affiliate_id = ? WHERE tenant_id = ?`,
          [affiliateIdFromCookie, tenantId]
        );
        await conn.execute(
          `UPDATE affiliate SET conversion_count = conversion_count + 1 WHERE affiliate_id = ?`,
          [affiliateIdFromCookie]
        );
      }

      await conn.commit();

      try {
        await sendWelcomeEmail({
          email: body.email,
          businessName: body.business_name!,
          fullName: fullName,
          businessSlug: slug,
        });
      } catch (emailErr) {
        console.error('Welcome email error:', emailErr);
      }

      return {
        success: true,
        message: 'Account created successfully!',
        userId: userId,
        business_slug: slug,
      };
    } else {
      let fullName = body.email.split('@')[0];
      fullName = fullName.replace(/\./g, ' ');
      fullName = fullName.replace(/\b\w/g, (c) => c.toUpperCase());
      const phone = body.phone || '+254712345678';

      await conn.execute<ResultSetHeader>(
        `INSERT INTO users (supabase_uid, full_name, email, phone, role) VALUES (?, ?, ?, ?, 'customer')`,
        [user.id, fullName, body.email, phone]
      );

      await conn.commit();
      return {
        success: true,
        message: 'Account created successfully!',
        redirect: body.redirect,
      };
    }
  } catch (dbError) {
    if (conn) await conn.rollback();
    console.error('DB Error:', dbError);
    return {
      success: false,
      error: 'Failed to create account records',
      status: 500,
    };
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(request: NextRequest) {
  // ✅ FIX 1: Parse body inside try/catch so malformed/empty bodies
  // return JSON instead of crashing the handler and serving an HTML page
  let body: VerifyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid or empty request body' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    if (body.resend) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: body.email,
      });
      if (error) throw error;
      return NextResponse.json({
        success: true,
        message: 'Verification code resent successfully',
      });
    }

    // GOOGLE OAUTH FLOW
    if (!body.code) {
      // ✅ FIX 2: Use getUser() instead of getSession() — validates with
      // Supabase's auth server and works reliably with server cookies.
      const { data: { user: authUser }, error: sessionError } =
        await supabase.auth.getUser();

      if (sessionError || !authUser) {
        return NextResponse.json(
          { success: false, error: 'No active session. Please sign in again.' },
          { status: 401 }
        );
      }

      let user: User | null = authUser;

      // Handle case where user is a string (corrupted)
      if (typeof user === 'string') {
        try {
          user = JSON.parse(user);
        } catch {
          return NextResponse.json(
            { success: false, error: 'Session corrupted. Please try again.' },
            { status: 400 }
          );
        }
      }

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found in session' },
          { status: 401 }
        );
      }

      const userEmail = user.email || body.email || '';
      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: 'Email not found in session' },
          { status: 400 }
        );
      }

      // Strip down the user object - remove heavy Google OAuth data
      const cleanUser: MinimalUser = {
        id: user.id,
        email: userEmail,
        aud: user.aud || 'authenticated',
        role: user.role || 'authenticated',
        user_metadata: {
          full_name:
            user.user_metadata?.full_name || userEmail.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || '',
        },
      };

      // ✅ FIX 3: Removed updateUser() call — it was rewriting the auth
      // cookie on every Google signup and causing session/cookie churn.
      // The cleanUser object is used directly for the DB insert.

      const userType = body.userType || 'shop_owner';
      const result = await handleUserCreation(cleanUser, body, userType);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: result.status || 500 }
        );
      }

      return NextResponse.json(result);
    }

    // EMAIL VERIFICATION FLOW (OTP)
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        email: body.email,
        token: body.code,
        type: 'signup',
      });

    if (verifyError) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    let user: User | null = verifyData.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (typeof user === 'string') {
      try {
        user = JSON.parse(user);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Session corrupted. Please try again.' },
          { status: 400 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found after verification' },
        { status: 404 }
      );
    }

    const userEmail = user.email || body.email || '';
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email not found' },
        { status: 400 }
      );
    }

    const cleanUser: MinimalUser = {
      id: user.id,
      email: userEmail,
      aud: user.aud || 'authenticated',
      role: user.role || 'authenticated',
      user_metadata: {
        full_name:
          user.user_metadata?.full_name || userEmail.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || '',
      },
    };

    const userType = body.userType || 'shop_owner';
    const result = await handleUserCreation(cleanUser, body, userType);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}