// app/(shop)/[shopSlug]/[productSlug]/components/ProductWrapper.tsx
"use client";

import { useState } from "react";
import ProductSidebar from "./productSideBar";
import VariantModal from "./variantModal";
import { Product } from "@/lib/types/product";

interface Props {
  product: Product;
  secondaryColor: string;
  shopSlug: string;
  initialWishlistStatus: boolean;
  isShopOwner: boolean;
}

export default function ProductWrapper({
  product,
  secondaryColor,
  shopSlug,
  initialWishlistStatus,
  isShopOwner,
}: Props) {
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  return (
    <>
      <ProductSidebar
        product={product}
        secondaryColor={secondaryColor}
        shopSlug={shopSlug}
        initialWishlistStatus={initialWishlistStatus}
        isShopOwner={isShopOwner}
        onOpenVariantModal={() => setIsVariantModalOpen(true)}
      />
      <VariantModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        product={product}
        secondaryColor={secondaryColor}
      />
    </>
  );
}