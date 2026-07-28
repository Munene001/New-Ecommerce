// app/(shop)/[shopSlug]/page.tsx
"use client";
import { useShop } from '../ShopContext';
import ShopProductsClient from "./shopProductsClient";

export default function ShopPage() {
  const { shop, loading, isExpired, isSuspended } = useShop();
  
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta"></div>
      </div>
    );
  }
  
 
  if (isExpired || isSuspended || !shop) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Shop not found</h2>
        </div>
      </div>
    );
  }
  
 
  return <ShopProductsClient />;
}