"use client";

import { useShop } from "@/app/(shop)/ShopContext";
import { User, Heart, ShoppingCart, Menu, Newspaper, PhoneForwarded, X } from "lucide-react";
import { useState, useEffect, useContext, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavIcon from "../ui/navIcon";
import { ShopFilterContext } from "@/context/shopFilterContext";
import Link from "next/link";
import HeaderMessage from "./headerMessage";
import SearchBar from "../ui/searchBar";

// Simple debounce hook (only needed for fallback)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ShopHeader() {
  const { shop } = useShop();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterContext = useContext(ShopFilterContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine if we are inside a shop page with filter context
  const hasContext = !!filterContext;

  // For pages without context, we use local state and handle URL navigation
  const [localSearchInput, setLocalSearchInput] = useState(searchParams.get("search") || "");
  const debouncedLocalSearch = useDebounce(localSearchInput, 500);

  // Refs for local state only
  const isUserTyping = useRef(false);
  const prevDebouncedRef = useRef(debouncedLocalSearch);

  // Use context state if available, otherwise local
  const searchInput = hasContext ? filterContext.searchInput : localSearchInput;
  const setSearchInput = hasContext ? filterContext.setSearchInput : setLocalSearchInput;
  const loading = hasContext ? filterContext.loading : false;

  // For local-only: Update URL when debounced search changes
  useEffect(() => {
    if (hasContext) return; // Context handles its own debounce and API calls

    if (!shop?.shopSlug) return;
    if (debouncedLocalSearch === prevDebouncedRef.current) return;
    prevDebouncedRef.current = debouncedLocalSearch;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedLocalSearch.trim()) {
      params.set("search", debouncedLocalSearch.trim());
    } else {
      params.delete("search");
    }
    router.push(`/${shop.shopSlug}?${params.toString()}`, { scroll: false });
  }, [debouncedLocalSearch, hasContext, shop?.shopSlug, router, searchParams]);

  // For local-only: Sync input when URL changes externally (e.g., back button)
  useEffect(() => {
    if (hasContext) return;

    const urlSearch = searchParams.get("search") || "";
    if (!isUserTyping.current && localSearchInput !== urlSearch) {
      setLocalSearchInput(urlSearch);
    }
    const timer = setTimeout(() => {
      isUserTyping.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, [searchParams, localSearchInput, hasContext]);

  // Handlers work the same for both cases (they just call setSearchInput)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasContext) {
      isUserTyping.current = true;
    }
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.shopSlug) return;
    // The debounced effect will handle the search
  };

  return (
    <header className="bg-white">
      <HeaderMessage
        message={shop?.headerMessage || ""}
        secondaryColor={shop?.secondaryColor || "#000"}
      />

      {/* Main Header - Desktop & Mobile Base */}
      <div className="mx-auto md:pt-5 md:px-4 pl-2 pr-3 py-4">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between w-full">
            {/* Search Bar - Left section */}
            <div className="w-1/3">
              <SearchBar
                value={searchInput}
                onChange={handleInputChange}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
                loading={loading}
                secondaryColor={shop?.secondaryColor || "#000"}
                shopSlug={shop?.shopSlug || ""}
                variant="desktop"
              />
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
              <Link
                href={`/${shop?.shopSlug}/profile`}
                className="hover:opacity-70 transition"
              >
                <User
                  className="w-7 h-7"
                  style={{ color: shop?.primaryColor }}
                />
              </Link>
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
                  className="absolute animate-bounce -top-2 -right-2 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  0
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="flex justify-end mt-3">
            <nav
              className="flex gap-12 text-lg font-[Inter]"
              style={{ color: "var(--secondary)" }}
            >
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

        {/* Mobile Layout - NO SEARCH BAR HERE */}
        <div className="flex md:hidden flex-col gap-4 py-2">
          {/* Top row: menu, shop name, cart */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2"
            >
              <Menu className="w-7 h-7" style={{ color: shop?.primaryColor }} />
            </button>

            <span
              className="text-3xl font-bold flex text-center"
              style={{ color: shop?.primaryColor }}
            >
              {shop?.shopName}
            </span>

            <button className="relative hover:opacity-70 transition">
              <span style={{ color: shop?.primaryColor }}>
                <ShoppingCart className="w-7 h-7" />
              </span>
              <span
                className="absolute -top-2 animate-bounce -right-2 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - unchanged */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85%] bg-white z-50 md:hidden shadow-2xl animate-slide-right">
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:opacity-70 transition"
                >
                  <X
                    className="w-6 h-6"
                    style={{ color: shop?.primaryColor }}
                  />
                </button>
              </div>
              <nav className="flex-1 px-6">
                <div className="space-y-6">
                  <NavIcon
                    href={`/${shop?.shopSlug}`}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    label="Shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavIcon
                    href={`/${shop?.shopSlug}/blog`}
                    icon={<Newspaper className="w-6 h-6" />}
                    label="Blog"
                    onClick={() => setIsMobileMenuOpen(false)}
                    isMobile={true}
                  />
                  <NavIcon
                    href={`/${shop?.shopSlug}/contact`}
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