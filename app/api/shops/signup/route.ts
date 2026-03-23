import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const redirectUrl = `${origin}/api/auth/callback${
        body.redirect ? `?redirect=${encodeURIComponent(body.redirect)}` : ''
      }`;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: body.full_name,
          phone: body.phone,
          role: 'customer'
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user created');

    // If email is already confirmed (e.g., test user, or auto-confirm)
    if (data.user.email_confirmed_at) {
      await pool.execute(
        `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
         VALUES (?, ?, ?, ?, 'customer')`,
        [data.user.id, body.full_name, body.email, body.phone]
      );

      return NextResponse.json({
        success: true,
        message: 'Account verified and created!',
        verified: true,
        mysql_saved: true,
        user_id: data.user.id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Check your email to verify your account.',
      verified: false,
      mysql_saved: false,
      user_id: data.user.id
    });

  } catch (error: any) {
    console.error('Customer signup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}