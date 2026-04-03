// app/(shop)/[shopSlug]/components/ProductCardCompact.tsx
"use client";

import Link from "next/link";
import { Product } from "@/lib/types/product";
import Image from "next/image";

interface Props {
  product: Product;
  shopSlug: string;
}

export default function ProductCardCompact({ product, shopSlug }: Props) {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  
  return (
    <Link 
      href={`/shop/${shopSlug}/product/${product.product_slug}`}
      className="flex gap-3 items-center border rounded-lg p-2 hover:shadow-sm transition group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
        <Image
          src={primaryImage?.image_path || '/placeholder.jpg'} 
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-600">
          {product.product_name}
        </h3>
        
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {product.discount_price ? (
            <>
              <span className="text-sm font-bold text-gray-900">
                Ksh {product.discount_price}
              </span>
              <span className="text-xs text-gray-400 line-through">
                Ksh {product.price}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-900">
              Ksh {product.price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}