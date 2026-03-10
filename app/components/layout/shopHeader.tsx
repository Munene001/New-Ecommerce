// app/components/layout/shopHeader.tsx
"use client";

import { useShop } from "@/app/(shop)/ShopContext";
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  Newspaper,
  PhoneForwarded,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavIcon from "../ui/navIcon";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ShopHeader() {
  const { shop } = useShop();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Update URL when debounced search changes
  useEffect(() => {
    if (!shop?.shopSlug) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    } else {
      params.delete('search');
    }
    // Navigate to the shop home with updated params
    router.push(`/${shop.shopSlug}?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, shop?.shopSlug, router, searchParams]);

  // Sync input when URL changes (e.g., back/forward)
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.shopSlug) return;
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    router.push(`/${shop.shopSlug}?${params.toString()}`, { scroll: false });
  };

  // Determine cart icon based on shop preference
  const getCartIcon = () => {
    switch (shop?.cartIcon) {
      case "bag":
        return <ShoppingCart className="w-5 h-5" />;
      case "basket":
        return <ShoppingCart className="w-5 h-5" />;
      default:
        return <ShoppingCart className="w-5 h-5" />;
    }
  };

  return (
    <header className="bg-white">
      {/* Layer 1: Header Message - Secondary Color Background */}
      <div
        className="text-center text-[15px] h-[50px] font-bold font-[Inter] text-white flex items-center justify-center gap-2 rounded-b-sm"
        style={{ backgroundColor: `${shop?.secondaryColor}` }}
      >
        <span>✨</span>
        <span>{shop?.headerMessage || `Get Deals Upto 50% Off`}</span>
      </div>

      {/* Layer 2: Main Header - Desktop  */}
      <div className="">
        <div className=" mx-auto  md:pt-5 md:px-4 pl-2 pr-3  py-4">
          <div className="hidden md:block">
            <div className="flex items-center justify-between w-full">
              {/* Search Bar - Left section */}
              <div className="w-1/3">
                <form onSubmit={handleSearchSubmit} className="relative w-[80%]">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-4 placeholder:text-gray-600 py-4 border border-[var(--secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                </form>
              </div>

              {/* Shop Name/Title - Center section */}
              <div className="w-1/3 flex text-center justify-center">
                <span
                  className="text-[40px] leading-[65px] font-medium"
                  style={{ color: shop?.primaryColor }}
                >
                  {shop?.shopName}
                </span>
              </div>

              {/* Icons - Right section */}
              <div className="w-1/3 flex justify-end items-center gap-6">
                <button className="hover:opacity-70 transition">
                  <User
                    className="w-7 h-7"
                    style={{ color: shop?.primaryColor }}
                  />
                </button>
                <button className="hover:opacity-70 transition">
                  <Heart
                    className="w-7 h-7"
                    style={{ color: shop?.primaryColor }}
                  />
                </button>
                <button className="relative hover:opacity-70 transition">
                  <span style={{ color: shop?.primaryColor }}>
                    <ShoppingCart className="w-7 h-7" />
                  </span>
                  <span
                    className="absolute  animate-bounce -top-2 -right-2 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: "var(--secondary)" }}
                  >
                    0
                  </span>
                </button>
              </div>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="flex justify-end mt-3">
              <nav className="flex gap-12 text-lg font-[Inter]" style={{ color: "var(--secondary)" }}>
                <NavIcon href={`/`} icon={<ShoppingCart />} label="Shop" />
                <NavIcon
                  href={`/shop/${shop?.shopSlug}/blog`}
                  icon={<Newspaper />}
                  label="Blog"
                />
                <NavIcon
                  href={`/shop/${shop?.shopSlug}/contact`}
                  icon={<PhoneForwarded />}
                  label="Contact"
                />
              </nav>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-4 py-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-2"
              >
                <Menu
                  className="w-7 h-7"
                  style={{ color: shop?.primaryColor }}
                />
              </button>

              <span
                className="text-3xl font-bold  flex text-center"
                style={{ color: shop?.primaryColor }}
              >
                {shop?.shopName}
              </span>

              <button className="relative hover:opacity-70 transition ">
                  <span style={{ color: shop?.primaryColor }}>
                    <ShoppingCart className="w-7 h-7" />
                  </span>
                  <span
                    className="absolute -top-2  animate-bounce -right-2 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ backgroundColor: "var(--secondary)" }}
                  >
                    0
                  </span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Dark overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile menu panel - 80% width */}
          <div className="fixed inset-y-0 left-0 w-[85%] bg-white z-50 md:hidden shadow-2xl animate-slide-right">
            <div className="flex flex-col h-full">
              {/* X button - top right */}
              <div className="flex justify-end p-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:opacity-70 transition"
                >
                  <X className="w-6 h-6" style={{ color: shop?.primaryColor }} />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="flex-1 px-6">
                <div className="space-y-6">
                  <NavIcon
                    href={`/shop/${shop?.shopSlug}`}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    label="Shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavIcon
                    href={`/shop/${shop?.shopSlug}/blog`}
                    icon={<Newspaper className="w-6 h-6" />}
                    label="Blog"
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavIcon
                    href={`/shop/${shop?.shopSlug}/contact`}
                    icon={<PhoneForwarded className="w-6 h-6" />}
                    label="Contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}