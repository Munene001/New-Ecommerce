'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingCart, X, Search, Trash2 } from 'lucide-react';
import { usePOS } from '@/lib/hooks/usePos';
import { useShop } from '@/app/(shopowner)/shopownerContext';
import { useCart } from '@/context/shopCartContext';
import { useToast } from '@/context/toastContext';
import { ProductTile } from './components/productTile';
import { POSProductCardSkeleton } from './components/posSkeleton';
import { useState, useEffect } from 'react';
import { usePosCheckout } from './hooks/usePosCheckout';
import { POSCheckoutModal } from './components/posCheckoutModal';

export default function PointOfSale() {
  const { shopId, shopSlug } = useShop();
  const { items, subtotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const { showToast } = useToast();

  const [shopData, setShopData] = useState<any>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const {
    filteredProducts,
    loading,
    search,
    setSearch,
    inStockOnly,
    setInStockOnly,
    refreshProducts,
    clearFilters,
  } = usePOS();

  useEffect(() => {
    if (shopId) {
      fetch(`/api/shops/${shopSlug}`)
        .then((res) => res.json())
        .then((data) => {
          setShopData(data);
          setLoadingShop(false);
        })
        .catch(() => setLoadingShop(false));
    }
  }, [shopId, shopSlug]);

  const checkout = usePosCheckout({
    shopId: shopId || 0,
    onSuccess: () => {
      setIsCartOpen(false);
      refreshProducts();
    },
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }
    checkout.openCheckout();
  };

  const getEffectivePrice = (item: any) => item.discount_price ?? item.price;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (loading || loadingShop) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <POSProductCardSkeleton key={i} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-black">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/${shopSlug}`}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </Link>
          <span className="text-sm font-medium text-black hidden sm:inline">
            {filteredProducts.length} products
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCartOpen(true)}
            className="lg:hidden relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-black" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm font-semibold border border-gray-300 rounded hover:bg-gray-100 text-black transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Products Column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <label className="hidden sm:flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-black">In Stock</span>
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <ProductTile
                  key={product.product_id}
                  product={product}
                  secondaryColor={shopData?.secondaryColor || '#3B82F6'}
                  cartIcon={shopData?.cartIcon || 'cart'}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12 text-black font-semibold text-base">
                No products match your filters
              </div>
            )}
          </div>
        </div>

        {/* Desktop Cart */}
        <div className="hidden lg:flex w-[30%] min-w-[280px] max-w-[400px] bg-white border-l border-gray-200 flex-col flex-shrink-0">
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-black" />
              <h2 className="font-bold text-sm text-black">Cart</h2>
              <span className="text-xs bg-gray-200 text-black font-semibold px-2 py-0.5 rounded-full">
                {totalItems} items
              </span>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => clearCart()}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center text-black py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-80 text-black" />
                <p className="text-sm font-semibold">Cart is empty</p>
                <p className="text-xs font-medium text-gray-800">Click products to add</p>
              </div>
            ) : (
              items.map((item) => {
                const effectivePrice = getEffectivePrice(item);
                const hasDiscount =
                  item.discount_price !== null &&
                  item.discount_price !== undefined &&
                  item.discount_price < item.price;

                return (
                  <div
                    key={`${item.product_id}-${item.variant_id || ''}`}
                    className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">
                        {item.product_name}
                        {item.variant_name && (
                          <span className="text-gray-800 text-xs font-semibold ml-1">
                            ({item.variant_name})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-green-700">
                          KES {formatPrice(effectivePrice)}
                        </p>
                        {hasDiscount && (
                          <p className="text-xs text-gray-700 line-through font-medium">
                            KES {formatPrice(item.price)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.product_id, item.quantity - 1, item.variant_id);
                          } else {
                            removeFromCart(item.product_id, item.variant_id);
                          }
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-gray-300 text-black font-bold rounded hover:bg-gray-400 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1, item.variant_id)
                        }
                        className="w-7 h-7 flex items-center justify-center bg-gray-300 text-black font-bold rounded hover:bg-gray-400 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id, item.variant_id)}
                      className="w-7 h-7 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-black">Subtotal</span>
              <span className="text-xl font-extrabold text-black">KES {formatPrice(subtotal)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  items.length > 0 ? shopData?.primaryColor || '#0FA965' : '#4B5563',
              }}
            >
              {items.length === 0 ? 'Cart Empty' : '💳 Checkout'}
            </button>

            <p className="text-xs font-semibold text-black text-center">
              {items.length} items · {totalItems} total units
            </p>
          </div>
        </div>

        {/* Mobile Cart Drawer */}
        <div
          className={`lg:hidden fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
            isCartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[380px] bg-white shadow-2xl flex flex-col">
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-black" />
                <h2 className="font-bold text-sm text-black">Cart</h2>
                <span className="text-xs bg-gray-200 text-black font-semibold px-2 py-0.5 rounded-full">
                  {totalItems} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={() => clearCart()}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center text-black py-8">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-80 text-black" />
                  <p className="text-sm font-semibold">Cart is empty</p>
                  <p className="text-xs font-medium text-gray-800">Click products to add</p>
                </div>
              ) : (
                items.map((item) => {
                  const effectivePrice = getEffectivePrice(item);
                  const hasDiscount =
                    item.discount_price !== null &&
                    item.discount_price !== undefined &&
                    item.discount_price < item.price;

                  return (
                    <div
                      key={`${item.product_id}-${item.variant_id || ''}`}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-black truncate">
                          {item.product_name}
                          {item.variant_name && (
                            <span className="text-gray-800 text-xs font-semibold ml-1">
                              ({item.variant_name})
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-green-700">
                            KES {formatPrice(effectivePrice)}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-gray-700 line-through font-medium">
                              KES {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.product_id, item.quantity - 1, item.variant_id);
                            } else {
                              removeFromCart(item.product_id, item.variant_id);
                            }
                          }}
                          className="w-7 h-7 flex items-center justify-center bg-gray-300 text-black font-bold rounded hover:bg-gray-400 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-black">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.quantity + 1, item.variant_id)
                          }
                          className="w-7 h-7 flex items-center justify-center bg-gray-300 text-black font-bold rounded hover:bg-gray-400 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id, item.variant_id)}
                        className="w-7 h-7 flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-black">Subtotal</span>
                <span className="text-xl font-extrabold text-black">KES {formatPrice(subtotal)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    items.length > 0 ? shopData?.primaryColor || '#0FA965' : '#4B5563',
                }}
              >
                {items.length === 0 ? 'Cart Empty' : '💳 Checkout'}
              </button>

              <p className="text-xs font-semibold text-black text-center">
                {items.length} items · {totalItems} total units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* POS Checkout Modal */}
      <POSCheckoutModal
        isOpen={checkout.isOpen}
        onClose={checkout.closeCheckout}
        subtotal={subtotal}
        paymentMethod={checkout.paymentMethod}
        setPaymentMethod={checkout.setPaymentMethod}
        customerPhone={checkout.customerPhone}
        setCustomerPhone={checkout.setCustomerPhone}
        amountTendered={checkout.amountTendered}
        setAmountTendered={checkout.setAmountTendered}
        changeDue={checkout.changeDue}
        isCashValid={checkout.isCashValid}
        isSubmitting={checkout.isSubmitting}
        isMpesaPushAvailable={checkout.isMpesaPushAvailable}
        activePaymentType={checkout.activePaymentType}
        pendingOrder={checkout.pendingOrder}
        completedOrder={checkout.completedOrder}
        onProcessPayment={checkout.processPayment}
        onPushSuccess={checkout.handlePushPaymentSuccess}
        primaryColor={shopData?.primaryColor || '#0FA965'}
      />
    </div>
  );
}