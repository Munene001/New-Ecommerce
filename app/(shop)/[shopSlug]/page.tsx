// app/(shop)/[shopSlug]/page.tsx
import { Product } from "@/lib/types/product";
import ShopProductsClient from "./shopProductsClient";

// Server function to fetch initial products
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
    console.error('Error fetching products:', error);
    return { products: [], totalCount: 0 };
  }
}

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

// Server Component - FIXED: await params
export default async function ShopPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>; // params is a Promise
}) {
  // Await the params Promise to get the actual params object
  const { shopSlug } = await params;
  
  // Fetch both shop data and products on the server
  const shopData = await getShopData(shopSlug);
  
  if (!shopData) {
    return <div>Shop not found</div>;
  }
  
  const { products, totalCount } = await getInitialProducts(shopData.shopId.toString());
  
  return (
    <ShopProductsClient 
      initialProducts={products}
      initialTotalCount={totalCount}
      shopSlug={shopSlug}
      shopId={shopData.shopId.toString()}
      shopData={shopData} 
    />
  );
}