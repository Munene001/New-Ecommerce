// app/(shop)/[shopSlug]/components/ProductCardMinimal.tsx
"use client";

import Link from "next/link";
import { Product } from "@/lib/types/product";

interface Props {
  product: Product;
  shopSlug: string;
}

export default function ProductCardMinimal({ product, shopSlug }: Props) {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  
  return (
    <Link 
      href={`/shop/${shopSlug}/product/${product.product_slug}`}
      className="block group"
    >
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
        <img 
          src={primaryImage?.image_path || '/placeholder.jpg'} 
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {product.discount_price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Sale
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 text-center line-clamp-2">
        {product.product_name}
      </h3>
      
      <p className="mt-1 text-sm font-medium text-gray-900 text-center">
        Ksh {product.discount_price || product.price}
      </p>
    </Link>
  );
}