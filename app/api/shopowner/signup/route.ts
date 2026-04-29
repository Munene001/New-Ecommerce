import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

interface SignupBody {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  business_name: string;
  business_town: string;
  business_address: string;
  slug: string; // Add this
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
          business_name: body.business_name,
          business_town: body.business_town,
          business_address: body.business_address,
          slug: body.slug, // Add this
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