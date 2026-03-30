// app/(shop)/[shopSlug]/components/ProductCardStandard.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from 'react';
import { Product } from "@/lib/types/product";
import { Eye, ShoppingCart,ShoppingBag, ShoppingBasket } from "lucide-react";
import ButtonCart from "@/app/components/ui/buttonCart";
import { useCart } from '@/context/shopCartContext';
import { useShop } from "@/app/(shop)/ShopContext";

interface Props {
  product: Product;
  shopSlug: string;
}

export default function ProductCardStandard({ product, shopSlug }: Props) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart(); 
  const { shop } = useShop();

const CartIcon = () => {
  switch (shop?.cartIcon) {
    case 'bag':
      return <ShoppingBag className="w-4 h-4" />;
    case 'basket':
      return <ShoppingBasket className="w-4 h-4" />;
    default:
      return <ShoppingCart className="w-4 h-4" />;
  }
};

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent any parent link navigation
    e.stopPropagation();
    addToCart({
      product_id: product.product_id,
      product_name: product.product_name,
      price: product.price,
      discount_price: product.discount_price,
    }, 1); // default quantity 1
  };

  return (
    <div className="w-full font-[Poppins] bg-gray-50 p-2 rounded-sm flex flex-col h-full">
      {/* Image – clickable to product */}
      <Link
        href={`/${shopSlug}/${product.product_slug}`}
        className="block no-underline text-inherit group flex-shrink-0"
      >
        <div 
          ref={containerRef}
          className="relative w-full aspect-[245/266] max-w-[260px] flex items-center justify-center bg-gray-100 overflow-hidden box-border rounded-sm"
        >
          {/* Discount Badge */}
          {product.discount_price && discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-10 text-white text-xs font-bold font-[Poppins] px-2 py-1 bg-red-600">
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
      </Link>

      {/* Product details container - grows to fill space */}
      <div className="mt-4 flex flex-col flex-grow">
        {/* Top section with product details that can expand */}
        <div className="space-y-1 px-1 flex-grow">
          <Link
            href={`/${shopSlug}/${product.product_slug}`}
            className="no-underline text-inherit"
          >
            <h3 className="text-[15px] line-clamp-2 font-[Poppins] hover:underline">
              {product.product_name}
            </h3>
          </Link>

          <div className="flex flex-row mt-2 text-[16px] items-center gap-2 font-[Poppins] font-medium text-[#0F1F0F]">
            {product.discount_price ? (
              <>
                <span className="text-base">
                  <span className="">ksh</span> {formatPrice(product.discount_price)}
                </span>
                <span className="italic line-through  font-medium text-sm">
                   {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-base">
                <span className="">ksh</span> {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>

        {/* Cart button - fixed at bottom */}
        <div className="flex justify-center mt-8 mb-1  px-1">
          <ButtonCart
            onClick={handleAddToCart}
            className="flex flex-row gap-[6px] justify-between text-white items-center justify-center py-1 text-[14px]"
            style={{ backgroundColor: "var(--secondary)" }}
            disabled={!product.in_stock}
          >
            <span className="w-4 h-4 flex justify-center items-center animate-bounce" style={{ animationDuration: '2s' }}>
              <CartIcon />
            </span>
            <span>Add To Cart</span>
          </ButtonCart>
        </div>
      </div>
    </div>
  );
}