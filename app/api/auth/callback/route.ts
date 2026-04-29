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
  console.log(`[${new Date().toISOString()}] 🔵 CALLBACK STARTED for email: ${body?.email || 'unknown'}`);

  try {
    
    const supabase = await createSupabaseServerClient();

    if (body.resend) {
      console.log(`[${new Date().toISOString()}] 📧 RESEND requested for email: ${body.email}`);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: body.email,
      });
      
      if (error) throw error;
      
      console.log(`[${new Date().toISOString()}] ✅ RESEND successful`);
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
    
    console.log(`[${new Date().toISOString()}] 🔐 Starting verifyOtp...`);
    const verifyStart = Date.now();
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: body.email,
      token: body.code,
      type: 'signup'
    });
    const verifyDuration = Date.now() - verifyStart;
    console.log(`[${new Date().toISOString()}] ⏱️ verifyOtp completed in ${verifyDuration}ms`);

    if (verifyError) {
      console.log(`[${new Date().toISOString()}] ❌ verifyOtp failed: ${verifyError.message}`);
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
    console.log(`[${new Date().toISOString()}] 👤 User type: ${userType}, User ID: ${user.id}`);
    
    let conn;
    
    try {
      conn = await pool.getConnection();
      console.log(`[${new Date().toISOString()}] 🗄️ Database connected`);
      
      await conn.beginTransaction();
      console.log(`[${new Date().toISOString()}] 🔄 Transaction started`);

      if (userType === 'shop_owner') {
        console.log(`[${new Date().toISOString()}] 📝 Inserting into users table...`);
        const insertUserStart = Date.now();
        const [userResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'shop_owner')`,
          [user.id, body.full_name, body.email, body.phone]
        );
        const insertUserDuration = Date.now() - insertUserStart;
        console.log(`[${new Date().toISOString()}] ⏱️ Users insert completed in ${insertUserDuration}ms`);
        
        const userId = userResult.insertId;
        console.log(`[${new Date().toISOString()}] 📊 User ID: ${userId}`);
        
        const slug = body.slug || `${body.business_name!.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        console.log(`[${new Date().toISOString()}] 🔗 Slug: ${slug}`);
        
        console.log(`[${new Date().toISOString()}] 📝 Inserting into tenant table...`);
        const insertTenantStart = Date.now();
        await conn.execute(
          `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
           VALUES (?, ?, ?, ?, ?)`,
          [userId, body.business_name, slug, body.business_town, body.business_address]
        );
        const insertTenantDuration = Date.now() - insertTenantStart;
        console.log(`[${new Date().toISOString()}] ⏱️ Tenant insert completed in ${insertTenantDuration}ms`);

        await conn.commit();
        console.log(`[${new Date().toISOString()}] ✅ Transaction committed`);

        const totalDuration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] 🎉 SHOP OWNER verification completed in ${totalDuration}ms`);

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully! Please complete your shop setup.',
          userId: userId,
          shop_slug: slug
        });
      } 
      else {
        console.log(`[${new Date().toISOString()}] 📝 Inserting customer into users table...`);
        const insertUserStart = Date.now();
        await conn.execute<ResultSetHeader>(
          `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
           VALUES (?, ?, ?, ?, 'customer')`,
          [user.id, body.full_name, body.email, body.phone]
        );
        const insertUserDuration = Date.now() - insertUserStart;
        console.log(`[${new Date().toISOString()}] ⏱️ Customer insert completed in ${insertUserDuration}ms`);

        await conn.commit();
        console.log(`[${new Date().toISOString()}] ✅ Transaction committed`);

        const totalDuration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] 🎉 CUSTOMER verification completed in ${totalDuration}ms`);

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully! You can now log in.',
          redirect: body.redirect
        });
      }
      
    } catch (dbError) {
      if (conn) await conn.rollback();
      console.error(`[${new Date().toISOString()}] ❌ Database error:`, dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create account records' },
        { status: 500 }
      );
    } finally {
      if (conn) conn.release();
      console.log(`[${new Date().toISOString()}] 🔌 Database connection released`);
    }

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ❌ Verification error after ${totalDuration}ms:`, error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}