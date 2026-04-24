'use client';

import { useRecentlyViewed } from '@/context/recentlyViewed';
import { useShop } from '@/app/(shop)/ShopContext';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

interface Props {
  currentProductId: number;
  secondaryColor: string;
  variant?: 'desktop' | 'mobile';
}

export default function RecentlyViewed({ currentProductId, secondaryColor, variant = 'desktop' }: Props) {
  // All hooks at the top – unconditionally
  const { items } = useRecentlyViewed();
  const { shop } = useShop();
  const [emblaRef] = useEmblaCarousel({ align: 'start', loop: true }); // now unconditional

  // Filter out current product and limit to 5
  const filtered = items.filter(item => item.product_id !== currentProductId).slice(0, 5);

  if (filtered.length === 0) return null;

  // Desktop: vertical list (for sidebar)
  if (variant === 'desktop') {
    return (
      <div className="space-y-2">
        <h3 className="font-medium text-sm" style={{ color: secondaryColor }}>
          Recently Viewed
        </h3>
        {filtered.map(item => (
          <Link
            key={item.product_id}
            href={`/${shop?.shopSlug}/${item.product_slug}`}
            className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded transition"
          >
            <Image
              src={`/api/shopowner/products/${item.product_id}/images/primary?w=200`}
              alt={item.product_name}
              className="w-10 h-10 object-cover rounded"
              onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
              width={10}
              height={10}
              
            />
            <span className="text-xs line-clamp-2">{item.product_name}</span>
          </Link>
        ))}
      </div>
    );
  }

  // Mobile/Tablet: horizontal carousel
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-3" style={{ color: secondaryColor }}>
        Recently Viewed
      </h2>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {filtered.map(item => (
            <Link
              key={item.product_id}
              href={`/${shop?.shopSlug}/${item.product_slug}`}
              className="flex-shrink-0 w-36 md:w-44"
            >
              <div className="bg-white rounded-lg border hover:shadow transition p-2">
                <Image
                  src={`/api/shopowner/products/${item.product_id}/images/primary?w=200`}
                  alt={item.product_name}
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                  width={100}
                  height={32}
                />
                <p className="text-sm font-medium text-black mt-2 line-clamp-2">{item.product_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {item.discount_price ? (
                    <>
                      <span className="text-gray-900 text-sm">KSh {item.discount_price}</span>
                      <span className="text-gray-400 line-through text-xs">KSh {item.price}</span>
                    </>
                  ) : (
                    <span className="text-gray-900 text-sm">KSh {item.price}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}