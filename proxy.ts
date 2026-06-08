import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

let validSlugsCache: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getValidShopSlugs(request: NextRequest): Promise<string[]> {
  const now = Date.now();
  if (lastFetchTime !== 0 && now - lastFetchTime < CACHE_TTL_MS) {
    console.log(`[Proxy] Using cached slugs (${validSlugsCache.length} items)`);
    return validSlugsCache;
  }
  try {
    console.log('[Proxy] Fetching fresh shop slugs from API');
    const url = new URL('/api/shops/shop-slugs', request.nextUrl.origin);
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.log(`[Proxy] API returned ${res.status}, using stale cache`);
      return validSlugsCache;
    }
    const data = await res.json();
    validSlugsCache = data.slugs || [];
    lastFetchTime = now;
    console.log(`[Proxy] Cached ${validSlugsCache.length} slugs:`, validSlugsCache);
    return validSlugsCache;
  } catch (err) {
    console.error('[Proxy] Error fetching slugs:', err);
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

  console.log(`[Proxy] Request host: ${host}, hostname: ${hostname}, pathname: ${pathname}`);

  // Allow main domain and www to pass through
  if (hostname === 'paziatech.co.ke' || hostname === 'www.paziatech.co.ke') {
    console.log('[Proxy] Main domain or www – skipping subdomain logic');
    return NextResponse.next();
  }

  const parts = hostname.split('.');
  const subdomain = parts.length >= 3 ? parts[0] : null;

  console.log(`[Proxy] parts: ${parts}, subdomain extracted: ${subdomain}`);

  if (subdomain && !excludedSubdomains.has(subdomain)) {
    console.log(`[Proxy] Subdomain "${subdomain}" not excluded, checking validity`);
    const validSlugs = await getValidShopSlugs(request);
    if (validSlugs.includes(subdomain)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${subdomain}${pathname}`;
      console.log(`[Proxy] Valid shop! Rewriting to: ${url.pathname}`);
      return NextResponse.rewrite(url);
    }
    console.log(`[Proxy] Subdomain "${subdomain}" not found in valid slugs list`);
    return new NextResponse('Shop not found', { status: 404 });
  }

  console.log(`[Proxy] No valid subdomain (subdomain=${subdomain}, excluded? ${subdomain && excludedSubdomains.has(subdomain)}) – passing through`);
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};