"use client";

import { useState } from "react";
import MobileProductBar from "./mobileProductBar";
import VariantModal from "./variantModal";
import { Product } from "@/lib/types/product";

interface Props {
  product: Product;
  secondaryColor: string;
}

export default function MobileProductWrapper({ product, secondaryColor }: Props) {
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  return (
    <>
      <MobileProductBar
        productId={product.product_id}
        productName={product.product_name}
        price={product.price}
        discountPrice={product.discount_price}
        secondaryColor={secondaryColor}
        stockQuantity={product.stock_quantity}
        hasVariants={product.product_type === 'variable'}
        onOpenVariantModal={() => setIsVariantModalOpen(true)}
        in_stock={product.in_stock} // ✅ ADD THIS - pass the in_stock prop
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