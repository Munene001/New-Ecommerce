import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

interface VerifyBody {
  email: string;
  code?: string;
  full_name?: string;
  phone?: string;
  business_name?: string;
  business_town?: string;
  business_address?: string;
  slug?: string;
  resend?: boolean;
  userType?: 'shop_owner' | 'customer';
  redirect?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
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
        message: 'Verification code resent successfully'
      });
    }

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'Verification code required' },
        { status: 400 }
      );
    }
    
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.code,
      type: 'signup'
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
        const [userResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'shop_owner')`,
          [user.id, body.full_name, body.email, body.phone]
        );
        
        const userId = userResult.insertId;
        const slug = body.slug || `${body.business_name!.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        
        await conn.execute(
          `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
           VALUES (?, ?, ?, ?, ?)`,
          [userId, body.business_name, slug, body.business_town, body.business_address]
        );

        await conn.commit();

        const response = NextResponse.json({
          success: true,
          message: 'Email verified successfully! Please complete your shop setup.',
          userId: userId,
          shop_slug: slug
        });
        
        // Remove large auth cookies to prevent header size issues
        response.headers.set('Set-Cookie', '');
        
        return response;
      } 
      else {
        await conn.execute<ResultSetHeader>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'customer')`,
          [user.id, body.full_name, body.email, body.phone]
        );

        await conn.commit();

        const response = NextResponse.json({
          success: true,
          message: 'Email verified successfully! You can now log in.',
          redirect: body.redirect
        });
        
        // Remove large auth cookies to prevent header size issues
        response.headers.set('Set-Cookie', '');
        
        return response;
      }
      
    } catch (dbError) {
      if (conn) await conn.rollback();
      return NextResponse.json(
        { success: false, error: 'Failed to create account records' },
        { status: 500 }
      );
    } finally {
      if (conn) conn.release();
    }

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}