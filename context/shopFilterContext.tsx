// context/shopFilterContext.tsx
'use client';

import { createContext, useContext, useMemo } from 'react';
import { useShopProducts } from '@/lib/hooks/useProductShop';

type ShopFilterContextValue = ReturnType<typeof useShopProducts>;

export const ShopFilterContext = createContext<ShopFilterContextValue | null>(null);

export const useShopFilter = () => {
  const context = useContext(ShopFilterContext);
  if (!context) {
    throw new Error('useShopFilter must be used within a ShopFilterProvider');
  }
  return context;
};

export const ShopFilterProvider = ({
  children,
  ...hookProps
}: {
  children: React.ReactNode;
} & Parameters<typeof useShopProducts>[0]) => {
  const filterState = useShopProducts(hookProps);
  
  // ✅ Memoize the context value to avoid unnecessary renders
  const value = useMemo(() => filterState, [filterState]);

  return (
    <ShopFilterContext.Provider value={value}>
      {children}
    </ShopFilterContext.Provider>
  );
};