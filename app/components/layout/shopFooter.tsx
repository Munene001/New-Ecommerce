"use client";

import { useShop } from "@/app/(shop)/ShopContext";
import { Icon } from "@iconify/react";
import { 
  Mail, 
  Phone, 
  MapPin,
  User,
  Heart,
  Building2,
  
} from "lucide-react";
import Link from "next/link";

export default function ShopFooter() {
  const { shop, trackEvent } = useShop();

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    // If it's in +254 format, display as is
    if (phone.startsWith('+254')) {
      return phone;
    }
    // If it starts with 0, convert to +254 format for display
    if (phone.startsWith('0')) {
      return '+254' + phone.substring(1);
    }
    return phone;
  };

  // Format phone number for WhatsApp (must be in international format without +)
  const getWhatsAppNumber = (phone: string) => {
    if (!phone) return "";
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    // If it starts with 0 (Kenyan format), replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    // If it starts with 254, keep as is
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    return cleaned;
  };

  const handleWhatsAppClick = () => {
    if (!shop?.contactPhone) return;
    
    // Track WhatsApp click
    trackEvent('whatsapp_click', { button_location: 'footer' });
    
    const whatsappNumber = getWhatsAppNumber(shop.contactPhone);
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  const handlePhoneClick = () => {
    if (!shop?.contactPhone) return;
    
    // Track phone click
    trackEvent('phone_click', { button_location: 'footer' });
    
    const displayPhone = formatPhoneNumber(shop.contactPhone);
    window.location.href = `tel:${displayPhone}`;
  };

  // Get display phone number
  const displayPhone = formatPhoneNumber(shop?.contactPhone || "");

  return (
    <footer className="bg-[#050505] text-white rounded-t-2xl border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-6">
        
        {/* Top Section: Brand Identity (Moved out of columns) */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8  mb-16">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              {shop?.shopName}
            </h2>
            <p className="text-base leading-relaxed opacity-80">
              {shop?.description || "Your trusted shopping destination for quality products and exceptional service."}
            </p>
          </div>
          
          {/* Prominent Contact Actions */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {shop?.contactPhone && (
              <button 
                onClick={handlePhoneClick}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-2xl transition-all group"
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-white font-medium">{displayPhone}</span>
              </button>
            )}
          
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 pb-8">
          
          {/* Column 1: Location & Details */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Reach Us</h4>
            <div className="space-y-4 text-sm">
              {shop?.businessTown && (
                <div className="flex items-center gap-1 group">
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition">
                    <Building2 className="w-4 h-4 text-gray-300" />
                  </div>
                  <span>{shop.businessTown}</span>
                </div>
              )}
              {shop?.businessAddress && (
                <div className="flex items-start gap-1 group">
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition">
                    <MapPin className="w-4 h-4 text-gray-300" />
                  </div>
                  <span className="pt-1">{shop.businessAddress}</span>
                </div>
              )}
              {shop?.contactEmail && (
                <a href={`mailto:${shop.contactEmail}`} className="flex items-center gap-1 group hover:text-white transition">
                  <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500/20 transition">
                    <Mail className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
                  </div>
                  <span>{shop.contactEmail}</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Account */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Customer Space</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${shop?.shopSlug}/profile`} className="flex items-center gap-2 hover:translate-x-1 hover:text-white transition-all">
                  <User className="w-4 h-4" />
                  <span>Your Profile</span>
                </Link>
              </li>
              <li>
                <Link href={`/${shop?.shopSlug}/wishlist`} className="flex items-center gap-2 hover:translate-x-1 hover:text-white transition-all">
                  <Heart className="w-4 h-4" />
                  <span>Saved Items</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help & Support */}
          <div className="space-y-6">
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="hover:text-white cursor-pointer transition">Contact Us</li>
              <li className="hover:text-white cursor-pointer transition">Frequently Asked Questions</li>
              <li className="hover:text-white cursor-pointer transition">Return Policy</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-wide">
          <p className="opacity-60 text-center md:text-left">
            &copy; {new Date().getFullYear()} <span className="text-white font-medium">{shop?.shopName}</span>. All rights reserved.
          </p>
          <div className="flex gap-8 opacity-60">
            <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}