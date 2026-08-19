"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  is_published?: boolean;
  verified?: boolean;
  verification_error?: string;
  stock_quantity?: number;
}

interface CartVerificationResponse {
  products: Array<{
    product_id: number;
    price: number;
    discount_price: number | null;
    stock_quantity: number;
    in_stock: boolean;
    is_published: boolean;
  }>;
  variants: Array<{
    variant_id: number;
    product_id: number;
    price: number;
    discount_price: number | null;
    stock_quantity: number;
    in_stock: boolean;
    is_published: boolean;
  }>;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: (silent?: boolean) => void;
  totalItems: number;
  subtotal: number;
  verifyCart: (force?: boolean) => Promise<void>;
  isVerifying: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

// Helper: Identity check for cart items
const isSameItem = (item: CartItem, productId: number, variantId?: number) => {
  if (Number(item.product_id) !== Number(productId)) return false;
  if (variantId !== undefined || item.variant_id !== undefined) {
    return Number(item.variant_id) === Number(variantId);
  }
  return true;
};

const normalizeCartItem = (item: any): CartItem => ({
  product_id: Number(item.product_id),
  variant_id: item.variant_id ? Number(item.variant_id) : undefined,
  product_name: String(item.product_name || ''),
  variant_name: item.variant_name ? String(item.variant_name) : undefined,
  price: Number(item.price || 0),
  discount_price: item.discount_price !== null && item.discount_price !== undefined ? Number(item.discount_price) : null,
  quantity: Number(item.quantity || 0),
  attributes: item.attributes || undefined,
  in_stock: item.in_stock !== undefined ? Boolean(item.in_stock) : undefined,
  is_published: item.is_published !== undefined ? Boolean(item.is_published) : undefined,
  verified: item.verified !== undefined ? Boolean(item.verified) : false,
  verification_error: item.verification_error || undefined,
  stock_quantity: item.stock_quantity !== undefined ? Number(item.stock_quantity) : undefined,
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { shop, trackEvent } = useShop();
  const { showToast } = useToast();
  const shopId = shop?.shopId;
  const storageKey = shopId ? `cart-${shopId}` : null;
  const shopSlug = shop?.shopSlug;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const hasLoadedRef = useRef(false);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVerificationRef = useRef<number>(0);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const safeShowToast = useCallback((message: string, type: 'success' | 'error') => {
    queueMicrotask(() => showToast(message, type));
  }, [showToast]);

  const verifyCart = useCallback(async (force: boolean = false) => {
    if (!shopSlug) return;

    const currentItems = itemsRef.current;
    if (currentItems.length === 0) return;

    const now = Date.now();
    if (!force && (now - lastVerificationRef.current) < 3000) return;
    lastVerificationRef.current = now;

    setIsVerifying(true);

    try {
      const response = await fetch(`/api/shops/${shopSlug}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: currentItems.map(i => ({ product_id: i.product_id, variant_id: i.variant_id || null })),
        }),
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('Verification failed');

      const data: CartVerificationResponse = await response.json();
      const productMap = new Map(data.products.map(p => [p.product_id, p]));
      const variantMap = new Map(data.variants.map(v => [v.variant_id, v]));

      let hasStateChanges = false;
      let userNoticeableChanges = false;
      const removedNames: string[] = [];
      const updatedItems: CartItem[] = [];

      for (const item of currentItems) {
        const dbItem: any = item.variant_id ? variantMap.get(item.variant_id) : productMap.get(item.product_id);
        const displayName = `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}`;

        if (!dbItem || !dbItem.is_published || !dbItem.in_stock || Number(dbItem.stock_quantity) <= 0) {
          removedNames.push(displayName);
          hasStateChanges = true;
          userNoticeableChanges = true;
          continue;
        }

        const effectiveDbPrice = Number(dbItem.discount_price ?? dbItem.price);
        const currentEffectivePrice = Number(item.discount_price ?? item.price);
        const targetQuantity = Math.min(item.quantity, Number(dbItem.stock_quantity));

        // Check for actual user-impacting changes (price or forced quantity drops)
        if (
          targetQuantity !== item.quantity ||
          Math.abs(effectiveDbPrice - currentEffectivePrice) > 0.01
        ) {
          userNoticeableChanges = true;
        }

        // Check for state updates (including background stock_quantity synchronization)
        if (
          userNoticeableChanges ||
          item.stock_quantity === undefined ||
          Number(item.stock_quantity) !== Number(dbItem.stock_quantity) ||
          !item.verified
        ) {
          hasStateChanges = true;
        }

        updatedItems.push({
          ...item,
          quantity: targetQuantity,
          price: Number(dbItem.price),
          discount_price: dbItem.discount_price !== null && dbItem.discount_price !== undefined ? Number(dbItem.discount_price) : null,
          stock_quantity: Number(dbItem.stock_quantity),
          in_stock: true,
          is_published: true,
          verified: true,
        });
      }

      if (hasStateChanges) {
        setItems(updatedItems);
      }

      // Toast notifications based on actual impact
      if (removedNames.length > 0) {
        safeShowToast(`${removedNames.length} item(s) removed due to stock availability`, 'error');
      } else if (userNoticeableChanges) {
        safeShowToast('Cart updated with current prices and stock', 'error');
      }
    } catch (error) {
      if (force) safeShowToast('Failed to verify cart.', 'error');
    } finally {
      setIsVerifying(false);
    }
  }, [shopSlug, safeShowToast]);

  const scheduleVerification = useCallback(() => {
    if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
    verificationTimeoutRef.current = setTimeout(() => verifyCart(false), 2000);
  }, [verifyCart]);

  useEffect(() => {
    if (!storageKey || hasLoadedRef.current) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalized = Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
        setItems(normalized);
        hasLoadedRef.current = true;
        if (normalized.length > 0) setTimeout(() => verifyCart(true), 500);
      } catch {
        setItems([]);
        hasLoadedRef.current = true;
      }
    } else {
      hasLoadedRef.current = true;
    }
  }, [storageKey, verifyCart]);

  useEffect(() => {
    if (!storageKey || !hasLoadedRef.current) return;
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && itemsRef.current.length > 0) {
        verifyCart(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [verifyCart]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    const normalized = {
      ...item,
      product_id: Number(item.product_id),
      variant_id: item.variant_id ? Number(item.variant_id) : undefined,
      price: Number(item.price),
      discount_price: item.discount_price != null ? Number(item.discount_price) : null,
      stock_quantity: item.stock_quantity !== undefined ? Number(item.stock_quantity) : undefined,
    };

    trackEvent('add_to_cart', { product_id: normalized.product_id, variant_id: normalized.variant_id });

    setItems(prev => {
      const existingIdx = prev.findIndex(i => isSameItem(i, normalized.product_id, normalized.variant_id));
      const displayName = normalized.variant_name ? `${normalized.product_name} (${normalized.variant_name})` : normalized.product_name;

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + Number(quantity),
          verified: false,
        };
        safeShowToast(`${displayName} quantity updated`, 'success');
        return updated;
      }

      safeShowToast(`${displayName} added to cart`, 'success');
      return [...prev, { ...normalized, quantity: Number(quantity), verified: false, in_stock: true, is_published: true }];
    });

    scheduleVerification();
  }, [trackEvent, safeShowToast, scheduleVerification]);

  const removeFromCart = useCallback((productId: number, variantId?: number) => {
    setItems(prev => {
      const item = prev.find(i => isSameItem(i, productId, variantId));
      if (item) {
        const displayName = item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name;
        safeShowToast(`${displayName} removed from cart`, 'success');
      }
      return prev.filter(i => !isSameItem(i, productId, variantId));
    });
  }, [safeShowToast]);

  const updateQuantity = useCallback((productId: number, newQuantity: number, variantId?: number) => {
    setItems(prev => {
      const index = prev.findIndex(i => isSameItem(i, productId, variantId));
      if (index === -1) return prev;

      const item = prev[index];
      const quantity = Number(newQuantity);

      if (quantity <= 0) {
        safeShowToast(`${item.product_name} removed from cart`, 'success');
        return prev.filter((_, i) => i !== index);
      }

      const updated = [...prev];
      updated[index] = { ...item, quantity, verified: false };
      return updated;
    });

    scheduleVerification();
  }, [safeShowToast, scheduleVerification]);

  const clearCart = useCallback((silent: boolean = false) => {
    setItems([]);
    if (verificationTimeoutRef.current) clearTimeout(verificationTimeoutRef.current);
    if (!silent) safeShowToast("Cart cleared", 'success');
  }, [safeShowToast]);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (Number(i.discount_price ?? i.price) * Number(i.quantity)), 0), [items]);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      verifyCart,
      isVerifying,
    }}>
      {children}
    </CartContext.Provider>
  );
};