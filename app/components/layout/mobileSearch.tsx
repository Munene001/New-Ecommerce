// app/components/layout/MobileSearchOverlay.tsx
"use client";

import { X, Search, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useShop } from "@/app/(shop)/ShopContext";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const { shop } = useShop();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(["jeans", "shirts", "shoes"]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60] md:hidden"
        onClick={onClose}
      />
      
      {/* Search panel sliding from right */}
      <div className={`fixed inset-y-0 right-0 w-full bg-white z-[70] md:hidden shadow-2xl animate-slide-left`}>
        <div className="flex flex-col h-full">
          {/* Header with close */}
          <div className="flex items-center gap-4 p-4 border-b">
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            </button>
            <span className="text-xl font-medium" style={{ color: 'var(--primary)' }}>Search</span>
          </div>

          {/* Search input */}
          <div className="p-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-4 border-2 rounded-xl text-lg"
                style={{ borderColor: 'var(--primary)' }}
              />
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: 'var(--primary)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Recent searches */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">RECENT SEARCHES</h3>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(search)}
                    className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular products section */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">POPULAR PRODUCTS</h3>
              <div className="space-y-3">
                {/* Product items would map here */}
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div>
                    <p className="font-medium">Product Name</p>
                    <p className="text-sm text-gray-600">$29.99</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
      `}</style>
    </>
  );
}