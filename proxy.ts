import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

let validSlugsCache: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getValidShopSlugs(request: NextRequest): Promise<string[]> {
  const now = Date.now();
  if (lastFetchTime !== 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return validSlugsCache;
  }
  try {
    const url = new URL('/api/shops/shop-slugs', request.nextUrl.origin);
    const res = await fetch(url.toString());
    if (!res.ok) {
      return validSlugsCache;
    }
    const data = await res.json();
    validSlugsCache = data.slugs || [];
    lastFetchTime = now;
    return validSlugsCache;
  } catch {
    return validSlugsCache;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security: block malicious next-action headers
  const actionHeader = request.headers.get('next-action') || request.headers.get('x-nextjs-action');
  if (actionHeader && actionHeader.length < 10) {
    console.warn(`Blocked malicious action header: ${actionHeader}`);
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
    const validSlugs = await getValidShopSlugs(request);
    if (validSlugs.includes(subdomain)) {
      const url = request.nextUrl.clone();
      url.pathname = `/(shop)/${subdomain}${pathname}`;
      return NextResponse.rewrite(url);
    }
    return new NextResponse('Shop not found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};