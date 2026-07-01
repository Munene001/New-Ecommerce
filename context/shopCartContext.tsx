"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "./toastContext";

export interface CartItem {
  product_id: number;
  variant_id?: number; // Optional - for variable products
  product_name: string;
  variant_name?: string; // For display (e.g., "Red / Large")
  price: number;
  discount_price: number | null;
  quantity: number;
  attributes?: Record<string, string>; // For display in cart
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: (silent?: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { shop, trackEvent } = useShop();
  const { shop, trackEvent } = useShop();
  const { showToast } = useToast();
  const shopId = shop?.shopId;
  const storageKey = shopId ? `cart-${shopId}` : null;

  const [items, setItems] = useState<CartItem[]>([]);
  const hasLoadedRef = useRef(false);

  const safeShowToast = (message: string, type: 'success' | 'error') => {
    queueMicrotask(() => {
      showToast(message, type);
    });
  };

  useEffect(() => {
    if (!storageKey || hasLoadedRef.current) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedItems = JSON.parse(stored);
        setItems(parsedItems);
        hasLoadedRef.current = true;
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    } else {
      setItems([]);
      hasLoadedRef.current = true;
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hasLoadedRef.current) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const price = i.discount_price ?? i.price;
    return sum + price * i.quantity;
  }, 0);

  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    trackEvent('add_to_cart', {
      product_id: item.product_id,
      variant_id: item.variant_id
    });
    
    setItems(prev => {
      // Check for existing item with same product_id AND variant_id
      const existing = prev.findIndex(i => 
        i.product_id === item.product_id && 
        i.variant_id === item.variant_id
      );
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += quantity;
        const displayName = item.variant_name 
          ? `${item.product_name} (${item.variant_name})` 
          : item.product_name;
        safeShowToast(`${displayName} quantity updated`, 'success');
        return updated;
      } else {
        const displayName = item.variant_name 
          ? `${item.product_name} (${item.variant_name})` 
          : item.product_name;
        safeShowToast(`${displayName} added to cart`, 'success');
        return [...prev, { ...item, quantity }];
      }
    });
  };

  const removeFromCart = (productId: number, variantId?: number) => {
    const item = items.find(i => 
      i.product_id === productId && 
      i.variant_id === variantId
    );
    setItems(prev => prev.filter(i => 
      !(i.product_id === productId && i.variant_id === variantId)
    ));
    if (item) {
      const displayName = item.variant_name 
        ? `${item.product_name} (${item.variant_name})` 
        : item.product_name;
      safeShowToast(`${displayName} removed from cart`, 'success');
    }
  };

  const updateQuantity = (productId: number, newQuantity: number, variantId?: number) => {
    setItems(prev => {
      const index = prev.findIndex(i => 
        i.product_id === productId && 
        i.variant_id === variantId
      );
      if (index === -1) return prev;

      const item = prev[index];
      
      // ← ADD THIS CHECK
      if (newQuantity > item.quantity && item.in_stock === false) {
        safeShowToast(`${item.product_name} is out of stock`, 'error');
        return prev;
      }

      if (newQuantity <= 0) {
        const filtered = prev.filter((_, i) => i !== index);
        const displayName = item.variant_name 
          ? `${item.product_name} (${item.variant_name})` 
          : item.product_name;
        safeShowToast(`${displayName} removed from cart`, 'success');
        return filtered;
      } else {
        const updated = [...prev];
        updated[index] = { ...item, quantity: newQuantity };
        return updated;
      }
    });
  };

  const clearCart = (silent: boolean = false) => {
    setItems([]);
    if (!silent) {
      safeShowToast("Cart cleared", 'success');
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
};