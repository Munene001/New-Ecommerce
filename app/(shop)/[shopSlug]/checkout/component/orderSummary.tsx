// app/(shop)/[shopSlug]/checkout/components/orderSummary.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingBag, Truck, Lock, ArrowRight, Package, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/context/shopCartContext";

interface CartItem {
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  price: number;
  discount_price: number | null;
  quantity: number;
  attributes?: Record<string, string>;
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  onContinue: () => void;
  isSubmitting: boolean;
  secondaryColor?: string;
}

interface ProductImageMap {
  [productId: number]: string;
}

export default function OrderSummary({
  items,
  subtotal,
  totalItems,
  onContinue,
  isSubmitting,
  secondaryColor,
}: OrderSummaryProps) {
  const { removeFromCart, updateQuantity } = useCart();
  const [productImages, setProductImages] = useState<ProductImageMap>({});
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});
  
  const getDisplayPrice = (item: CartItem) => {
    if (item.discount_price && !isNaN(Number(item.discount_price))) {
      return Number(item.discount_price);
    }
    return Number(item.price) || 0;
  };

  const getItemKey = (item: CartItem) => {
    return item.variant_id ? `${item.product_id}-${item.variant_id}` : `${item.product_id}`;
  };

  useEffect(() => {
    if (items.length === 0) return;

    const fetchImages = async () => {
      for (const item of items) {
        if (productImages[item.product_id]) continue;
        
        setLoadingImages(prev => ({ ...prev, [item.product_id]: true }));
        
        try {
          const url = `/api/shopowner/products/${item.product_id}/images/primary?w=200`;
          setProductImages(prev => ({ ...prev, [item.product_id]: url }));
        } catch (error) {
          console.error(`Failed to fetch image for product ${item.product_id}:`, error);
          setProductImages(prev => ({ ...prev, [item.product_id]: '/placeholder.jpg' }));
        } finally {
          setLoadingImages(prev => ({ ...prev, [item.product_id]: false }));
        }
      }
    };

    fetchImages();
  }, [items, productImages]);

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    updateQuantity(item.product_id, newQuantity, item.variant_id);
  };

  const handleRemove = (item: CartItem) => {
    removeFromCart(item.product_id, item.variant_id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6 sticky top-6">
      <div className="flex items-center justify-between border-b border-gray-200 bg-[url('/assets/maze-speciallll.svg')] bg-repeat bg-[length:400px_auto] pb-4 mb-4">
        <h2 className="text-xl font-semibold text-black flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" style={{ color: secondaryColor }} />
          Order Summary
        </h2>
        <span className="text-sm text-gray-500">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto space-y-3 mb-4 pr-1">
        {items.map((item) => {
          const displayPrice = getDisplayPrice(item);
          const originalPrice = Number(item.price);
          const hasDiscount = item.discount_price && !isNaN(Number(item.discount_price));
          const itemKey = getItemKey(item);
          
          return (
            <div key={itemKey} className="flex gap-3 py-3 border-b border-gray-100">
              <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {loadingImages[item.product_id] ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                ) : productImages[item.product_id] ? (
                  <Image
                    src={productImages[item.product_id]}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.jpg';
                    }}
                    sizes="70px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black text-sm truncate">{item.product_name}</p>
                {item.variant_name && (
                  <p className="text-xs text-gray-500 truncate">{item.variant_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {hasDiscount ? (
                    <>
                      <span className="text-sm font-semibold" style={{ color: secondaryColor }}>
                        KSh {displayPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        KSh {originalPrice.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-black">
                      KSh {displayPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-black">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-medium text-black text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    className="ml-1 text-red-500 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-black text-sm">
                  KSh {(displayPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-black">
          <span>Subtotal</span>
          <span>KSh {subtotal.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-yellow-600">
          <span>Delivery Fee</span>
          <span className="text-sm">To be confirmed</span>
        </div>
        
        <div className="border-t border-dashed border-gray-200 pt-3 mt-2">
          <div className="flex justify-between font-bold text-black text-lg">
            <span>Total</span>
            <span style={{ color: secondaryColor }}>KSh {subtotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-800 mt-1 text-center">
            * Delivery fee will be confirmed by seller after order
          </p>
        </div>
      </div>
      
      <button
        onClick={onContinue}
        disabled={isSubmitting}
        className="w-full mt-5 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: secondaryColor }}
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Place Order
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      
    
    </div>
  );
}