import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SignupBody {
  email: string;
  password: string;
  business_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupBody = await request.json();
    
    // 1. Check if business name already exists
    const [existingBusiness] = await pool.query<RowDataPacket[]>(
      `SELECT business_name FROM tenant WHERE LOWER(business_name) = LOWER(?)`,
      [body.business_name]
    );
    
    if (existingBusiness.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This business name is already taken. Please choose another.' },
        { status: 400 }
      );
    }
    
    // 2. If available, create Supabase user
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          business_name: body.business_name,
          role: 'shop_owner'
        }
      }
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('No user created');
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      user_id: data.user.id,
      email: body.email,
      business_name: body.business_name
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}