// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// 1. Force Node.js runtime for 'mysql2' socket compatibility
export const runtime = 'nodejs';

const excludedSubdomains = new Set(['www', 'staging', 'mail', 'admin', 'support']);

interface ShopCache {
  slugs: Set<string>;
  domainToSlugMap: Map<string, string>;
  slugToDomainMap: Map<string, string>;
  expiredSlugs: Set<string>;
  suspendedSlugs: Set<string>;
  allSlugsWithStatus: Map<string, string>;
}

// 2. Attach cache to globalThis for cross-request reuse
declare global {
  var __shopCache: ShopCache | undefined;
  var __shopCacheLastFetch: number | undefined;
  var __shopCachePromise: Promise<ShopCache> | undefined;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_TTL_MS = 60 * 60 * 1000; // 1 hour stale-while-revalidate

async function getCachedShopData(): Promise<ShopCache> {
  const now = Date.now();

  // Return fresh cache if available
  if (
    globalThis.__shopCache &&
    globalThis.__shopCacheLastFetch &&
    now - globalThis.__shopCacheLastFetch < CACHE_TTL_MS
  ) {
    return globalThis.__shopCache;
  }

  // Return stale cache while revalidating
  if (
    globalThis.__shopCache &&
    globalThis.__shopCacheLastFetch &&
    now - globalThis.__shopCacheLastFetch < STALE_TTL_MS
  ) {
    // Trigger async revalidation in background
    if (!globalThis.__shopCachePromise) {
      globalThis.__shopCachePromise = refreshShopCache();
    }
    return globalThis.__shopCache;
  }

  // Prevent cache stampede (multiple concurrent requests)
  if (globalThis.__shopCachePromise) {
    try {
      return await globalThis.__shopCachePromise;
    } finally {
      globalThis.__shopCachePromise = undefined;
    }
  }

  // Fresh fetch
  globalThis.__shopCachePromise = refreshShopCache();
  try {
    return await globalThis.__shopCachePromise;
  } finally {
    globalThis.__shopCachePromise = undefined;
  }
}

async function refreshShopCache(): Promise<ShopCache> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT shop_slug, custom_domain, tenant_status 
       FROM shops 
       WHERE shop_slug IS NOT NULL
       AND (tenant_status != 'deleted' OR tenant_status IS NULL)`
    );

    const slugs = new Set<string>();
    const domainToSlugMap = new Map<string, string>();
    const slugToDomainMap = new Map<string, string>();
    const expiredSlugs = new Set<string>();
    const suspendedSlugs = new Set<string>();
    const allSlugsWithStatus = new Map<string, string>();

    rows.forEach((row) => {
      const slug = row.shop_slug;
      const domain = row.custom_domain;
      const status = row.tenant_status || 'active'; // Default to active if null

      if (slug) {
        allSlugsWithStatus.set(slug, status);
      }

      // Handle different statuses
      if (status === 'expired') {
        if (slug) expiredSlugs.add(slug);
        return;
      }
      if (status === 'suspended') {
        if (slug) suspendedSlugs.add(slug);
        return;
      }

      // Only active shops (active, free_trial, or null)
      if (slug) {
        slugs.add(slug);
      }

      if (domain && slug) {
        const cleanDomain = domain
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '')
          .trim();

        if (cleanDomain) {
          domainToSlugMap.set(cleanDomain, slug);
          slugToDomainMap.set(slug, cleanDomain);

          // Add www version if not already present
          if (!cleanDomain.startsWith('www.')) {
            domainToSlugMap.set(`www.${cleanDomain}`, slug);
          }
        }
      }
    });

    const newCache: ShopCache = {
      slugs,
      domainToSlugMap,
      slugToDomainMap,
      expiredSlugs,
      suspendedSlugs,
      allSlugsWithStatus,
    };

    globalThis.__shopCache = newCache;
    globalThis.__shopCacheLastFetch = Date.now();

    return newCache;
  } catch (err) {
    console.error('[Proxy] DB Error:', err);
    // Return cached data if available, otherwise empty cache
    return (
      globalThis.__shopCache || {
        slugs: new Set(),
        domainToSlugMap: new Map(),
        slugToDomainMap: new Map(),
        expiredSlugs: new Set(),
        suspendedSlugs: new Set(),
        allSlugsWithStatus: new Map(),
      }
    );
  }
}

// 3. Enhanced path normalization with edge-case handling
function buildRewritePath(slugPrefix: string, pathname: string): string {
  // Remove slug prefix if present
  const cleanPath = pathname.startsWith(slugPrefix)
    ? pathname.slice(slugPrefix.length)
    : pathname;

  // Ensure single slash and no double slashes
  const normalizedPath = cleanPath
    .replace(/\/+/g, '/') // Replace multiple slashes with single
    .replace(/^\/+/, '/'); // Ensure leading slash

  // Return combined path without double slashes
  const combined = `${slugPrefix}${normalizedPath}`;
  return combined.replace(/\/+/g, '/');
}

// 4. Clean 404 response with white background
function renderShopNotFound(message: string = 'This shop is currently unavailable.') {
  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Shop Not Found</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
          }
          
          h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 0.75rem;
            letter-spacing: -0.02em;
          }
          
          p {
            font-size: 1.125rem;
            color: #666666;
            line-height: 1.6;
            margin-top: 0.5rem;
          }
          
          .status-code {
            margin-top: 2rem;
            color: #999999;
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          
          .divider {
            width: 40px;
            height: 3px;
            background: #e5e7eb;
            margin: 1.5rem auto;
            border-radius: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Shop Not Found</h1>
          <div class="divider"></div>
          <p>${message}</p>
          <div class="status-code">404</div>
        </div>
      </body>
    </html>`,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  );
}

// 5. Main middleware
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { pathname, search } = request.nextUrl;

    // Skip static assets and core APIs
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
    const isPreview = process.env.VERCEL_ENV === 'preview';

    // Skip main platform domain
    if (hostname === 'paziatech.co.ke' || hostname === 'www.paziatech.co.ke') {
      return NextResponse.next();
    }

    // Handle preview deployments
    if (isPreview && hostname.includes('vercel.app')) {
      return NextResponse.next();
    }

    const shopCache = await getCachedShopData();
    const {
      slugs,
      domainToSlugMap,
      slugToDomainMap,
      expiredSlugs,
      suspendedSlugs,
      allSlugsWithStatus,
    } = shopCache;

    // 6. CUSTOM DOMAIN HANDLING (e.g., lunariashop.co.ke)
    const customDomainShopSlug = domainToSlugMap.get(hostname);
    if (customDomainShopSlug) {
      const status = allSlugsWithStatus.get(customDomainShopSlug);

      // CHECK FOR EXPIRED OR SUSPENDED - SHOW 404
      if (status === 'expired' || status === 'suspended') {
        return renderShopNotFound('This shop is currently unavailable.');
      }

      // Check if path contains the slug prefix (SEO cleanup)
      const slugPrefix = `/${customDomainShopSlug}`;
      if (pathname.startsWith(slugPrefix)) {
        const cleanPath = buildRewritePath('', pathname.replace(slugPrefix, ''));
        const redirectUrl = new URL(`${cleanPath}${search}`, request.url);
        return NextResponse.redirect(redirectUrl, { status: 301 });
      }

      // Active custom domain - show the shop
      const url = request.nextUrl.clone();
      url.pathname = buildRewritePath(slugPrefix, pathname);
      return NextResponse.rewrite(url);
    }

    // 7. SUBDOMAIN HANDLING (e.g., lunaria.paziatech.co.ke)
    let subdomain: string | null = null;
    if (isDev) {
      if (hostname.endsWith('.localhost')) {
        subdomain = hostname.replace('.localhost', '');
      } else if (hostname === 'localhost') {
        return NextResponse.next();
      }
    } else if (hostname.endsWith('.paziatech.co.ke')) {
      subdomain = hostname.replace('.paziatech.co.ke', '');
    }

    if (subdomain && !excludedSubdomains.has(subdomain)) {
      // CHECK FOR EXPIRED OR SUSPENDED - SHOW 404
      if (expiredSlugs.has(subdomain) || suspendedSlugs.has(subdomain)) {
        return renderShopNotFound('This shop is currently unavailable.');
      }

      // Check for custom domain (redirect to it)
      const customDomain = slugToDomainMap.get(subdomain);
      if (customDomain) {
        const redirectUrl = new URL(`${pathname}${search}`, `https://${customDomain}`);
        return NextResponse.redirect(redirectUrl, { status: 301 });
      }

      // Valid active shop subdomain
      if (slugs.has(subdomain)) {
        const slugPrefix = `/${subdomain}`;

        // Remove duplicate slug from URL
        if (pathname.startsWith(slugPrefix)) {
          const cleanPath = buildRewritePath('', pathname.replace(slugPrefix, ''));
          const redirectUrl = new URL(`${cleanPath}${search}`, request.url);
          return NextResponse.redirect(redirectUrl, { status: 301 });
        }

        const url = request.nextUrl.clone();
        url.pathname = buildRewritePath(slugPrefix, pathname);
        return NextResponse.rewrite(url);
      }

      // Unknown subdomain
      return renderShopNotFound("The shop you're looking for doesn't exist.");
    }

    // 8. Default: pass through
    return NextResponse.next();
  } catch (error) {
    console.error(`[${requestId}] Unhandled middleware error:`, error);
    return NextResponse.next();
  } finally {
    const duration = Date.now() - startTime;
    if (duration > 100) {
      console.warn(`[${requestId}] Middleware slow: ${duration}ms for ${request.nextUrl.pathname}`);
    }
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};