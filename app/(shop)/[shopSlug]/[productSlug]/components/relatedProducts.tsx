'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCardStandard from '../../components/cardStandard';
import { Product } from '@/lib/types/product';

interface RelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  product_type: 'simple' | 'variable';
  effective_stock: number;
}

interface Props {
  products: RelatedProduct[];
  secondaryColor: string;
  shopSlug: string;
}

export default function RelatedProducts({ products, secondaryColor, shopSlug }: Props) {
  const slug = shopSlug;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: products.length >= 5,
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const updateCarouselState = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    updateCarouselState();
    setScrollSnaps(emblaApi.scrollSnapList());
    
    emblaApi.on('select', updateCarouselState);
    emblaApi.on('reInit', updateCarouselState);
    
    return () => {
      emblaApi.off('select', updateCarouselState);
      emblaApi.off('reInit', updateCarouselState);
    };
  }, [emblaApi, updateCarouselState]);

  if (products.length === 0) return null;

  const normalizedProducts: Product[] = products.map(product => {
    const stockQuantity = product.effective_stock;
    const productType = product.product_type || 'simple';
    const finalPrice = product.discount_price ?? product.price;
    
    return {
      product_id: product.product_id,
      shop_id: 0,
      shop_type: '',
      product_name: product.product_name,
      product_slug: product.product_slug,
      description: '',
      price: product.price,
      discount_price: product.discount_price,
      stock_quantity: stockQuantity,
      product_type: productType,
      status: 'published',
      attributes: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [],
      variants: [],
      display_price: {
        min: finalPrice,
        max: finalPrice,
        formatted: `${finalPrice}`,
        isRange: false,
        original_min: product.price,
        original_max: product.price,
        original_formatted: `${product.price}`,
        hasDiscount: product.discount_price !== null && product.discount_price < product.price
      },
      stock_info: {
        type: 'simple',
        total: stockQuantity,
        quantity: stockQuantity
      },
      in_stock: stockQuantity > 0,
      can_publish: false
    };
  });

  return (
    <div className="mt-8 relative">
      <h2 className="text-lg font-semibold mb-3" style={{ color: secondaryColor }}>
        Related Products
      </h2>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 sm:gap-5 px-2">
          {normalizedProducts.map(product => (
            <div
              key={product.product_id}
              className="flex-shrink-0 w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5"
            >
              <ProductCardStandard
                product={product}
                shopSlug={slug}
              />
            </div>
          ))}
        </div>
      </div>

      {prevBtnEnabled && (
        <button
          onClick={scrollPrev}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full shadow-lg p-2 hover:bg-gray-100 z-10"
          style={{ color: secondaryColor }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {nextBtnEnabled && (
        <button
          onClick={scrollNext}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full shadow-lg p-2 hover:bg-gray-100 z-10"
          style={{ color: secondaryColor }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 md:hidden">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === selectedIndex ? 'w-3 bg-gray-800' : 'bg-gray-300'
              }`}
              style={index === selectedIndex ? { backgroundColor: secondaryColor } : {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}