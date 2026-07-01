"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from "@/lib/types/product";
import { ShoppingCart, ShoppingBag, ShoppingBasket } from "lucide-react";
import ButtonCart from "@/app/components/ui/buttonCart";
import { useCart } from '@/context/shopCartContext';
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from '@/context/toastContext';
import Image from "next/image";

interface Props {
  product: Product;
  shopSlug: string;
}

interface CartIconProps {
  cartIcon?: string;
}

const CartIcon = ({ cartIcon }: CartIconProps) => {
  switch (cartIcon) {
    case 'bag':
      return <ShoppingBag className="w-4 h-4" />;
    case 'basket':
      return <ShoppingBasket className="w-4 h-4" />;
    default:
      return <ShoppingCart className="w-4 h-4" />;
  }
};

export default function ProductCardStandard({ product, shopSlug }: Props) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart(); 
  const { shop } = useShop();
  const { showToast } = useToast();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const getDisplayPrice = () => {
    if (product.product_type === 'variable') {
      const priceInfo = product.display_price;
      return {
        isVariable: true,
        display: priceInfo.formatted,
        min: priceInfo.min,
        max: priceInfo.max,
        isRange: priceInfo.isRange,
        hasDiscount: priceInfo.hasDiscount,
        originalDisplay: priceInfo.original_formatted,
        originalPrice: 0
      };
    }
    
    const price = product.discount_price || product.price;
    const hasDiscount = !!product.discount_price && product.discount_price < product.price;
    return {
      isVariable: false,
      display: formatPrice(price),
      price: price,
      hasDiscount: hasDiscount,
      originalPrice: product.price,
      originalDisplay: hasDiscount ? formatPrice(product.price) : null
    };
  };

  const isInStock = () => {
    if (product.product_type === 'variable') {
      return product.stock_info.total > 0;
    }
    return product.stock_quantity > 0;
  };

  const getDiscountPercentage = () => {
    if (product.product_type === 'variable') return 0;
    if (!product.discount_price || !product.price) return 0;
    const discount = ((product.price - product.discount_price) / product.price) * 100;
    return Math.round(discount);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.product_type === 'variable') {
      router.push(`/${shopSlug}/${product.product_slug}`);
    } else {
      addToCart({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        discount_price: product.discount_price,
      }, 1);
    }
  };

  const getButtonText = () => {
    if (product.product_type === 'variable') {
      return 'Select Options';
    }
    return 'Add To Cart';
  };

  const isButtonDisabled = () => {
    return !isInStock();
  };

  useEffect(() => {
    const fetchPrimaryImage = async () => {
      try {
        const url = `/api/shopowner/products/${product.product_id}/images/primary?w=300`;
        setImageUrl(url);
        setImageError(false);
      } catch (error) {
        console.error('Failed to fetch image:', error);
        setImageError(true);
      }
    };
    
    if (product.product_id) {
      fetchPrimaryImage();
    }
  }, [product.product_id]);

  const finalImageUrl = imageError || !imageUrl ? '/placeholder.jpg' : imageUrl;
  const displayPrice = getDisplayPrice();
  const inStock = isInStock();
  const discountPercentage = getDiscountPercentage();

  return (
    <div className="w-full font-[Poppins] bg-gray-50 p-2 rounded-sm flex flex-col h-full">
      <Link
        href={`/${shopSlug}/${product.product_slug}`}
        className="block no-underline text-inherit group flex-shrink-0"
      >
        <div 
          ref={containerRef}
          className="relative w-full aspect-[245/266] max-w-[260px] flex items-center justify-center bg-gray-100 overflow-hidden box-border rounded-sm"
        >
          {/* ✅ Only show discount badge for simple products */}
          {!displayPrice.isVariable && displayPrice.hasDiscount && discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-10 text-white text-xs font-bold font-[Poppins] px-2 py-1 bg-red-600">
              -{discountPercentage}% 
            </div>
          )}

          <div className="relative w-full h-full">
            <Image
              src={finalImageUrl}
              alt={product.product_name}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              priority={false}
            />
          </div>
        </div>
      </Link>

      <div className="mt-4 flex flex-col flex-grow">
        <div className="space-y-1 px-1 flex-grow">
          <Link
            href={`/${shopSlug}/${product.product_slug}`}
            className="no-underline text-inherit"
          >
            <h3 className="text-[15px] text-black line-clamp-2 font-medium font-[Poppins] hover:underline">
              {product.product_name}
            </h3>
          </Link>

          <div className="flex flex-row mt-1 text-[14px] items-center gap-2 font-[inter] font-semibold text-[#034810]">
            <span className="text-base text-[#034810] font-semibold">
              ksh {displayPrice.display}
            </span>
            {displayPrice.hasDiscount && displayPrice.originalDisplay && (
              <span className="italic line-through text-sm text-gray-400">
                ksh {displayPrice.originalDisplay}
              </span>
            )}
          </div>

          {!inStock && (
            <div className="text-xs text-red-500 font-medium mt-1">
              Out of Stock
            </div>
          )}
        </div>

        <div className="mt-4 mb-1 w-full md:flex md:justify-center text-white">
          <ButtonCart
            onClick={handleButtonClick}
            className="flex flex-row gap-[6px] justify-center items-center py-1 text-[14px] w-full md:w-[80%]"
            style={{ 
              backgroundColor: isButtonDisabled() ? "#9CA3AF" : "var(--secondary)"
            }}
            disabled={isButtonDisabled()}
          >
            <span className="w-4 h-4 flex justify-center items-center animate-bounce" style={{ animationDuration: '2s' }}>
              <CartIcon cartIcon={shop?.cartIcon} />
            </span>
            <span>{getButtonText()}</span>
          </ButtonCart>
        </div>
      </div>
    </div>
  );
}