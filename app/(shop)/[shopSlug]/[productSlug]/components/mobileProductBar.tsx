'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import Button from '@/app/components/ui/button';

interface Props {
  productId: number;
  secondaryColor: string;
  maxQuantity?: number; // if you have stock limits
}

export default function MobileProductBar({ productId, secondaryColor, maxQuantity = 99 }: Props) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    console.log('Mobile add to cart:', { productId, quantity });
    // Replace with your actual cart logic
  };

  return (
    <div className="fixed bottom-18 left-0  p-2 flex flex-row gap-1 right-0 bg-white z-40 md:hidden">
      
        <div className="flex items-center border border-gray-300">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-center w-12">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            className="px-3 py-2 hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <Button
          onClick={handleAddToCart}
          className="flex-1 flex  flex-row gap-3 justify-center items-center text-white px-0 py-0 border-0"
          style={{ backgroundColor: secondaryColor }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      
    </div>
  );
}