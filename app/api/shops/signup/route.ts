import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface SignupBody {
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupBody = await request.json();
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          full_name: body.full_name,
          phone: body.phone,
          role: 'customer'
        }
      }
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('No user created');
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      user_id: data.user.id,
      email: body.email
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