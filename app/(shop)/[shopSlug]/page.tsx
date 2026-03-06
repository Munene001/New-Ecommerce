// app/(shop)/[shopSlug]/page.tsx
"use client";

import { useShop } from "../ShopContext";
import { useProducts } from "@/lib/hooks/useProduct";
import ProductCard from "./components/ProductCard";
import { useEffect, useState } from "react";
import PageBar from "@/app/components/layout/pageBar";

export default function ShopPage() {
  const { shop } = useShop();
  const [initialProducts, setInitialProducts] = useState([]);
  
  console.log('1. Shop data:', shop);
  
  // Fetch initial products
  useEffect(() => {
    console.log('2. Shop ID:', shop?.shopId);
    
    if (!shop?.shopId) return;
    
    const fetchInitial = async () => {
      console.log('3. Fetching products for shop:', shop.shopId);
      try {
        const res = await fetch(`/api/shopowner/products?shopId=${shop.shopId}&limit=20`);
        const data = await res.json();
        console.log('4. Initial products response:', data);
        setInitialProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchInitial();
  }, [shop?.shopId]);
  
  const {
    products,
    loading,
    hasMore,
    loadMoreProducts,
  } = useProducts(initialProducts, shop?.shopId?.toString() || '');
  
  console.log('7. Products from hook:', products);
  console.log('8. Loading state:', loading);
  console.log('9. Initial products state:', initialProducts);
  
  if (!shop) return <div>Loading shop...</div>;
  
  // Determine grid columns based on card style
  const getGridClass = () => {
    if (shop.productCardStyle === 'compact') {
      return 'grid-cols-1';
    }
    return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-4';
  };
  
  return (
    <div>
    <PageBar breadcrumb="Shop" itemCount={products.length} />    
    </div>
  );
}