"use client";

import { useShop } from "@/app/(shop)/ShopContext";

export default function ShopFooter() {
  const { shop } = useShop();

  return (
    <footer className="border-t mt-auto py-6 bg-black rounded-t-lg text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Shop Info */}
          <div>
            <h3 className="font-bold mb-2" style={{ color: shop?.primaryColor }}>
              {shop?.shopName}
            </h3>
            <p className="text-sm">
              {shop?.contactEmail}<br />
              {shop?.contactPhone}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <ul className="text-sm  space-y-1">
              <li><a href={`/shop/${shop?.shopSlug}/products`}>Products</a></li>
              <li><a href={`/shop/${shop?.shopSlug}/cart`}>Cart</a></li>
            </ul>
          </div>
          
          {/* WhatsApp */}
          {shop?.whatsappNumber && (
            <div>
              <h4 className="font-semibold mb-2">Contact Us</h4>
              <a 
                href={`https://wa.me/${shop.whatsappNumber}`}
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: shop?.primaryColor }}
              >
                <span>💬</span> Chat on WhatsApp
              </a>
            </div>
          )}
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-8 pt-4 border-t">
          &copy; {new Date().getFullYear()} {shop?.shopName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}