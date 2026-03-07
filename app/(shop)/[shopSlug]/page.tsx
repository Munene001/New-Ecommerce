// app/(shop)/[shopSlug]/page.tsx
"use client";

import { useShop } from "../ShopContext";
import { useProducts } from "@/lib/hooks/useProduct";
import ProductCardStandard from "./components/cardStandard";
import { useEffect, useState } from "react";
import PageBar from "@/app/components/layout/pageBar";
import { ListFilterPlus } from 'lucide-react';
import Button from "@/app/components/ui/button";

// Simple skeleton component that matches the grid layout
const ProductCardSkeleton = () => (
  <div className="w-full font-[Poppins] animate-pulse">
    <div className="relative w-full aspect-[245/266] max-w-[260px] bg-gray-200 rounded-sm"></div>
    <div className="mt-2 px-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-end mt-5">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export default function ShopPage() {
  const { shop } = useShop();
  const [initialProducts, setInitialProducts] = useState([]);
  const [initialTotalCount, setInitialTotalCount] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState(true);
 
  // Fetch initial products
  useEffect(() => {
    if (!shop?.shopId) return;
    
    const fetchInitial = async () => {
      setInitialLoading(true);
      try {
        const res = await fetch(`/api/shopowner/products?shopId=${shop.shopId}&limit=20`);
        const data = await res.json();
        setInitialProducts(data.products || []);
        
        if (data.pagination) {
          setInitialTotalCount(data.pagination.totalCount);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchInitial();
  }, [shop?.shopId]);
  
  const {
    products,
    loading,
    hasMore,
    totalCount,
    loadMoreProducts,
  } = useProducts(
    initialProducts, 
    shop?.shopId?.toString() || '',
    initialTotalCount
  );
  
  if (!shop) return <div>Loading shop...</div>;
  
  return (
    <div>
      <PageBar breadcrumb="Shop" itemCount={totalCount || initialTotalCount} /> 
      
      {/* Filter bar - mobile only (below lg) */}
      <div className="lg:hidden px-4 py-4 font-[Poppins]">
        <div className="flex flex-row gap-2">
          <span><ListFilterPlus/></span> 
          <span className="md:text-[16px] text-[18px] font-semibold">Filter</span>
        </div>
      </div>
      
      {/* Main content with aside filter for lg+ */}
      <div className="px-4 pb-8 mt-4">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Aside Filter - Visible on lg and above */}
          <aside className="hidden lg:block lg:w-[260px] flex-shrink-0">
            <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-4">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ListFilterPlus size={20} />
                Filter
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Category</h3>
                  <div className="space-y-2">
                    {['Electronics', 'Fashion', 'Home', 'Beauty'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Price Range</h3>
                  <div className="space-y-2">
                    {['Under Ksh 1000', 'Ksh 1000-5000', 'Ksh 5000-10000', 'Above Ksh 10000'].map((range) => (
                      <label key={range} className="flex items-center gap-2">
                        <input type="radio" name="price" className="rounded-full" />
                        <span className="text-sm">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Rating</h3>
                  <div className="space-y-2">
                    {['4★ & above', '3★ & above', '2★ & above'].map((rating) => (
                      <label key={rating} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
          
          {/* Products Grid - Takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-5 gap-4">
              {initialLoading ? (
                // Show skeletons during initial load
                Array(8).fill(0).map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))
              ) : (
                // Show actual products
                products.map((product) => (
                  <ProductCardStandard
                    key={product.product_id}
                    product={product}
                    shopSlug={shop.shopSlug}
                  />
                ))
              )}
              
              {/* Show skeletons when loading more products */}
              {loading && !initialLoading && (
                Array(4).fill(0).map((_, index) => (
                  <ProductCardSkeleton key={`loading-more-${index}`} />
                ))
              )}
            </div>
            
            {/* Load more button */}
            {hasMore && !loading && !initialLoading && (
              <div className="text-center py-4 mt-8">
                <Button 
                  onClick={loadMoreProducts}
                  className="" 
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}