// lib/supabase.ts (Client-only)
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''


if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    throw new Error('Missing Supabase environment variables')
  }
  console.warn('Missing Supabase environment variables')
}

// 1. Regular client for frontend (Browser-side)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// 2. Admin client for server-side manual tasks (bypass RLS)


// REMOVED: createSSRClient function - move to supabase-server.ts