import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

interface SignupBody {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  redirect?: string;
  redirectTo?: string;  // ← ADD THIS
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupBody = await request.json();
    
    // Get origin from request headers (works for all environments)
    const origin = request.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   'http://localhost:3000';
    
    // Use redirectTo from frontend if provided, otherwise construct default
    const redirectUrl = body.redirectTo || `${origin}/api/auth/callback?next=/auth/login`;
    
    // Add the original redirect param if it exists (for post-login redirect)
    const finalRedirectUrl = body.redirect 
      ? `${redirectUrl}&redirect=${encodeURIComponent(body.redirect)}`
      : redirectUrl;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: finalRedirectUrl,
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

  } catch (error) {
    console.error('Customer signup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}