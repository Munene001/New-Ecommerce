'use client';

import { useEffect } from 'react';
import { useShop } from '@/app/(shop)/ShopContext';

export function TrackProductAnalytics({ productId }: { productId: number }) {
  const { trackEvent } = useShop();
  
 useEffect(() => {
    trackEvent('product_view', { product_id: productId });
  }, [productId]); 
  
  return null;
}