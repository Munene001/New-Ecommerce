import { supabase } from './supabase'; 
import { NextRequest, NextResponse } from 'next/server';

export async function validateToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

 
  return { supabaseUser: user, token };
}