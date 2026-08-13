"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "./toastContext";

export interface CartItem {
  product_id: number;
  variant_id?: number;
  product_name: string;
  variant_name?: string;
  price: number;
  discount_price: number | null;
  quantity: number;
  attributes?: Record<string, string>;
  in_stock?: boolean;
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

// ✅ NEW: Helper to normalize cart items
const normalizeCartItem = (item: any): CartItem => ({
  product_id: Number(item.product_id),
  variant_id: item.variant_id ? Number(item.variant_id) : undefined,
  product_name: String(item.product_name || ''),
  variant_name: item.variant_name ? String(item.variant_name) : undefined,
  price: Number(item.price || 0),
  discount_price: item.discount_price !== null && item.discount_price !== undefined 
    ? Number(item.discount_price) 
    : null,
  quantity: Number(item.quantity || 0),
  attributes: item.attributes || undefined,
  in_stock: item.in_stock !== undefined ? Boolean(item.in_stock) : undefined,
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
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

  // ✅ FIX: Normalize data when loading from localStorage
  useEffect(() => {
    if (!storageKey || hasLoadedRef.current) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedItems = JSON.parse(stored);
        // ✅ CRITICAL: Normalize all IDs and numbers
        const normalizedItems = Array.isArray(parsedItems) 
          ? parsedItems.map(normalizeCartItem)
          : [];
        setItems(normalizedItems);
        hasLoadedRef.current = true;
      } catch (e) {
        console.error("Failed to parse cart", e);
        setItems([]);
        hasLoadedRef.current = true;
      }
    } else {
      setItems([]);
      hasLoadedRef.current = true;
    }
  }, [storageKey]);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!storageKey || !hasLoadedRef.current) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const price = i.discount_price ?? i.price;
    return sum + (Number(price) * Number(i.quantity));
  }, 0);

  // ✅ FIX: Normalize item before adding to cart
  const addToCart = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    // ✅ Ensure all IDs are numbers
    const normalizedItem: Omit<CartItem, "quantity"> = {
      ...item,
      product_id: Number(item.product_id),
      variant_id: item.variant_id ? Number(item.variant_id) : undefined,
      price: Number(item.price),
      discount_price: item.discount_price !== null && item.discount_price !== undefined 
        ? Number(item.discount_price) 
        : null,
    };

    trackEvent('add_to_cart', {
      product_id: normalizedItem.product_id,
      variant_id: normalizedItem.variant_id
    });
    
    setItems(prev => {
      // ✅ Use Number() for safe comparison
      const existing = prev.findIndex(i => 
        Number(i.product_id) === Number(normalizedItem.product_id) && 
        (i.variant_id !== undefined && normalizedItem.variant_id !== undefined
          ? Number(i.variant_id) === Number(normalizedItem.variant_id)
          : i.variant_id === normalizedItem.variant_id)
      );
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += Number(quantity);
        const displayName = normalizedItem.variant_name 
          ? `${normalizedItem.product_name} (${normalizedItem.variant_name})` 
          : normalizedItem.product_name;
        safeShowToast(`${displayName} quantity updated`, 'success');
        return updated;
      } else {
        const displayName = normalizedItem.variant_name 
          ? `${normalizedItem.product_name} (${normalizedItem.variant_name})` 
          : normalizedItem.product_name;
        safeShowToast(`${displayName} added to cart`, 'success');
        return [...prev, { ...normalizedItem, quantity: Number(quantity) }];
      }
    });
  };

  // ✅ FIX: Use Number() for safe comparison
  const removeFromCart = (productId: number, variantId?: number) => {
    const normalizedProductId = Number(productId);
    const normalizedVariantId = variantId !== undefined ? Number(variantId) : undefined;
    
    const item = items.find(i => 
      Number(i.product_id) === normalizedProductId && 
      (i.variant_id !== undefined && normalizedVariantId !== undefined
        ? Number(i.variant_id) === normalizedVariantId
        : i.variant_id === normalizedVariantId)
    );
    
    setItems(prev => prev.filter(i => 
      !(Number(i.product_id) === normalizedProductId && 
        (i.variant_id !== undefined && normalizedVariantId !== undefined
          ? Number(i.variant_id) === normalizedVariantId
          : i.variant_id === normalizedVariantId))
    ));
    
    if (item) {
      const displayName = item.variant_name 
        ? `${item.product_name} (${item.variant_name})` 
        : item.product_name;
      safeShowToast(`${displayName} removed from cart`, 'success');
    }
  };

  // ✅ FIX: Use Number() for safe comparison
  const updateQuantity = (productId: number, newQuantity: number, variantId?: number) => {
    const normalizedProductId = Number(productId);
    const normalizedVariantId = variantId !== undefined ? Number(variantId) : undefined;
    const normalizedNewQuantity = Number(newQuantity);
    
    setItems(prev => {
      const index = prev.findIndex(i => 
        Number(i.product_id) === normalizedProductId && 
        (i.variant_id !== undefined && normalizedVariantId !== undefined
          ? Number(i.variant_id) === normalizedVariantId
          : i.variant_id === normalizedVariantId)
      );
      
      if (index === -1) return prev;

      const item = prev[index];
      
      // Check stock before increasing quantity
      if (normalizedNewQuantity > item.quantity && item.in_stock === false) {
        safeShowToast(`${item.product_name} is out of stock`, 'error');
        return prev;
      }

      if (normalizedNewQuantity <= 0) {
        const filtered = prev.filter((_, i) => i !== index);
        const displayName = item.variant_name 
          ? `${item.product_name} (${item.variant_name})` 
          : item.product_name;
        safeShowToast(`${displayName} removed from cart`, 'success');
        return filtered;
      } else {
        const updated = [...prev];
        updated[index] = { ...item, quantity: normalizedNewQuantity };
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