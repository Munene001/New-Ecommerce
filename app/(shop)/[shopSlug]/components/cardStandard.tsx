// app/(shop)/[shopSlug]/components/ProductCardStandard.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from 'react';
import { Product } from "@/lib/hooks/useProduct";

interface Props {
  product: Product;
  shopSlug: string;
}

export default function ProductCardStandard({ product, shopSlug }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(210);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const images = product.images || [];
  
  // Fetch ALL images for this product using mode=all
  useEffect(() => {
    const fetchAllImages = async () => {
      try {
        // Use mode=all to get ALL images, not just primary
        const res = await fetch(`/api/shopowner/products/${product.product_id}/images?mode=all`);
        if (res.ok) {
          const imageData = await res.json();
          // Generate URLs for each image
          const urls = imageData.map((img: any) => 
            `/api/shopowner/products/${product.product_id}/images/primary?w=600`
          );
          setImageUrls(urls);
        }
      } catch (error) {
        console.error('Failed to fetch images:', error);
      }
    };
    
    if (product.product_id) {
      fetchAllImages();
    }
  }, [product.product_id]);
  
  // Use fetched image URLs or fallback to product.images
  const displayImages = imageUrls.length > 0 ? imageUrls : images.map(img => 
    `/api/shopowner/products/${product.product_id}/images/primary?w=600`
  );
  
  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Mouse move handler for desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (displayImages.length <= 1) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const sectionWidth = containerWidth / displayImages.length;
    const index = Math.floor(x / sectionWidth);
    
    if (index !== currentIndex && index < displayImages.length) {
      setCurrentIndex(index);
    }
  };
  
  // Touch handler for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (displayImages.length <= 1) return;
    
    const startX = e.touches[0].clientX;
    
    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endX = endEvent.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (diff > 50 && currentIndex < displayImages.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < -50 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd, { once: true });
  };
  
  // Handle indicator click
  const handleIndicatorClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex(index);
  };
  
  return (
    <div className="pl-7 md:pl-0">
      <Link
        href={`/shop/${shopSlug}/product/${product.product_slug}`}
        className="block h-[410px] w-[207px] flex flex-col justify-center no-underline text-inherit group"
      >
        <div
          ref={containerRef}
          className="relative w-full max-w-[210px] h-[310px] flex items-center justify-center border border-gray-300 overflow-hidden cursor-pointer bg-transparent"
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
        >
          <img
            src={displayImages.length > 0 ? displayImages[currentIndex] : '/placeholder.jpg'}
            alt={`${product.product_name} - ${currentIndex + 1}`}
            className="w-full h-full object-scale-down"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.jpg';
            }}
          />
          
          {/* Full-width rectangular indicators */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex gap-[2px] w-full">
              {displayImages.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 transition-colors cursor-pointer ${
                    i === currentIndex ? 'bg-black' : 'bg-white/60'
                  }`}
                  onClick={(e) => handleIndicatorClick(i, e)}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="text-[15px] font-normal leading-[18px] mt-2 font-['Jost']">
          {product.product_name}
        </div>
        
        <div className="flex flex-row gap-1.5 mt-2 leading-[22.5px] font-bold text-[17px]">
          {product.discount_price ? (
            <>
              <div className="text-gray-500 line-through text-[15px]">
                <i>
                  <span className="text-xs">Ksh</span>
                  {product.price}
                </i>
              </div>
              <div className="text-gray-900">
                <span className="text-sm">Ksh</span>
                {product.discount_price}
              </div>
            </>
          ) : (
            <div className="text-gray-900">
              <span className="text-sm">Ksh</span>
              {product.price}
            </div>
          )}
        </div>
      </Link>

      {/* Mobile responsive styles as Tailwind classes */}
      <style jsx>{`
        @media (max-width: 768px) {
          div > a {
            width: calc(50vw - 22px);
            height: 370px;
          }
          div > a > div:first-child {
            width: 98%;
            height: 65%;
          }
        }
      `}</style>
    </div>
  );
}