// lib/supabase-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const isProduction = process.env.NODE_ENV === 'production'

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.paziatech.co.ke'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value,
            ...options,
            // Only set domain in production
            ...(isProduction ? { domain: COOKIE_DOMAIN } : {}),
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
          })
        } catch {
          // Ignore if called from server component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...options,
            ...(isProduction ? { domain: COOKIE_DOMAIN } : {}),
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
          })
        } catch {
          // Ignore
        }
      },
    },
  })
}