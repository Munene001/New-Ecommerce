// app/(shop)/[shopSlug]/layout.tsx
import { ShopProvider } from "../ShopContext";
import ShopLayoutClient from "./components/shopLayoutClient";

// Server function to fetch shop data
async function getShopData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/shops/${slug}`, {
      cache: 'no-store',
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
      cache: 'no-store',
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

// Server Component Layout
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopSlug: string }>;
}) {
  // Await the params Promise
  const { shopSlug } = await params;
  
  const shopData = await getShopData(shopSlug);
  
  if (!shopData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
          <p className="text-gray-600">The shop you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }
  
  // Fetch initial products for SSR
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