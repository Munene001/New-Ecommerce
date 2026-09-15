'use client';

import { useState, useEffect } from 'react';
import { POSProduct } from '@/lib/hooks/usePos';
import { useCart } from '@/context/shopCartContext';
import VariantModal from '@/app/(shop)/[shopSlug]/[productSlug]/components/variantModal';
import Image from 'next/image';

interface ProductTileProps {
  product: POSProduct;
  secondaryColor?: string;
  cartIcon?: string;
}

export function ProductTile({ 
  product, 
  secondaryColor = '#3B82F6',
  cartIcon = 'cart'
}: ProductTileProps) {
  const { addToCart } = useCart();
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  const isVariable = product.product_type === 'variable';
  const isInStock = product.in_stock;

  const getDisplayPrice = () => {
    if (isVariable) {
      const minPrice = product.display_price?.min || 0;
      const maxPrice = product.display_price?.max || 0;
      const formatted = product.display_price?.formatted || '0';
      
      return {
        display: formatted,
        hasDiscount: false,
        originalPrice: null,
        isRange: minPrice !== maxPrice,
        minPrice: minPrice,
        maxPrice: maxPrice,
        displayRaw: formatted,
      };
    }
    
    const hasDiscount = product.discount_price !== null && 
                        product.discount_price !== undefined && 
                        product.discount_price < product.price;
    
    return {
      display: product.discount_price ?? product.price,
      hasDiscount: hasDiscount,
      originalPrice: hasDiscount ? product.price : null,
      isRange: false,
      minPrice: null,
      maxPrice: null,
      displayRaw: null,
    };
  };

  const priceInfo = getDisplayPrice();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  useEffect(() => {
    if (product.product_id) {
      const primaryImage = product.images?.find((img: any) => img.is_primary === true);
      const versionParam = primaryImage?.updated_at || Date.now();
      
      const url = `/api/shopowner/products/${product.product_id}/images/primary?w=200&v=${versionParam}`;
      setImageUrl(url);
      setImageError(false);
    }
  }, [product.product_id, product.images]);

  const handleClick = () => {
    if (isVariable) {
      setShowVariantModal(true);
    } else {
      addToCart({
        product_id: product.product_id,
        product_name: product.product_name,
        price: product.price,
        discount_price: product.discount_price,
        stock_quantity: product.stock_quantity,
      }, 1);
    }
  };

  const finalImageUrl = imageError || !imageUrl ? '' : imageUrl;

  return (
    <>
      <div
        className={`bg-white border-2 border-gray-200 rounded-lg p-2 cursor-pointer hover:shadow-md hover:border-gray-400 transition-all ${
          !isInStock ? 'opacity-50' : ''
        }`}
        onClick={handleClick}
      >
        <div className="aspect-square bg-gray-100 rounded-md mb-1.5 overflow-hidden relative">
          {finalImageUrl ? (
            <Image
              key={`pos-image-${product.product_id}`}
              src={finalImageUrl}
              alt={product.product_name}
              className="object-cover"
              fill
              sizes="200px"
              onError={() => setImageError(true)}
              unoptimized={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-black font-semibold text-xs">
              No img
            </div>
          )}
        </div>

        <p className="text-xs font-bold text-black truncate">{product.product_name}</p>

        <div className="flex items-center gap-1.5 mt-0.5">
          {isVariable ? (
            <p className="text-sm font-extrabold text-green-700">
              KES {priceInfo.display}
            </p>
          ) : (
            <>
              <p className="text-sm font-extrabold text-green-700">
                KES {formatPrice(Number(priceInfo.display))}
              </p>
              {priceInfo.hasDiscount && priceInfo.originalPrice && (
                <p className="text-[10px] text-gray-700 font-semibold line-through">
                  KES {formatPrice(priceInfo.originalPrice)}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-[10px] font-bold ${isInStock ? 'text-green-800' : 'text-red-600'}`}>
            {isVariable 
              ? `${product.stock_info?.total || 0} in stock`
              : isInStock ? `${product.stock_quantity} in stock` : 'Out of stock'
            }
          </span>
          {isVariable && (
            <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded-full">
              {product.variants.length}
            </span>
          )}
        </div>
      </div>

      {isVariable && (
        <VariantModal
          isOpen={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          product={product as any}
          secondaryColor={secondaryColor}
          cartIcon={cartIcon}
        />
      )}
    </>
  );
}