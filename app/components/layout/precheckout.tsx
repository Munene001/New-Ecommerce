// components/layout/precheckout.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/context/shopCartContext";
import { useRouter } from "next/navigation";
import { useShop } from "@/app/(shop)/ShopContext";
import { 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag,
  ChevronRight,
  Loader2
} from "lucide-react";

interface PreCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductImageMap {
  [productId: number]: string;
}

interface CartItem {
  product_id: number;
  product_name: string;
  price: number | string;
  discount_price: number | string | null;
  quantity: number;
}

export default function PreCheckoutModal({ isOpen, onClose }: PreCheckoutModalProps) {
  const { items, subtotal, totalItems, removeFromCart, updateQuantity } = useCart();
  const { shop } = useShop();
  const router = useRouter();
  const [productImages, setProductImages] = useState<ProductImageMap>({});
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});

  // Helper function to safely get price as number
  const getDisplayPrice = (item: CartItem) => {
    if (item.discount_price && !isNaN(Number(item.discount_price))) {
      return Number(item.discount_price);
    }
    return Number(item.price) || 0;
  };

  // Fetch primary image for each product
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

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
  }, [isOpen, items, productImages]);

  const handleQuantityChange = (productId: number, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    updateQuantity(productId, newQuantity);
  };

  const handleContinue = () => {
    onClose();
    router.push("/checkout");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer from right */}
      <div 
        className="fixed  b top-0 right-0 h-full w-[90%] pb-18 lg:pb-0 md:pb-0 md:w-[40%] sm:w-[80%] bg-gray-50 shadow-2xl z-50 animate-slide-left overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex bg-gray-50 justify-between items-center p-5 border-b sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-9 h-9 text-black" />
            <div>
              <h2 className="text-xl font-semibold text-black">
                Your Cart
              </h2>
              <p className="text-sm text-gray-500">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 pb-32 md:pb-32">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-300 mb-4">
                <ShoppingBag className="w-16 h-16 mx-auto" strokeWidth={1.5} />
              </div>
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={onClose}
                className=" font-medium inline-flex items-center gap-1" style={{ color: shop?.secondaryColor }}
              >
                Continue Shopping
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const displayPrice = getDisplayPrice(item);
                const originalPrice = Number(item.price) || 0;
                const hasDiscount = item.discount_price && !isNaN(Number(item.discount_price));
                
                return (
                  <div key={item.product_id} className="flex gap-4 py-4 border-b-black ">
                    {/* Product Image */}
                    <div className="relative w-20 h-20  bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {loadingImages[item.product_id] ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
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
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <ShoppingBag className="w-8 h-8 text-gray-300" strokeWidth={1} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium  text-gray-900 truncate">
                        {item.product_name}
                      </h3>
                      <div className="mt-1">
                        {hasDiscount ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold" style={{ color: shop?.secondaryColor }}>
                              KSh {displayPrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              KSh {originalPrice.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-gray-900">
                            KSh {displayPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity, -1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-medium text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity, 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="ml-2 text-red-500 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        KSh {(displayPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed Footer with Total and Buttons */}
        {items.length > 0 && (
          <div className="border-t bg-gray-50 sticky bottom-0">
            {/* Total Section */}
            <div className="p-5 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total</span>
                <span className="text-2xl font-bold" style={{ color: shop?.secondaryColor }}>
                  KSh {subtotal.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Buttons Section */}
            <div className="p-5 bg-gray-50">
              <button
                onClick={handleContinue}
                className="w-full py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: shop?.secondaryColor }}
              >
                Proceed to Checkout
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}