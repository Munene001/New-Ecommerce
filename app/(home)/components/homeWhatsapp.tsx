// app/components/common/FloatingWhatsApp.tsx
"use client";

import { Icon } from "@iconify/react";
import { useShopOwnerTracking } from "@/lib/hooks/useShopOwnerTracking";

export default function HomeWhatsApp() {
  const { track } = useShopOwnerTracking();
  
  const handleWhatsAppClick = () => {
    track("whatsapp_click");  // ← Track when clicked
    window.open(`https://wa.me/254715067768`, '_blank');
  };

  return (
    <div className="fixed bottom-15 md:bottom-6 right-3  right-6 z-40">
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