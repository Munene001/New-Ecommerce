import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const redirectUrl = `${origin}/api/auth/callback`;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: { 
        emailRedirectTo: redirectUrl,
        data: { 
          full_name: body.full_name, 
          phone: body.phone, 
          business_name: body.business_name,  
          business_town: body.business_town,      
          business_address: body.business_address,
          role: 'shop_owner'
        } 
      }
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('No user created');
    
    if (data.user.email_confirmed_at) {
      const [userResult] = await pool.execute(
        `INSERT INTO users (supabase_uid, full_name, email, phone, role) 
         VALUES (?, ?, ?, ?, 'shop_owner')`,
        [data.user.id, body.full_name, body.email, body.phone]
      );
      
      const userId = (userResult as any).insertId;
      const slug = `${body.business_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      await pool.execute(
        `INSERT INTO tenant (user_id, business_name, business_slug, business_town, business_address) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          body.business_name,
          slug,
          body.business_town,
          body.business_address
        ]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Account verified and created!',
        verified: true,
        mysql_saved: true,
        user_id: data.user.id,
        shop_slug: slug
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}