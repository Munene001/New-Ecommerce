import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';



const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

interface ShopCache {
  slugs: Set<string>;
  domainToSlugMap: Map<string, string>;
  slugToDomainMap: Map<string, string>;
  expiredSlugs: Set<string>;
  suspendedSlugs: Set<string>;
}

let shopCache: ShopCache | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedShopData(): Promise<ShopCache> {
  const now = Date.now();
  if (shopCache && now - lastFetchTime < CACHE_TTL_MS) {
    return shopCache;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT shop_slug, custom_domain, tenant_status FROM shops WHERE shop_slug IS NOT NULL'
    );

    const slugs = new Set<string>();
    const domainToSlugMap = new Map<string, string>();
    const slugToDomainMap = new Map<string, string>();
    const expiredSlugs = new Set<string>();
    const suspendedSlugs = new Set<string>();

    rows.forEach((row) => {
      const slug = row.shop_slug;
      const domain = row.custom_domain;
      const status = row.tenant_status;

      if (status === 'expired') {
        if (slug) expiredSlugs.add(slug);
        return;
      }
      if (status === 'suspended') {
        if (slug) suspendedSlugs.add(slug);
        return;
      }

      if (slug) {
        slugs.add(slug);
      }

      if (domain && slug) {
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        
        domainToSlugMap.set(cleanDomain, slug);
        slugToDomainMap.set(slug, cleanDomain);

        if (!cleanDomain.startsWith('www.')) {
          domainToSlugMap.set(`www.${cleanDomain}`, slug);
        }
      }
    });

    shopCache = { slugs, domainToSlugMap, slugToDomainMap, expiredSlugs, suspendedSlugs };
    lastFetchTime = now;
    return shopCache;
  } catch (err) {
    console.error('[Proxy] DB error:', err);
    return shopCache || { slugs: new Set(), domainToSlugMap: new Map(), slugToDomainMap: new Map(), expiredSlugs: new Set(), suspendedSlugs: new Set() };
  }
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname, search } = request.nextUrl;

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

    const { slugs, domainToSlugMap, slugToDomainMap, expiredSlugs, suspendedSlugs } = await getCachedShopData();

    // 3. CHECK IF INCOMING HOST IS A CUSTOM DOMAIN
    const customDomainShopSlug = domainToSlugMap.get(hostname);
    if (customDomainShopSlug) {
      // Check for expired/suspended
      if (expiredSlugs.has(customDomainShopSlug) || suspendedSlugs.has(customDomainShopSlug)) {
        return new NextResponse('Shop not found', { status: 404 });
      }

      const slugPrefix = `/${customDomainShopSlug}`;

      // Normalize path to prevent double slug prefixing or double slashes
      const cleanPath = pathname.startsWith(slugPrefix)
        ? pathname.slice(slugPrefix.length) || '/'
        : pathname;

      const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

      // Rewrite clean URL internally to app/[shop_slug]/...
      const url = request.nextUrl.clone();
      url.pathname = `${slugPrefix}${formattedPath === '/' ? '' : formattedPath}`;
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
      // Check for expired/suspended
      if (expiredSlugs.has(subdomain) || suspendedSlugs.has(subdomain)) {
        return new NextResponse('Shop not found', { status: 404 });
      }

      const customDomain = slugToDomainMap.get(subdomain);

      if (customDomain) {
        const slugPrefix = `/${subdomain}`;
        let cleanPath = pathname;
        if (pathname.startsWith(slugPrefix)) {
          cleanPath = pathname.slice(slugPrefix.length) || '/';
        }

        const redirectUrl = new URL(`${cleanPath}${search}`, `https://${customDomain}`);
        return NextResponse.redirect(redirectUrl, { status: 301 });
      }

      if (slugs.has(subdomain)) {
        const slugPrefix = `/${subdomain}`;

        // Strip slug from subdomain URLs if present in visible address
        if (pathname.startsWith(slugPrefix)) {
          const cleanPath = pathname.slice(slugPrefix.length) || '/';
          const redirectUrl = new URL(`${cleanPath}${search}`, request.url);
          return NextResponse.redirect(redirectUrl, { status: 301 });
        }

        const url = request.nextUrl.clone();
        url.pathname = `${slugPrefix}${pathname}`;
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