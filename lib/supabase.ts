// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const isProduction = process.env.NODE_ENV === 'production'
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.paziatech.co.ke'

type SameSiteValue = 'Lax' | 'Strict' | 'None'

function normalizeSameSite(
  value: CookieOptions['sameSite']
): SameSiteValue {
  if (value === true) return 'Strict'
  if (value === false || value === undefined) return 'Lax'
  switch (value) {
    case 'strict':
      return 'Strict'
    case 'none':
      return 'None'
    case 'lax':
    default:
      return 'Lax'
  }
}

function buildCookieString(
  name: string,
  value: string,
  options: CookieOptions = {},
  isRemoval = false
): string {
  const parts: string[] = [
    `${name}=${isRemoval ? '' : encodeURIComponent(value)}`,
  ]

  parts.push(`Path=${options.path ?? '/'}`)

  if (isProduction) {
    parts.push(`Domain=${COOKIE_DOMAIN}`)
  }

  if (isRemoval) {
    parts.push('Max-Age=0')
  } else if (typeof options.maxAge === 'number') {
    parts.push(`Max-Age=${options.maxAge}`)
  } else if (options.expires) {
    const expires =
      options.expires instanceof Date
        ? options.expires
        : new Date(options.expires as string | number)
    parts.push(`Expires=${expires.toUTCString()}`)
  }

  const sameSite = normalizeSameSite(options.sameSite)
  parts.push(`SameSite=${sameSite}`)

  if (isProduction || sameSite === 'None') {
    parts.push('Secure')
  }

  return parts.join('; ')
}

function parseCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  if (!match) return undefined
  return decodeURIComponent(match.substring(name.length + 1))
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return parseCookie(name)
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof document === 'undefined') return
        document.cookie = buildCookieString(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        if (typeof document === 'undefined') return
        document.cookie = buildCookieString(name, '', options, true)
      },
    },
  })