// app/(shop)/[shopSlug]/layout.tsx
import type { Metadata } from "next";
import { ShopProvider } from "../ShopContext";
import ShopLayoutClient from "./components/shopLayoutClient";

// Server function to fetch shop data
async function getShopData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/shops/${slug}`, {
      next: { 
        revalidate: 3600,
      },
    });
    
    if (!res.ok) return null;
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching shop:', error);
    return null;
  }
}

// Server function to fetch initial products (first page)
async function getInitialProducts(shopId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/shopowner/products?shopId=${shopId}&limit=20`, {
      next: { 
        revalidate: 3600,
      },
    });
    
    if (!res.ok) {
      return { products: [], totalCount: 0 };
    }
    
    const data = await res.json();
    return {
      products: data.products || [],
      totalCount: data.pagination?.totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching initial products:', error);
    return { products: [], totalCount: 0 };
  }
}

// Generate dynamic metadata for the browser tab and social previews
export async function generateMetadata({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}): Promise<Metadata> {
  const { shopSlug } = await params;
  const shopData = await getShopData(shopSlug);

  if (!shopData) {
    return {
      title: "Shop Not Found",
      robots: { index: false },
    };
  }

  const title = shopData.shopName || "Online Shop";
  const description = shopData.description || `Browse products on ${title}`;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const imageUrl = shopData.logoUrl 
    ? shopData.logoUrl.startsWith('http') 
      ? shopData.logoUrl 
      : `${baseUrl}${shopData.logoUrl}`
    : `${baseUrl}/default-shop-og-image.png`;

  return {
    title: {
      absolute: title,
    },
    applicationName: title, 
    description: description,
    icons: {
      icon: shopData.logoUrl || '/default-favicon.ico',
      apple: shopData.logoUrl || '/default-apple-icon.png',
    },
    openGraph: {
      title: title,
      description: description,
      siteName: title,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      type: 'website',
      locale: 'en_US',
      url: `${baseUrl}/shop/${shopSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${baseUrl}/shop/${shopSlug}`,
    },
    keywords: shopData.keywords || `${title}, shop, online store`,
    authors: [{ name: title }],
    category: shopData.category || 'Online Store',
  };
}

// Server Component Layout
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const shopData = await getShopData(shopSlug);
  
  const isExpired = shopData?.tenantStatus === 'expired';
  const isSuspended = shopData?.tenantStatus === 'suspended';
  
  if (!shopData || isExpired || isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Shop not found</h1>
        </div>
      </div>
    );
  }
  
  const { products, totalCount } = await getInitialProducts(shopData.shopId.toString());

  return (
    <ShopProvider initialShopData={shopData}>
      <ShopLayoutClient 
        shopData={shopData}
        initialProducts={products}
        initialTotalCount={totalCount}
      >
        {children}
      </ShopLayoutClient>
    </ShopProvider>
  );
}