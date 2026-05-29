import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface VerifyBody {
  email: string;
  code?: string;
  business_name?: string;
  phone?: string;
  resend?: boolean;
  userType?: 'shop_owner' | 'customer';
  redirect?: string;
}

export async function POST(request: NextRequest) {
  const body: VerifyBody = await request.json();

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'No active session. Please sign in again.' },
          { status: 401 }
        );
      }

      const user = session.user;
      const userType = body.userType || 'shop_owner';
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
            return NextResponse.json(
              { success: false, error: 'This business name is already taken. Please choose another.' },
              { status: 400 }
            );
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

          await conn.execute(
            `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) VALUES (?, ?, ?, ?, ?)`,
            [userId, body.business_name, slug, businessTown, businessAddress]
          );

          await conn.commit();
          const response = NextResponse.json({
            success: true,
            message: 'Account created successfully!',
            userId: userId,
            business_slug: slug,
          });
          response.headers.set('Set-Cookie', '');
          return response;
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
          const response = NextResponse.json({
            success: true,
            message: 'Account created successfully!',
            redirect: body.redirect,
          });
          response.headers.set('Set-Cookie', '');
          return response;
        }
      } catch (dbError) {
        if (conn) await conn.rollback();
        console.error('DB Error:', dbError);
        return NextResponse.json(
          { success: false, error: 'Failed to create account records' },
          { status: 500 }
        );
      } finally {
        if (conn) conn.release();
      }
    }

    // EMAIL VERIFICATION FLOW (OTP)
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
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

    const user = verifyData.user;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = body.userType || 'shop_owner';
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
          return NextResponse.json(
            { success: false, error: 'This business name is already taken. Please choose another.' },
            { status: 400 }
          );
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

        await conn.execute(
          `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) VALUES (?, ?, ?, ?, ?)`,
          [userId, body.business_name, slug, businessTown, businessAddress]
        );

        await conn.commit();
        const response = NextResponse.json({
          success: true,
          message: 'Email verified successfully!',
          userId: userId,
          business_slug: slug,
        });
        response.headers.set('Set-Cookie', '');
        return response;
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
        const response = NextResponse.json({
          success: true,
          message: 'Email verified successfully! You can now log in.',
          redirect: body.redirect,
        });
        response.headers.set('Set-Cookie', '');
        return response;
      }
    } catch (dbError) {
      if (conn) await conn.rollback();
      console.error('DB Error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create account records' },
        { status: 500 }
      );
    } finally {
      if (conn) conn.release();
    }
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}