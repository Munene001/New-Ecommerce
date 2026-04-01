'use client';

import { useCallback, useEffect, useState } from 'react';

import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import ProductCardStandard from '../../components/cardStandard';

interface RelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
  in_stock?: boolean;
  description?: string;
  attributes?: Record<string, string | number | boolean | string[] | null>;
  images?: Array<{
    image_id: number;
    image_path: string;
    is_primary: boolean;
    created_at: string;
  }>;
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

  // Update state based on embla API
  const updateCarouselState = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  // Set up embla event listeners
  useEffect(() => {
    if (!emblaApi) return;
    
    // Initial state update - this is necessary to sync React state with the carousel
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateCarouselState();
    setScrollSnaps(emblaApi.scrollSnapList());
    
    // Set up event listeners
    emblaApi.on('select', updateCarouselState);
    emblaApi.on('reInit', updateCarouselState);
    
    // Cleanup
    return () => {
      emblaApi.off('select', updateCarouselState);
      emblaApi.off('reInit', updateCarouselState);
    };
  }, [emblaApi, updateCarouselState]);

  if (products.length === 0) return null;

  // Convert RelatedProduct to match Product type expected by ProductCardStandard
  const normalizedProducts = products.map(product => ({
    ...product,
    in_stock: true,
    description: '',
    attributes: {},
    images: [],
  }));

  return (
    <div className="mt-8 relative">
      <h2 className="text-lg font-semibold mb-3" style={{ color: secondaryColor }}>
        Related Products
      </h2>

      {/* Carousel viewport */}
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

      {/* Navigation Arrows - visible on md and up */}
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

      {/* Dots for mobile */}
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