'use client';

import { ShoppingCart, Minus, Plus, ShoppingBag, ShoppingBasket } from 'lucide-react';
import Button from '@/app/components/ui/button';
import { useCart } from '@/context/shopCartContext';
import { useShop } from "@/app/(shop)/ShopContext";
import { useToast } from '@/context/toastContext';
import { useToast } from '@/context/toastContext';

interface Props {
  productId: number;
  productName: string;
  price: number;
  discountPrice: number | null;
  secondaryColor: string;
  maxQuantity?: number;
  stockQuantity?: number;
  hasVariants?: boolean;
  onOpenVariantModal?: () => void;
}

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
  stockQuantity = 99,
  hasVariants = false,
  onOpenVariantModal,
}: Props) {
  const { items, addToCart, updateQuantity } = useCart();
  const { showToast } = useToast();
  const { shop } = useShop();

  const cartItem = items.find(i => i.product_id === productId);
  const displayQuantity = cartItem ? cartItem.quantity : 1;

  // ✅ FIXED: Calculate remaining stock
  const getRemainingStock = () => {
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const totalStock = stockQuantity || maxQuantity;
    const remaining = totalStock - cartQuantity;
    return remaining > 0 ? remaining : 0;
  };

  const remainingStock = getRemainingStock();

  const handleIncrement = () => {
    if (hasVariants && onOpenVariantModal) {
      onOpenVariantModal();
      return;
    }
    
    if (remainingStock <= 0) {
      showToast(`No more items available in stock`, "error");
      return;
    }
    
    if (cartItem) {
      if (cartItem.quantity < (stockQuantity || maxQuantity)) {
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
    if (hasVariants && onOpenVariantModal) {
      onOpenVariantModal();
      return;
    }
    
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(productId, cartItem.quantity - 1);
      } else {
        updateQuantity(productId, 0);
      }
    }
  };

  const isButtonDisabled = () => {
    if (hasVariants) return false;
    return remainingStock <= 0;
  };

  const getButtonText = () => {
    if (hasVariants) return 'Select Options';
    return cartItem ? 'Update Cart' : 'Add to Cart';
  };

  return (
    <div className="fixed bottom-18 left-0 p-2 flex flex-row gap-1 right-0 bg-white z-40 md:hidden">
      <div className="flex items-center border text-black border-gray-700">
        <button
          onClick={handleDecrement}
          className="px-3 py-2 hover:bg-gray-100"
          disabled={!cartItem && !hasVariants}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-4 py-2 text-center w-12">{displayQuantity}</span>
        <button
          onClick={handleIncrement}
          className="px-3 py-2 hover:bg-gray-100"
          disabled={hasVariants ? false : remainingStock <= 0}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <Button
        onClick={handleIncrement}
        className="flex-1 flex flex-row gap-3 justify-center items-center text-white px-0 py-0 border-0"
        style={{ 
          backgroundColor: isButtonDisabled() ? '#9CA3AF' : secondaryColor,
        }}
        disabled={isButtonDisabled()}
      >
        <CartIcon cartIcon={shop?.cartIcon} />
        {getButtonText()}
      </Button>
    </div>
  );
}