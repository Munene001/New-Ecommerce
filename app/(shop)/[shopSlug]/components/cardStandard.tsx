// app/(shop)/[shopSlug]/components/ProductCardStandard.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from 'react';
import { Product } from "@/lib/types/product";
import ButtonNav from "@/app/components/ui/buttonNav";
import { Eye, ShoppingCart } from "lucide-react";
import ButtonCart from "@/app/components/ui/buttonCart";

interface Props {
  product: Product;
  shopSlug: string;
}

export default function ProductCardStandard({ product, shopSlug }: Props) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Format price with commas and no decimals
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Calculate discount percentage
  const calculateDiscountPercentage = () => {
    if (!product.discount_price || !product.price) return 0;
    const discount = ((product.price - product.discount_price) / product.price) * 100;
    return Math.round(discount);
  };
  
  // Fetch primary image with appropriate size
  useEffect(() => {
    const fetchPrimaryImage = async () => {
      try {
       
        const url = `/api/shopowner/products/${product.product_id}/images/primary?w=300`;
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to fetch image:', error);
        setImageUrl('/placeholder.jpg');
      }
    };
    
    if (product.product_id) {
      fetchPrimaryImage();
    }
  }, [product.product_id]);

  const discountPercentage = calculateDiscountPercentage();

  return (
    <div className="w-full font-[Poppins]">
      <Link
        href={`/shop/${shopSlug}/product/${product.product_slug}`}
        className="block no-underline text-inherit group border border-gray-300/20 "
      >
        {/* Image container with fixed aspect ratio */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-[245/266] max-w-[260px] flex items-center justify-center bg-gray-100 overflow-hidden box-border rounded-sm"
        >
          {/* Discount Badge - Absolute positioned at top of image */}
          {product.discount_price && discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-10  text-white text-xs font-bold font-[Poppins] px-2 py-1  bg-green-700" >
              -{discountPercentage}% 
            </div>
          )}
          
          <img
            src={imageUrl || '/placeholder.jpg'}
            alt={product.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.jpg';
            }}
          />
        </div>
        
        {/* Product details */}
        <div className="mt-4  pb-2 space-y-1 px-1 ">
        
          <h3 className="text-[16px] font-medium line-clamp-2 font-[Poppins]"  >
            {product.product_name}
          </h3>
          
          <div className="flex flex-row items-center gap-2 font-[Poppins]">
            {product.discount_price ? (
              <>
                <span className="text-gray-900 text-base">
                  <span className="text-gray-900 text-xs">ksh</span> {formatPrice(product.discount_price)}
                </span>
                <span className="text-gray-400 italic line-through text-sm">
                  <span className="text-gray-400 text-xs">ksh</span> {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-gray-900 text-base">
                <span className="text-gray-900 text-xs">ksh</span> {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div className="flex justify-end md:mt-5 mt-[10px]">
            <ButtonCart className="flex flex-row gap-[6px] justify-between text-white items-center justify-center py-1 text-[14px]" style={{ backgroundColor: "var(--secondary)" }}> 
              <span className="w-4 h-4 flex justify-center items-center animate-bounce"   style={{ animationDuration: '2s' }}
              ><ShoppingCart/></span>
              <span >Cart</span>
            </ButtonCart>
          </div>
        
        </div>
      </Link>
    </div>
  );
}