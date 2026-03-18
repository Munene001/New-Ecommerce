'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useShop } from '@/app/(shop)/ShopContext';
import ProductCardStandard from '../../components/cardStandard';

interface RelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  discount_price: number | null;
}

interface Props {
  products: RelatedProduct[];
  secondaryColor: string;
  shopSlug: string; // we need this for ProductCardStandard
}

export default function RelatedProducts({ products, secondaryColor, shopSlug }: Props) {
  // Use the passed shopSlug; no need for context fallback if it's always provided
  const slug = shopSlug;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: products.length >= 5,
    slidesToScroll: 1, // always scroll one slide at a time
    containScroll: 'trimSnaps', // ensures no extra space at ends
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (products.length === 0) return null;

  return (
    <div className="mt-8 relative">
      <h2 className="text-lg font-semibold mb-3" style={{ color: secondaryColor }}>
        Related Products
      </h2>

      {/* Carousel viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 sm:gap-5 px-2">
          {products.map(product => (
            <div
              key={product.product_id}
              className="flex-shrink-0 w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/5 "
            >
              <ProductCardStandard
                product={product as any} // ensure Product type matches
                shopSlug={slug!}
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