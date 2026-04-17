// context/shopCartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "./toastContext";

export interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  discount_price: number | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: (silent?: boolean) => void; // ← Add optional silent parameter
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
  const { shop } = useShop();
  const { showToast } = useToast();
  const shopId = shop?.shopId;
  const storageKey = shopId ? `cart-${shopId}` : null;

  const [items, setItems] = useState<CartItem[]>([]);
  const hasLoadedRef = useRef(false);

  // Helper to safely show toast after render
  const safeShowToast = (message: string, type: 'success' | 'error') => {
    queueMicrotask(() => {
      showToast(message, type);
    });
  };

  // Load cart from localStorage only once when storageKey is available
  useEffect(() => {
    if (!storageKey || hasLoadedRef.current) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedItems = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setItems(prev => {
      const existing = prev.findIndex(i => i.product_id === item.product_id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += quantity;
        safeShowToast(`${item.product_name} quantity updated`, 'success');
        return updated;
      } else {
        safeShowToast(`${item.product_name} added to cart`, 'success');
        return [...prev, { ...item, quantity }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    const item = items.find(i => i.product_id === productId);
    setItems(prev => prev.filter(i => i.product_id !== productId));
    if (item) {
      safeShowToast(`${item.product_name} removed from cart`, 'success');
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.product_id === productId);
      if (index === -1) return prev;

      const item = prev[index];
      if (newQuantity <= 0) {
        const filtered = prev.filter(i => i.product_id !== productId);
        safeShowToast(`${item.product_name} removed from cart`, 'success');
        return filtered;
      } else {
        const updated = [...prev];
        updated[index] = { ...item, quantity: newQuantity };
        safeShowToast(`${item.product_name} quantity updated`, 'success');
        return updated;
      }
    });
  };

  // Update clearCart to accept silent parameter
  const clearCart = (silent: boolean = false) => {
    setItems([]);
    // Only show toast if not silent
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