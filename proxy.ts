import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

let validSlugsCache: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// Preload cache on module load (optional, speeds up first request)
async function preloadSlugs() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT shop_slug FROM shops');
    validSlugsCache = rows.map(row => row.shop_slug);
    lastFetchTime = Date.now();
    console.log(`[Proxy] Preloaded ${validSlugsCache.length} slugs on startup`);
  } catch (err) {
    console.error('[Proxy] Failed to preload slugs:', err);
  }
}
preloadSlugs(); // run immediately

async function getValidShopSlugs(): Promise<string[]> {
  const now = Date.now();
  if (lastFetchTime !== 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return validSlugsCache;
  }
  try {
    console.log('[Proxy] Fetching fresh shop slugs from DB');
    const [rows] = await pool.query<RowDataPacket[]>('SELECT shop_slug FROM shops');
    validSlugsCache = rows.map(row => row.shop_slug);
    lastFetchTime = now;
    console.log(`[Proxy] Cached ${validSlugsCache.length} slugs:`, validSlugsCache);
    return validSlugsCache;
  } catch (err) {
    console.error('[Proxy] DB error fetching slugs:', err);
    return validSlugsCache;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security: block malicious next-action headers
  const actionHeader = request.headers.get('next-action') || request.headers.get('x-nextjs-action');
  if (actionHeader && actionHeader.length < 10) {
    console.warn(`[Proxy] Blocked malicious action header: ${actionHeader}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Skip static assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Subdomain logic
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Allow main domain and www to pass through
  if (hostname === 'paziatech.co.ke' || hostname === 'www.paziatech.co.ke') {
    return NextResponse.next();
  }

  const parts = hostname.split('.');
  const subdomain = parts.length >= 3 ? parts[0] : null;

  if (subdomain && !excludedSubdomains.has(subdomain)) {
    const validSlugs = await getValidShopSlugs();
    if (validSlugs.includes(subdomain)) {
      const url = request.nextUrl.clone();
      // Prevent duplicate subdomain in path
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