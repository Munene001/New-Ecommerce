import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: 'Verification code resent successfully'
    });
    
  } catch (error: any) {
    console.error('Resend error:', error);
    
    // Handle rate limit specifically
    if (error?.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Please wait 49 seconds before requesting another code' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend code' },
      { status: 400 }
    );
  }
}