"use client";

import {
  Heart,
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  Minus,
  Plus,
  Share2,
} from "lucide-react";
import Button from "@/app/components/ui/button";
import { useCart } from "@/context/shopCartContext";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authcontext";
import { useState } from "react";
import { useProductVariant } from "@/lib/hooks/useProductVariant";
import { Product as ProductType } from "@/lib/types/product";

interface Props {
  product: ProductType;
  secondaryColor: string;
  shopSlug: string;
  initialWishlistStatus?: boolean;
  isShopOwner?: boolean;
  onOpenVariantModal: () => void;
}

interface CartIconProps {
  cartIcon?: string;
}

const CartIcon = ({ cartIcon }: CartIconProps) => {
  switch (cartIcon) {
    case "bag":
      return <ShoppingBag className="w-5 h-5" />;
    case "basket":
      return <ShoppingBasket className="w-5 h-5" />;
    default:
      return <ShoppingCart className="w-5 h-5" />;
  }
};

type AttributeValue = string | number | boolean | string[] | null;

export default function ProductSidebar({
  product,
  secondaryColor,
  shopSlug,
  initialWishlistStatus = false,
  isShopOwner = false,
  onOpenVariantModal,
}: Props) {
  const { shop } = useShop();
  const { items, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { attributeOptions, hasVariants } = useProductVariant(product);

  const [isInWishlist, setIsInWishlist] = useState(initialWishlistStatus);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const cartItem = items.find((i) => i.product_id === product.product_id);
  const displayQuantity = cartItem ? cartItem.quantity : 1;

  const discountPercentage = product.discount_price
    ? Math.round(
        ((product.price - product.discount_price) / product.price) * 100,
      )
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayPrice = () => {
    if (hasVariants && product.display_price && typeof product.display_price !== 'number') {
      return product.display_price.formatted;
    }
    if (product.discount_price) {
      return formatPrice(product.discount_price);
    }
    return formatPrice(product.price);
  };

  const getOriginalPrice = () => {
    if (hasVariants && product.display_price && typeof product.display_price !== 'number') {
      return product.display_price.original_formatted;
    }
    if (product.discount_price) {
      return formatPrice(product.price);
    }
    return null;
  };

  const getHasDiscount = () => {
    if (hasVariants && product.display_price && typeof product.display_price !== 'number') {
      return product.display_price.hasDiscount;
    }
    return !!product.discount_price && product.discount_price < product.price;
  };

  const getDiscountPercent = () => {
    if (hasVariants) return null;
    if (!product.discount_price || !product.price) return null;
    return Math.round(((product.price - product.discount_price) / product.price) * 100);
  };

  const getRemainingStock = () => {
    if (hasVariants) {
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      const totalCartQuantity = items
        .filter(i => i.product_id === product.product_id)
        .reduce((sum, i) => sum + i.quantity, 0);
      const remaining = totalStock - totalCartQuantity;
      return remaining > 0 ? remaining : 0;
    }
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const remaining = product.stock_quantity - cartQuantity;
    return remaining > 0 ? remaining : 0;
  };

  const getStockDisplay = () => {
    const remaining = getRemainingStock();
    if (remaining === 0) return 'Out of Stock';
    return `${remaining} units available`;
  };

  const handleIncrement = () => {
    if (hasVariants) {
      onOpenVariantModal();
      return;
    }
    
    const remainingStock = getRemainingStock();
    
    if (remainingStock <= 0) {
      showToast(`No more items available in stock`, "error");
      return;
    }
    
    if (cartItem) {
      updateQuantity(product.product_id, cartItem.quantity + 1);
    } else {
      addToCart(
        {
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price,
          discount_price: product.discount_price,
        },
        1,
      );
    }
  };

  const handleDecrement = () => {
    if (hasVariants) {
      onOpenVariantModal();
      return;
    }
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(product.product_id, cartItem.quantity - 1);
      } else {
        updateQuantity(product.product_id, 0);
      }
    }
  };

  const handleAddToCart = () => {
    if (hasVariants) {
      onOpenVariantModal();
      return;
    }
    handleIncrement();
  };

  const isAddToCartDisabled = () => {
    if (hasVariants) return false;
    return getRemainingStock() <= 0;
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      window.location.href = `/auth/login?redirect=/${shopSlug}/${product.product_slug}`;
      return;
    }

    if (isShopOwner) {
      showToast("Shop owners cannot add products to wishlist");
      return;
    }

    setIsTogglingWishlist(true);
    try {
      const res = await fetch("/api/shops/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggleWishlist",
          productId: product.product_id,
          shopSlug,
          productSlug: product.product_slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsInWishlist(!isInWishlist);
      showToast(
        isInWishlist ? "Removed from wishlist" : "Added to wishlist",
        "success",
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update wishlist";
      showToast(errorMessage, "error");
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const renderAttributeValue = (value: AttributeValue): React.ReactNode => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside text-gray-900">
          {value.map((item, idx) => (
            <li key={idx}>{String(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === "string") {
      if (value.includes(",")) {
        const items = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (items.length > 0) {
          return (
            <ul className="list-disc list-inside text-gray-900">
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        }
      }
      return <span className="text-gray-900">{value}</span>;
    }
    if (typeof value === "number") {
      return <span className="text-gray-900">{value}</span>;
    }
    return <span className="text-gray-900">{String(value)}</span>;
  };

  const attributeEntries = Object.entries(product.attributes || {})
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => ({
      key,
      label: key.replace(/_/g, " "),
      value: value as AttributeValue,
    }));

  const shareUrl = `${window.location.origin}/${shopSlug}/${product.product_slug}`;

  const HeartIcon = isInWishlist ? (
    <Heart className="w-5 h-5 fill-current" />
  ) : (
    <Heart className="w-5 h-5" />
  );
  const heartButtonClasses = `flex items-center gap-1.5 transition-colors ${
    isInWishlist ? "text-red-500" : "text-gray-900 hover:text-red-900"
  } ${isShopOwner ? "opacity-50 cursor-not-allowed" : ""}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.product_name,
          text: `Check out ${product.product_name} on ${shop?.shopName || "our store"}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link copied to clipboard!", "success");
      } catch {
        showToast("Failed to copy link", "error");
      }
    }
  };

  const displayPrice = getDisplayPrice();
  const originalPrice = getOriginalPrice();
  const hasDiscount = getHasDiscount();
  const discountPercent = getDiscountPercent();
  const remainingStock = getRemainingStock();

  return (
    <>
      <div className="hidden md:block space-y-5">
        <h1 className="text-2xl font-medium">{product.product_name}</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-semibold">
            KSh {displayPrice}
          </span>
          {hasDiscount && originalPrice && (
            <span className="text-gray-400 line-through text-lg">
              KSh {originalPrice}
            </span>
          )}
          {discountPercent && discountPercent > 0 && (
            <span
              className="text-white text-xs px-2 py-1 rounded"
              style={{ backgroundColor: secondaryColor }}
            >
              -{discountPercent}%
            </span>
          )}
          {hasVariants && product.display_price && typeof product.display_price !== 'number' && product.display_price.isRange && (
            <span className="text-xs text-gray-500 font-medium">
              Range
            </span>
          )}
        </div>

        <div className={`text-sm ${remainingStock === 0 ? 'text-red-600 font-medium' : 'text-black'}`}>
          {getStockDisplay()}
        </div>

        {hasVariants && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2.5">Variations</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(attributeOptions).map(([key, values]) => (
                <div key={key}>
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider block mb-1.5">
                    {key}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                      <button
                        key={value}
                        onClick={onOpenVariantModal}
                        className="px-3.5 py-1.5 text-sm font-medium border border-gray-300 rounded hover:border-gray-600 hover:bg-gray-50 transition-all text-gray-700 flex-1 min-w-[60px] text-center"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded border-black">
            <button
              onClick={handleDecrement}
              className="px-3 py-2 hover:bg-gray-100"
              disabled={!cartItem && !hasVariants}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-center w-12 text-sm font-medium">
              {displayQuantity}
            </span>
            <button
              onClick={handleIncrement}
              className="px-3 py-2 hover:bg-gray-100"
              disabled={hasVariants ? false : remainingStock <= 0}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 text-white text-sm py-2.5"
            style={{ 
              backgroundColor: isAddToCartDisabled() ? '#9CA3AF' : secondaryColor,
            }}
            disabled={isAddToCartDisabled()}
          >
            <CartIcon cartIcon={shop?.cartIcon} />
            {hasVariants ? "Select Options" : cartItem ? "Update Cart" : "Add to Cart"}
          </Button>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist || isShopOwner}
            className={heartButtonClasses}
          >
            {HeartIcon}
            <span className="text-sm">Wishlist</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        <p className="text-black text-sm font-medium">
          {product.description}
        </p>

        {attributeEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-sm font-medium mb-2.5">Product Details</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {attributeEntries.map((attr) => (
                <div key={attr.key} className="flex flex-col">
                  <span className="font-normal capitalize text-gray-600 text-xs">
                    {attr.label}
                  </span>
                  <span className="font-semibold text-sm">
                    {renderAttributeValue(attr.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="block md:hidden space-y-4 pb-4">
        <h1 className="text-xl font-semibold leading-tight text-black">
          {product.product_name}
        </h1>

        <div className="flex items-end gap-3 flex-wrap">
          <span className="text-xl font-bold text-black">
            KSh {displayPrice}
          </span>
          {hasDiscount && originalPrice && (
            <span className="text-gray-400 line-through text-sm">
              KSh {originalPrice}
            </span>
          )}
          {discountPercent && discountPercent > 0 && (
            <span
              className="text-white text-[10px] px-2 py-[2px] rounded font-medium"
              style={{ backgroundColor: secondaryColor }}
            >
              -{discountPercent}%
            </span>
          )}
          {hasVariants && product.display_price && typeof product.display_price !== 'number' && product.display_price.isRange && (
            <span className="text-[10px] text-gray-500 font-medium">
              Range
            </span>
          )}
        </div>

        <div className={`text-xs ${remainingStock === 0 ? 'text-red-600 font-medium' : 'text-black'}`}>
          {getStockDisplay()}
        </div>

        {hasVariants && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2.5">Variations</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(attributeOptions).map(([key, values]) => (
                <div key={key}>
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider block mb-1.5">
                    {key}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {values.map((value) => (
                      <button
                        key={value}
                        onClick={onOpenVariantModal}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:border-gray-600 hover:bg-gray-50 transition-all text-gray-700 flex-1 min-w-[50px] text-center"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist || isShopOwner}
            className={heartButtonClasses}
          >
            {HeartIcon}
            <span>Wishlist</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        <p className="text-black text-sm leading-relaxed">
          {product.description}
        </p>

        {attributeEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-4 space-y-2.5">
            <h2 className="text-sm font-semibold text-black">
              Product Details
            </h2>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {attributeEntries.map((attr) => (
                <div key={attr.key} className="flex flex-col">
                  <span className="text-gray-600 text-xs uppercase tracking-wide">
                    {attr.label}
                  </span>
                  <span className="text-black text-sm font-semibold">
                    {renderAttributeValue(attr.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}