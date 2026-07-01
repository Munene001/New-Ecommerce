"use client";

import { useState } from "react";
import { X, Minus, Plus, ShoppingCart, ShoppingBag, ShoppingBasket } from "lucide-react";
import Button from "@/app/components/ui/button";
import { useCart } from "@/context/shopCartContext";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { Product } from "@/lib/types/product";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  secondaryColor: string;
}

interface CartIconProps {
  cartIcon?: string;
}

const CartIcon = ({ cartIcon }: CartIconProps) => {
  switch (cartIcon) {
    case "bag":
      return <ShoppingBag className="w-4 h-4" />;
    case "basket":
      return <ShoppingBasket className="w-4 h-4" />;
    default:
      return <ShoppingCart className="w-4 h-4" />;
  }
};

export default function VariantModal({ isOpen, onClose, product, secondaryColor }: Props) {
  const { shop } = useShop();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCartItemQuantity = (variantId: number) => {
    const item = items.find(i => i.variant_id === variantId);
    return item ? item.quantity : 0;
  };

  const getRemainingStock = (variant: typeof product.variants[0]) => {
    const cartQuantity = getCartItemQuantity(variant.variant_id);
    const remaining = variant.stock_quantity - cartQuantity;
    return remaining > 0 ? remaining : 0;
  };

  const handleDecrement = (variant: typeof product.variants[0]) => {
    const currentQuantity = getCartItemQuantity(variant.variant_id);
    if (currentQuantity > 1) {
      updateQuantity(product.product_id, currentQuantity - 1, variant.variant_id);
    } else if (currentQuantity === 1) {
      removeFromCart(product.product_id, variant.variant_id);
    }
  };

  const handleIncrement = (variant: typeof product.variants[0]) => {
    const currentQuantity = getCartItemQuantity(variant.variant_id);
    const remainingStock = getRemainingStock(variant);
    
    if (remainingStock <= 0) {
      showToast(`No more items available for this variant`, "error");
      return;
    }
    
    if (currentQuantity === 0) {
      addToCart({
        product_id: product.product_id,
        variant_id: variant.variant_id,
        product_name: product.product_name,
        variant_name: Object.values(variant.attributes).join(" / "),
        price: variant.price,
        discount_price: variant.discount_price,
      }, 1);
    } else {
      updateQuantity(product.product_id, currentQuantity + 1, variant.variant_id);
    }
  };

  const handleAddToCart = (variant: typeof product.variants[0]) => {
    const currentQuantity = getCartItemQuantity(variant.variant_id);
    const remainingStock = getRemainingStock(variant);
    
    if (remainingStock <= 0) {
      showToast(`No more items available for this variant`, "error");
      return;
    }
    
    if (currentQuantity === 0) {
      addToCart({
        product_id: product.product_id,
        variant_id: variant.variant_id,
        product_name: product.product_name,
        variant_name: Object.values(variant.attributes).join(" / "),
        price: variant.price,
        discount_price: variant.discount_price,
      }, 1);
    }
  };

  const getAttributeDisplay = (variant: typeof product.variants[0]) => {
    return Object.values(variant.attributes).join(" / ");
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl mx-1 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {product.product_name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(85vh-180px)] sm:max-h-[calc(90vh-180px)]">
          <div className="space-y-2 sm:space-y-3">
            {product.variants.map((variant) => {
              const isInStock = variant.stock_quantity > 0;
              const quantityInCart = getCartItemQuantity(variant.variant_id);
              const remainingStock = getRemainingStock(variant);
              const price = variant.discount_price || variant.price;
              const hasDiscount = variant.discount_price && variant.discount_price < variant.price;
              
              return (
                <div 
                  key={variant.variant_id}
                  className={`flex flex-col gap-2 p-3 sm:p-4 rounded-lg border transition-all
                    ${isInStock ? 'border-gray-200 hover:border-gray-300' : 'border-gray-100 bg-gray-50 opacity-60'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {getAttributeDisplay(variant)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">
                          KSh {formatPrice(price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-gray-400 line-through">
                            KSh {formatPrice(variant.price)}
                          </span>
                        )}
                        {isInStock ? (
                          <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                            {quantityInCart > 0 ? `${quantityInCart} in cart` : `${remainingStock} left`}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-between sm:justify-end">
                    {quantityInCart > 0 ? (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white flex-shrink-0">
                          <button
                            onClick={() => handleDecrement(variant)}
                            disabled={!isInStock}
                            className="px-2.5 sm:px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 sm:px-3 py-1.5 text-center w-8 sm:w-10 text-sm font-medium">
                            {quantityInCart}
                          </span>
                          <button
                            onClick={() => handleIncrement(variant)}
                            disabled={!isInStock || remainingStock <= 0}
                            className="px-2.5 sm:px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(variant)}
                          disabled={!isInStock || remainingStock <= 0}
                          className="flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 flex-1 sm:flex-none min-w-[80px] sm:min-w-[100px]"
                          style={{ 
                            backgroundColor: (isInStock && remainingStock > 0) ? secondaryColor : '#9CA3AF',
                          }}
                        >
                          <CartIcon cartIcon={shop?.cartIcon} />
                          <span>Add</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(variant)}
                        disabled={!isInStock}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 w-full sm:w-auto min-w-[120px] sm:min-w-[140px]"
                        style={{ 
                          backgroundColor: isInStock ? secondaryColor : '#9CA3AF',
                        }}
                      >
                        <CartIcon cartIcon={shop?.cartIcon} />
                        <span>Add to Cart</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            {items.some(i => i.variant_id) ? 'Use +/- to update quantity' : 'Select a variation and click Add to Cart'}
          </p>
        </div>
      </div>
    </div>
  );
}