'use client';

import { ShoppingCart, Minus, Plus, ShoppingBag, ShoppingBasket } from 'lucide-react';
import Button from '@/app/components/ui/button';
import { useCart } from '@/context/shopCartContext';
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from '@/context/toastContext';

interface Props {
  productId: number;
  productName: string;
  price: number;
  discountPrice: number | null;
  secondaryColor: string;
  maxQuantity?: number;
  in_stock: boolean; // ADD THIS
}

// Move CartIcon component outside of the main component
interface CartIconProps {
  cartIcon?: string;
}

const CartIcon = ({ cartIcon }: CartIconProps) => {
  switch (cartIcon) {
    case 'bag':
      return <ShoppingBag className="w-6 h-6 mr-2" />;
    case 'basket':
      return <ShoppingBasket className="w-6 h-6 mr-2" />;
    default:
      return <ShoppingCart className="w-6 h-6 mr-2" />;
  }
};

export default function MobileProductBar({
  productId,
  productName,
  price,
  discountPrice,
  secondaryColor,
  maxQuantity = 99,
  in_stock // ADD THIS
}: Props) {
  const { items, addToCart, updateQuantity } = useCart();
  const { showToast } = useToast(); // ADD THIS
  const cartItem = items.find(i => i.product_id === productId);
  const displayQuantity = cartItem ? cartItem.quantity : 1;
  const { shop } = useShop();

  const handleIncrement = () => {
    // ADD THIS CHECK
    if (!in_stock) {
      showToast(`${productName} is out of stock`, 'error');
      return;
    }

    if (cartItem) {
      if (cartItem.quantity < maxQuantity) {
        updateQuantity(productId, cartItem.quantity + 1);
      }
    } else {
      addToCart({
        product_id: productId,
        product_name: productName,
        price,
        discount_price: discountPrice,
        in_stock: in_stock, // ADD THIS
      }, 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(productId, cartItem.quantity - 1);
      } else {
        updateQuantity(productId, 0); // remove
      }
    }
  };

  return (
    <div className="fixed bottom-18 left-0 p-2 flex flex-row gap-1 right-0 bg-white z-40 md:hidden">
      <div className="flex items-center border text-black border-gray-700">
        <button
          onClick={handleDecrement}
          className="px-3 py-2 hover:bg-gray-100"
          disabled={!cartItem}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-4 py-2 text-center w-12">{displayQuantity}</span>
        <button
          onClick={handleIncrement}
          className="px-3 py-2 hover:bg-gray-100"
          disabled={cartItem && cartItem.quantity >= maxQuantity || !in_stock} // UPDATE THIS
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <Button
        onClick={handleIncrement}
        className={`flex-1 flex flex-row gap-3 justify-center items-center text-white px-0 py-0 border-0 ${
          !in_stock ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{ backgroundColor: secondaryColor }}
        disabled={!in_stock} // ADD THIS
      >
        <CartIcon cartIcon={shop?.cartIcon} />
        {!in_stock ? 'Out of Stock' : cartItem ? 'Update Cart' : 'Add to Cart'} {/* UPDATE THIS */}
      </Button>
    </div>
  );
}