// app/components/common/FloatingWhatsApp.tsx
"use client";

import { useShop } from "@/app/(shop)/ShopContext";
import { Icon } from "@iconify/react";

export default function FloatingWhatsApp() {
  const { shop, trackEvent } = useShop();

  const handleWhatsAppClick = () => {
    if (!shop?.contactPhone) return;
    
    // Track the click
    trackEvent('whatsapp_click', {
      button_location: 'floating_whatsapp'
    });
    
    // Format: if starts with 0, replace with +254
    let phoneNumber = shop.contactPhone;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+254' + phoneNumber.substring(1);
    }
    
    // Open WhatsApp
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  return (
    <div className="fixed bottom-20 right-6 animate-pulse z-40 md:bottom-6">
      <button
        onClick={handleWhatsAppClick}
        className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Contact on WhatsApp"
      >
        <Icon icon="logos:whatsapp-icon" className="w-8 h-8" />
      </button>
    </div>
  );
}