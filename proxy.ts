import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

// Cache structures
interface ShopCache {
  slugs: Set<string>;
  domainToSlugMap: Map<string, string>;
  slugToDomainMap: Map<string, string>;
}

let shopCache: ShopCache | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// Single unified DB query helper
async function getCachedShopData(): Promise<ShopCache> {
  const now = Date.now();
  if (shopCache && now - lastFetchTime < CACHE_TTL_MS) {
    return shopCache;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT shop_slug, custom_domain FROM shops WHERE shop_slug IS NOT NULL'
    );

    const slugs = new Set<string>();
    const domainToSlugMap = new Map<string, string>();
    const slugToDomainMap = new Map<string, string>();

    rows.forEach((row) => {
      const slug = row.shop_slug;
      const domain = row.custom_domain;

      if (slug) {
        slugs.add(slug);
      }

      if (domain && slug) {
        // Clean domain string
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        
        domainToSlugMap.set(cleanDomain, slug);
        slugToDomainMap.set(slug, cleanDomain);

        // Map www variation
        if (!cleanDomain.startsWith('www.')) {
          domainToSlugMap.set(`www.${cleanDomain}`, slug);
        }
      }
    });

    shopCache = { slugs, domainToSlugMap, slugToDomainMap };
    lastFetchTime = now;
    return shopCache;
  } catch (err) {
    console.error('[Proxy] DB error:', err);
    return shopCache || { slugs: new Set(), domainToSlugMap: new Map(), slugToDomainMap: new Map() };
  }
}

// MAIN PROXY
export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // 1. SKIP STATIC ASSETS AND API
    if (
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0].toLowerCase();
    const isDev = process.env.NODE_ENV === 'development';

    // 2. SKIP MAIN PLATFORM DOMAINS
    if (hostname === 'paziatech.co.ke' || hostname === 'www.paziatech.co.ke') {
      return NextResponse.next();
    }

    const { slugs, domainToSlugMap, slugToDomainMap } = await getCachedShopData();

    // 3. CHECK IF INCOMING HOST IS A CUSTOM DOMAIN
    const customDomainShopSlug = domainToSlugMap.get(hostname);
    if (customDomainShopSlug) {
      const url = request.nextUrl.clone();
      if (!pathname.startsWith(`/${customDomainShopSlug}`)) {
        url.pathname = `/${customDomainShopSlug}${pathname}`;
      }
      return NextResponse.rewrite(url);
    }

    // 4. PARSE SUBDOMAIN FROM HOST
    let subdomain: string | null = null;
    if (isDev) {
      if (hostname.endsWith('.localhost')) {
        subdomain = hostname.replace('.localhost', '');
      }
    } else if (hostname.endsWith('.paziatech.co.ke')) {
      subdomain = hostname.replace('.paziatech.co.ke', '');
    }

    if (subdomain && !excludedSubdomains.has(subdomain)) {
      // Check if this subdomain configured a custom domain
      const customDomain = slugToDomainMap.get(subdomain);

      if (customDomain) {
        // Redirect subdomain to custom domain (301)
        const redirectUrl = new URL(pathname, `https://${customDomain}`);
        redirectUrl.search = request.nextUrl.search;
        return NextResponse.redirect(redirectUrl, { status: 301 });
      }

      // Rewrite path for native subdomain
      if (slugs.has(subdomain)) {
        const url = request.nextUrl.clone();
        if (!pathname.startsWith(`/${subdomain}`)) {
          url.pathname = `/${subdomain}${pathname}`;
        }
        return NextResponse.rewrite(url);
      }

      return new NextResponse('Shop not found', { status: 404 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[Proxy] Unhandled proxy error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};