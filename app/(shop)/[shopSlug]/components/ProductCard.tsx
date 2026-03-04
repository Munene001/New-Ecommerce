// app/(shop)/[shopSlug]/components/ProductCard.tsx
"use client";

import { useShop } from "../../ShopContext";
import { Product } from "@/lib/hooks/useProduct";
import ProductCardStandard from "./cardStandard";
import ProductCardMinimal from "./cardMinimal";
import ProductCardCompact from "./cardCompact";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { shop } = useShop();
  const cardStyle = shop?.productCardStyle || 'standard';
  
  switch(cardStyle) {
    case 'minimal':
      return <ProductCardMinimal product={product} shopSlug={shop?.shopSlug || ''} />;
    case 'compact':
      return <ProductCardCompact product={product} shopSlug={shop?.shopSlug || ''} />;
    case 'standard':
    default:
      return <ProductCardStandard product={product} shopSlug={shop?.shopSlug || ''} />;
  }
}