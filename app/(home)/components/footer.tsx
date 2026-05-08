"use client";

import { Icon } from "@iconify/react";
import { 
  Phone, 
  Instagram,
  Twitter,
  Mail,
  MapPin,
  Building2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SimpleFooter() {
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/254715067768`, '_blank');
  };

  return (
    <footer className="text-white rounded-t-2xl pt-8 pb-6">
      <div className="container mx-auto px-6">
        
        {/* Logo + Mission */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="mb-4">
              <Image 
                src="/logo.png" 
                alt="YourBrand Logo" 
                width={120} 
                height={40}
              />
            </div>
            <p className="text-[16px] font-medium leading-relaxed text-white max-w-xl">
              Smart solutions for local entrepreneurs.
            </p>
          </div>
          
          {/* Contact Actions */}
          <div className="flex flex-col md:flex-row md:flex-wrap gap-4 w-full md:w-auto">
            <a 
              href="tel:+254715067768"
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-2xl transition-all group"
            >
              <Phone className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-white font-medium">0715 067 768</span>
            </a>
            <button 
              onClick={handleWhatsAppClick}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-6 py-4 rounded-2xl transition-all group"
            >
              <Icon icon="logos:whatsapp-icon" className="w-5 h-5" />
              <span className="text-green-400 font-medium">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* 4-Column Grid - Mobile: first 2 side by side, rest stacked */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-12 pb-8">
          
          {/* Column 1: Quick Links */}
         
          {/* Column 2: Support */}
          <div className="space-y-4 col-span-1">
            <h4 className="text-white font-semibold uppercase tracking-widest text-sm">Support</h4>
            <ul className="space-y-3 text-sm">
            
              <li>
                <button onClick={handleWhatsAppClick} className="text-white/90 hover:text-white hover:translate-x-1 transition-all inline-flex items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                  WhatsApp
                </button>
              </li>
              <li>
                <div className="text-white/90 inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nairobi, Kenya
                </div>
              </li>
            </ul>
          </div>

           <div className="space-y-4 col-span-1">
            <h4 className="text-white font-semibold uppercase tracking-widest text-sm">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-white/90 hover:text-white hover:translate-x-1 transition-all inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/conatct" className="text-white/90 hover:text-white hover:translate-x-1 transition-all inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/90 hover:text-white hover:translate-x-1 transition-all inline-block">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>


          {/* Column 3: Socials */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold uppercase tracking-widest text-sm">Socials</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all">
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-all">
                <Twitter className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Column 4: Location/Address */}
          <div className="space-y-6 col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold uppercase tracking-widest text-xs">Location</h4>
            <div className="space-y-3 text-sm">
              <div className="text-white/90 inline-flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>51 Lenana Rd, Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright - Centered */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Paziatech. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}