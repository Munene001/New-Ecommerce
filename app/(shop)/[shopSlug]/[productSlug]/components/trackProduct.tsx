// components/product/TrackProductView.tsx
"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/context/recentlyViewed";

interface Props {
  product: {
    product_id: number;
    product_name: string;
    product_slug: string;
    price: number;
    discount_price: number | null;
  };
}

export default function TrackProductView({ product }: Props) {
  const { addViewedProduct } = useRecentlyViewed();

  useEffect(() => {
    addViewedProduct({
      product_id: product.product_id,
      product_name: product.product_name,
      product_slug: product.product_slug,
      price: product.price,
      discount_price: product.discount_price,
    });
  }, [
    product.product_id,
    product.product_name,
    product.product_slug,
    product.price,
    product.discount_price,
    addViewedProduct
  ]); // includes all product properties used in the effect

  return null; // This component renders nothing
}