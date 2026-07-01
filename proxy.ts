import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

let validSlugsCache: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getValidShopSlugs(): Promise<string[]> {
  const now = Date.now();
  if (lastFetchTime !== 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return validSlugsCache;
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT shop_slug FROM shops');
    validSlugsCache = rows.map(row => row.shop_slug);
    lastFetchTime = now;
    return validSlugsCache;
  } catch (err) {
    console.error('[Proxy] DB error:', err);
    return validSlugsCache;
  }
}

getValidShopSlugs();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude auth routes, static files, and API from shop subdomain rewrite
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const isDev = process.env.NODE_ENV === 'development';

  // Allow main domain to pass through
  if (hostname === 'paziatech.co.ke' || hostname === 'www.paziatech.co.ke') {
    return NextResponse.next();
  }

  let subdomain: string | null = null;

  if (isDev) {
    if (hostname.endsWith('.localhost')) {
      subdomain = hostname.replace('.localhost', '');
    }
  } else {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }

  // Handle shop subdomains
  if (subdomain && !excludedSubdomains.has(subdomain)) {
    const validSlugs = await getValidShopSlugs();
    if (validSlugs.includes(subdomain)) {
      const url = request.nextUrl.clone();
      if (pathname.startsWith(`/${subdomain}/`) || pathname === `/${subdomain}`) {
        url.pathname = pathname;
      } else {
        url.pathname = `/${subdomain}${pathname}`;
      }
      return NextResponse.rewrite(url);
    }
    return new NextResponse('Shop not found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};