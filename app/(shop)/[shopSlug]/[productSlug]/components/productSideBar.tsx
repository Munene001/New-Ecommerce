'use client';

import { useState } from 'react';
import { Heart, Share2, ShoppingCart, Minus, Plus } from 'lucide-react';
import Button from '@/app/components/ui/button';

interface Product {
  product_id: number;
  product_name: string;
  description: string;
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  attributes: Record<string, any>;
}

interface Props {
  product: Product;
  secondaryColor: string;
}

export default function ProductSidebar({ product, secondaryColor }: Props) {
  const [quantity, setQuantity] = useState(1);

  const discountPercentage = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    console.log('Add to cart:', { productId: product.product_id, quantity });
    // Replace with actual cart logic
  };

  const renderAttributeValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const attributeEntries = Object.entries(product.attributes || {})
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => ({
      key,
      label: key.replace(/_/g, ' '),
      value: renderAttributeValue(value),
    }));

  return (
    <>
      {/* Desktop version (hidden on mobile) */}
      <div className="hidden md:block space-y-6">
        <h1 className="text-3xl font-light">{product.product_name}</h1>

        {/* Price */}
        <div className="flex items-center gap-3">
          {product.discount_price ? (
            <>
              <span className="text-2xl font-semibold">KSh {formatPrice(product.discount_price)}</span>
              <span className="text-gray-400 line-through text-lg">KSh {formatPrice(product.price)}</span>
              <span 
                className="text-white text-xs px-2 py-1 rounded"
                style={{ backgroundColor: secondaryColor }}
              >
                -{discountPercentage}%
              </span>
            </>
          ) : (
            <span className="text-2xl font-semibold">KSh {formatPrice(product.price)}</span>
          )}
        </div>

        {/* Stock status */}
        <div>
          {product.in_stock ? (
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">In Stock</span>
          ) : (
            <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">Out of Stock</span>
          )}
        </div>

        {/* Quantity & Add to Cart */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 hover:bg-gray-100"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-center w-12">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={handleAddToCart} 
            className="flex-1 flex flex-row gap-3 justify-center items-center text-white"
            style={{ backgroundColor: secondaryColor }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>

        {/* Wishlist & Share */}
        <div className="flex gap-4">
          <button 
            className="flex items-center gap-1 text-gray-600 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = secondaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </button>
          <button 
            className="flex items-center gap-1 text-gray-600 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = secondaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>

        {/* Description */}
        <p className="text-black">{product.description}</p>

        {/* Attributes */}
        {attributeEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium mb-3">Product Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              {attributeEntries.map(attr => (
                <div key={attr.key} className="flex flex-col">
                  <span className="font-bold capitalize text-gray-700">{attr.label}</span>
                  <span className="text-gray-900">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile version – inline content (the fixed bottom bar will handle Add to Cart) */}
      <div className="block md:hidden space-y-6 pb-24"> {/* pb-24 leaves space for fixed bars */}
        <h1 className="text-3xl font-light">{product.product_name}</h1>
        <div className="flex items-center gap-3">
          {product.discount_price ? (
            <>
              <span className="text-2xl font-semibold">KSh {formatPrice(product.discount_price)}</span>
              <span className="text-gray-400 line-through text-lg">KSh {formatPrice(product.price)}</span>
              <span 
                className="text-white text-xs px-2 py-1 rounded"
                style={{ backgroundColor: secondaryColor }}
              >
                -{discountPercentage}%
              </span>
            </>
          ) : (
            <span className="text-2xl font-semibold">KSh {formatPrice(product.price)}</span>
          )}
        </div>
        <div>
          {product.in_stock ? (
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">In Stock</span>
          ) : (
            <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">Out of Stock</span>
          )}
        </div>
        <div className="flex gap-4">
          <button 
            className="flex items-center gap-1 text-gray-600 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = secondaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </button>
          <button 
            className="flex items-center gap-1 text-gray-600 transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = secondaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
        <p className="text-gray-600">{product.description}</p>
        {attributeEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium mb-3">Product Details</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {attributeEntries.map(attr => (
                <div key={attr.key} className="flex flex-col">
                  <span className="font-bold capitalize text-gray-700">{attr.label}</span>
                  <span className="text-gray-900">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}