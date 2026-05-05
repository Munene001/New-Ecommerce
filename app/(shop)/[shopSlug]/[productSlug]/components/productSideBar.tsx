"use client";

import {
  Heart,
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  Minus,
  Plus,
} from "lucide-react";
import Button from "@/app/components/ui/button";
import { useCart } from "@/context/shopCartContext";
import ShareButton from "@/app/components/ui/shareButton";
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authcontext";
import { useState } from "react";

interface Product {
  product_id: number;
  product_name: string;
  description: string;
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  attributes: Record<string, string | number | boolean | string[] | null>;
  product_slug: string;
}

interface Props {
  product: Product;
  secondaryColor: string;
  shopSlug: string;
  initialWishlistStatus?: boolean;
  isShopOwner?: boolean;
}

interface CartIconProps {
  cartIcon?: string;
}

// Move CartIcon component outside
const CartIcon = ({ cartIcon }: CartIconProps) => {
  switch (cartIcon) {
    case "bag":
      return <ShoppingBag className="w-6 h-6 mr-2" />;
    case "basket":
      return <ShoppingBasket className="w-6 h-6 mr-2" />;
    default:
      return <ShoppingCart className="w-6 h-6 mr-2" />;
  }
};

// Define attribute value type
type AttributeValue = string | number | boolean | string[] | null;

export default function ProductSidebar({
  product,
  secondaryColor,
  shopSlug,
  initialWishlistStatus = false,
  isShopOwner = false,
}: Props) {
  const { shop } = useShop();
  const { items, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

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

  const handleIncrement = () => {
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
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(product.product_id, cartItem.quantity - 1);
      } else {
        updateQuantity(product.product_id, 0);
      }
    }
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

  // Fixed renderAttributeValue with proper typing
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

  // Construct share URL (client-side only)
  const shareUrl = `/${shopSlug}/${product.product_slug}`;
 

  // Heart icon and style based on wishlist status and owner restriction
  const HeartIcon = isInWishlist ? (
    <Heart className="w-5 h-5 fill-current" />
  ) : (
    <Heart className="w-5 h-5" />
  );
  const heartButtonClasses = `flex items-center gap-1 transition-colors ${
    isInWishlist ? "text-red-500" : "text-gray-900 hover:text-red-900"
  } ${isShopOwner ? "opacity-50 cursor-not-allowed" : ""}`;

  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:block space-y-6">
        <h1 className="text-3xl font-medium">{product.product_name}</h1>

        {/* Price */}
        <div className="flex items-center gap-3">
          {product.discount_price ? (
            <>
              <span className="text-2xl font-semibold">
                KSh {formatPrice(product.discount_price)}
              </span>
              <span className="text-gray-400 line-through text-lg">
                KSh {formatPrice(product.price)}
              </span>
              <span
                className="text-white text-xs px-2 py-1 rounded"
                style={{ backgroundColor: secondaryColor }}
              >
                -{discountPercentage}%
              </span>
            </>
          ) : (
            <span className="text-2xl font-semibold">
              KSh {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock status */}
        <div>
          {product.in_stock ? (
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
              In Stock
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quantity controls & Add to Cart */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-xs border-black">
            <button
              onClick={handleDecrement}
              className="px-3 py-2 hover:bg-gray-100"
              disabled={!cartItem}
            >
              <Minus className="w-4 h-4 text-bold" />
            </button>
            <span className="px-4 py-2 text-center text-bold w-12">
              {displayQuantity}
            </span>
            <button
              onClick={handleIncrement}
              className="px-3 py-2 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 text-bold" />
            </button>
          </div>
          <Button
            onClick={handleIncrement}
            className="flex-1 flex flex-row gap-3 justify-center items-center text-white"
            style={{ backgroundColor: secondaryColor }}
          >
            <CartIcon cartIcon={shop?.cartIcon} />
            {cartItem ? "Update Cart" : "Add to Cart"}
          </Button>
        </div>

        {/* Wishlist & Share */}
        <div className="flex gap-4">
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist || isShopOwner}
            className={heartButtonClasses}
            title={
              isShopOwner
                ? "Shop owners cannot add items to wishlist"
                : undefined
            }
          >
            {HeartIcon}
            <span className="text-gray-900">Wishlist</span>
          </button>
          <ShareButton
            title={product.product_name}
            text={`Check out ${product.product_name} on ${shop?.shopName || "our store"}`}
            url={shareUrl}
            
            color={secondaryColor}
            showLabel
            iconClassName="w-5 h-5"
            labelClassName="text-sm"
            onSuccess={() => showToast("Link copied to clipboard!", "success")}
            onError={() => showToast("Failed to share", "error")}
          />
        </div>

        {/* Description */}
        <p className="text-black text-[16px] font-medium">
          {product.description}
        </p>

        {/* Attributes */}
        {attributeEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium mb-3">Product Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {attributeEntries.map((attr) => (
                <div key={attr.key} className="flex flex-col">
                  <span className="font-normal capitalize text-gray-900">
                    {attr.label}
                  </span>
                  <span className="font-bold">
                    {renderAttributeValue(attr.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile version */}
      <div className="block md:hidden space-y-5 pb-6">
        {/* Title */}
        <h1 className="text-2xl font-semibold leading-tight text-black">
          {product.product_name}
        </h1>

        {/* Price Section */}
        <div className="flex items-end gap-3">
          {product.discount_price ? (
            <>
              <span className="text-2xl font-bold text-black">
                KSh {formatPrice(product.discount_price)}
              </span>

              <span className="text-gray-400 line-through text-sm">
                KSh {formatPrice(product.price)}
              </span>

              <span
                className="text-white text-[10px] px-2 py-[2px] rounded font-medium"
                style={{ backgroundColor: secondaryColor }}
              >
                -{discountPercentage}%
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-black">
              KSh {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock */}
        <div>
          {product.in_stock ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              In Stock
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
              Out of Stock
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5 text-sm text-gray-800">
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist || isShopOwner}
            className={heartButtonClasses}
            title={
              isShopOwner
                ? "Shop owners cannot add items to wishlist"
                : undefined
            }
          >
            {HeartIcon}
            <span>Wishlist</span>
          </button>
          v
          <ShareButton
            title={product.product_name}
            text={`Check out ${product.product_name} on ${shop?.shopName || "our store"}`}
            url={shareUrl}
            
            color={secondaryColor}
            showLabel
            iconClassName="w-5 h-5"
            labelClassName="text-sm"
            onSuccess={() => showToast("Link copied to clipboard!", "success")}
            onError={() => showToast("Failed to share", "error")}
          />
        </div>

        {/* Description */}
        <p className="text-black text-[16px] leading-relaxed">
          {product.description}
        </p>

        {/* Attributes */}
        {attributeEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <h2 className="text-base font-semibold text-black">
              Product Details
            </h2>

            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {attributeEntries.map((attr) => (
                <div key={attr.key} className="flex flex-col">
                  <span className="text-gray-900 text-[16px] uppercase tracking-wide">
                    {attr.label}
                  </span>
                  <span className="text-black text-[16px] font-semibold">
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
