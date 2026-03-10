// app/(shop)/[shopSlug]/page.tsx
import { Product } from "@/lib/types/product";
import ShopProductsClient from "./shopProductsClient";

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high';
interface PriceRange {
  min: number;
  max: number;
}

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

// Server Component
export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ 
    search?: string;
    categories?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    inStock?: string;
  }>;
}) {
  const { shopSlug } = await params;
  const { 
    search,
    categories,
    minPrice,
    maxPrice,
    sortBy,
    inStock 
  } = await searchParams;

  const shopData = await getShopData(shopSlug);
  
  if (!shopData) {
    return <div>Shop not found</div>;
  }
  
  const { products, totalCount } = await getInitialProducts(shopData.shopId.toString());

  // Parse initial filter values from URL
  const initialSearch = search || '';
  const initialCategories = categories ? categories.split(',') : [];
  const initialPriceRange = minPrice && maxPrice
    ? { min: parseInt(minPrice), max: parseInt(maxPrice) }
    : null;
  const initialSortBy = (sortBy as SortOption) || 'newest';
  const initialInStock = inStock === 'true';

  return (
    <ShopProductsClient 
      initialProducts={products}
      initialTotalCount={totalCount}
      shopSlug={shopSlug}
      shopId={shopData.shopId.toString()}
      shopData={shopData}
      initialSearch={initialSearch}
      initialCategories={initialCategories}
      initialPriceRange={initialPriceRange}
      initialSortBy={initialSortBy}
      initialInStock={initialInStock}
    />
  );
}