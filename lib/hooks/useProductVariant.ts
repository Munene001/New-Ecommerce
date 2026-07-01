// lib/hooks/useProductVariant.ts
import { useState, useMemo, useCallback } from 'react';
import { Product, ProductVariant } from '@/lib/types/product';

interface UseProductVariantReturn {
  attributeOptions: Record<string, string[]>;
  allVariants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  selectedPrice: number | null;
  selectedDiscountPrice: number | null;
  selectedStock: number | null;
  isInStock: boolean;
  hasVariants: boolean;
  selectVariant: (variant: ProductVariant) => void;
  clearSelection: () => void;
}

export function useProductVariant(product: Product): UseProductVariantReturn {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const attributeOptions = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return {};
    }

    const options: Record<string, Set<string>> = {};
    
    product.variants.forEach((variant) => {
      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!options[key]) {
          options[key] = new Set();
        }
        options[key].add(String(value));
      });
    });

    const result: Record<string, string[]> = {};
    Object.entries(options).forEach(([key, values]) => {
      result[key] = Array.from(values);
    });

    return result;
  }, [product.variants]);

  const selectVariant = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedVariant(null);
  }, []);

  return {
    attributeOptions,
    allVariants: product.variants || [],
    selectedVariant,
    selectedPrice: selectedVariant?.price ?? null,
    selectedDiscountPrice: selectedVariant?.discount_price ?? null,
    selectedStock: selectedVariant?.stock_quantity ?? null,
    isInStock: selectedVariant ? selectedVariant.stock_quantity > 0 : false,
    hasVariants: product.variants && product.variants.length > 0,
    selectVariant,
    clearSelection,
  };
}