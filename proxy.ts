import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.paziatech.co.ke';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

interface ShopCache {
  slugs: Set<string>;
  domainToSlugMap: Map<string, string>;
  slugToDomainMap: Map<string, string>;
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
      'SELECT shop_slug, custom_domain FROM shops WHERE shop_slug IS NOT NULL'
    );

    const slugs = new Set<string>();
    const domainToSlugMap = new Map<string, string>();
    const slugToDomainMap = new Map<string, string>();

    rows.forEach((row) => {
      const slug = row.shop_slug;
      const domain = row.custom_domain;

      if (slug) slugs.add(slug);

      if (domain && slug) {
        const cleanDomain = domain
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '');
        
        domainToSlugMap.set(cleanDomain, slug);
        slugToDomainMap.set(slug, cleanDomain);

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

export async function proxy(request: NextRequest) {
  try {
    const { pathname, search } = request.nextUrl;

    // 1. FAST-SKIP STATIC ASSETS AND BUNDLES
    if (
      pathname.startsWith('/_next') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    // 2. INITIALIZE RESPONSE & REFRESH SUPABASE SESSION
    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({
              name,
              value,
              ...options,
              domain: isProduction ? COOKIE_DOMAIN : undefined,
              secure: isProduction,
              sameSite: 'lax',
              path: '/',
            })
          );
        },
      },
    });

    // Validates JWT & writes fresh token cookies to response
    await supabase.auth.getUser();

    // 3. HELPER FUNCTIONS TO PRESERVE REFRESHED SESSION COOKIES
    const createRedirect = (url: URL | string, status = 307) => {
      const redirectRes = NextResponse.redirect(url, status);
      response.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie);
      });
      return redirectRes;
    };

    const createRewrite = (url: URL) => {
      const rewriteRes = NextResponse.rewrite(url);
      response.cookies.getAll().forEach((cookie) => {
        rewriteRes.cookies.set(cookie);
      });
      return rewriteRes;
    };

    // 4. TENANT ROUTING LOGIC
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0].toLowerCase();
    const isDev = process.env.NODE_ENV === 'development';

    // Skip platform domain
    if (hostname === 'paziatech.co.ke' || hostname === 'www.paziatech.co.ke') {
      return response;
    }

    const { slugs, domainToSlugMap, slugToDomainMap } = await getCachedShopData();

    // Custom Domain Routing
    const customDomainShopSlug = domainToSlugMap.get(hostname);
    if (customDomainShopSlug) {
      const slugPrefix = `/${customDomainShopSlug}`;

      if (pathname.startsWith(slugPrefix)) {
        const cleanPath = pathname.slice(slugPrefix.length) || '/';
        const redirectUrl = new URL(`${cleanPath}${search}`, request.url);
        return createRedirect(redirectUrl, 301);
      }

      const url = request.nextUrl.clone();
      url.pathname = `${slugPrefix}${pathname}`;
      return createRewrite(url);
    }

    // Subdomain Routing
    let subdomain: string | null = null;
    if (isDev && hostname.endsWith('.localhost')) {
      subdomain = hostname.replace('.localhost', '');
    } else if (hostname.endsWith('.paziatech.co.ke')) {
      subdomain = hostname.replace('.paziatech.co.ke', '');
    }

    if (subdomain && !excludedSubdomains.has(subdomain)) {
      const customDomain = slugToDomainMap.get(subdomain);

      if (customDomain) {
        const slugPrefix = `/${subdomain}`;
        let cleanPath = pathname;
        if (pathname.startsWith(slugPrefix)) {
          cleanPath = pathname.slice(slugPrefix.length) || '/';
        }
        return createRedirect(`https://${customDomain}${cleanPath}${search}`, 301);
      }

      if (slugs.has(subdomain)) {
        const slugPrefix = `/${subdomain}`;

        if (pathname.startsWith(slugPrefix)) {
          const cleanPath = pathname.slice(slugPrefix.length) || '/';
          return createRedirect(new URL(`${cleanPath}${search}`, request.url), 301);
        }

        const url = request.nextUrl.clone();
        url.pathname = `${slugPrefix}${pathname}`;
        return createRewrite(url);
      }

      // Return 404 while preserving session cookies
      const notFoundRes = new NextResponse('Shop not found', { status: 404 });
      response.cookies.getAll().forEach((cookie) => {
        notFoundRes.cookies.set(cookie);
      });
      return notFoundRes;
    }

    return response;
  } catch (error) {
    console.error('[Proxy] Unhandled proxy error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};