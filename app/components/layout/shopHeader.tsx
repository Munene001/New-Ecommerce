"use client";

import { useShop } from "@/app/(shop)/ShopContext";
import {
  User,
  Heart,
  ShoppingCart,
  Menu,
  Newspaper,
  PhoneForwarded,
  X,
} from "lucide-react";
import { useState, useEffect, useContext, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import NavIcon from "../ui/navIcon";
import { ShopFilterContext } from "@/context/shopFilterContext";
import Link from "next/link";
import SearchBar from "../ui/searchBar";

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
  const pathname = usePathname();
  const filterContext = useContext(ShopFilterContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchInput, 1000);
  const isUserTyping = useRef(false);
  const prevDebouncedRef = useRef(debouncedSearch);

  const isShopHomePage = shop?.shopSlug ? pathname === `/${shop.shopSlug}` : false;

  // Focus handler: if not on shop homepage, navigate there with current search input
  const handleSearchFocus = () => {
    if (!isShopHomePage && shop?.shopSlug) {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }
      router.push(`/${shop.shopSlug}?${params.toString()}`);
    }
  };

  // Debounced effect (unchanged)
  useEffect(() => {
    if (!shop?.shopSlug) return;
    if (debouncedSearch === prevDebouncedRef.current) return;
    prevDebouncedRef.current = debouncedSearch;

    if (isShopHomePage && filterContext) {
      filterContext.searchProducts(debouncedSearch);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      } else {
        params.delete("search");
      }
      router.push(`/${shop.shopSlug}?${params.toString()}`);
    }
  }, [debouncedSearch, shop?.shopSlug, filterContext, router, searchParams, isShopHomePage]);

  // Sync input with URL (unchanged)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (!isUserTyping.current && searchInput !== urlSearch) {
      setSearchInput(urlSearch);
    }
    const timer = setTimeout(() => {
      isUserTyping.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, [searchParams, searchInput]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isUserTyping.current = true;
    setSearchInput(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    if (isShopHomePage && filterContext) {
      filterContext.searchProducts("");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      router.push(`/${shop?.shopSlug}?${params.toString()}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.shopSlug) return;

    if (isShopHomePage && filterContext) {
      filterContext.searchProducts(searchInput);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }
      router.push(`/${shop.shopSlug}?${params.toString()}`);
    }
  };

  const loading = filterContext?.loading || false;

  return (
    <header className="bg-white">
      {/* header message layer (unchanged) */}
      <div
        className="text-center text-[15px] h-[50px] font-bold font-[Inter] text-white flex items-center justify-center gap-2 rounded-b-sm"
        style={{ backgroundColor: `${shop?.secondaryColor}` }}
      >
        <span>✨</span>
        <span>{shop?.headerMessage || "Get Deals Upto 50% Off"}</span>
      </div>

      {/* main header */}
      <div className="mx-auto md:pt-5 md:px-4 pl-2 pr-3 py-4">
        <div className="hidden md:block">
          <div className="flex items-center justify-between w-full">
            {/* Search Bar - now with onFocus */}
            <div className="w-1/3">
              <SearchBar
                value={searchInput}
                onChange={handleInputChange}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
                onFocus={handleSearchFocus} // 👈 added
                loading={loading}
                placeholder="Search products..."
                className="w-[80%]"
              />
            </div>

            {/* shop name, icons, navigation (unchanged) */}
            <div className="w-1/3 flex text-center justify-center">
              <span className="text-[40px] leading-[65px] font-medium" style={{ color: shop?.primaryColor }}>
                {shop?.shopName}
              </span>
            </div>

            <div className="w-1/3 flex justify-end items-center gap-6">
              <Link href={`/${shop?.shopSlug}/profile`} className="hover:opacity-70 transition">
                <User className="w-7 h-7" style={{ color: shop?.primaryColor }} />
              </Link>
              <button className="hover:opacity-70 transition">
                <Heart className="w-7 h-7" style={{ color: shop?.primaryColor }} />
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

          <div className="flex justify-end mt-3">
            <nav className="flex gap-12 text-lg font-[Inter]" style={{ color: "var(--secondary)" }}>
              <NavIcon href={`/`} icon={<ShoppingCart />} label="Shop" />
              <NavIcon href={`/shop/${shop?.shopSlug}/blog`} icon={<Newspaper />} label="Blog" />
              <NavIcon href={`/shop/${shop?.shopSlug}/contact`} icon={<PhoneForwarded />} label="Contact" />
            </nav>
          </div>
        </div>

        {/* mobile layout (unchanged) */}
        <div className="flex md:hidden flex-col gap-4 py-2">
          <div className="flex items-center justify-between">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2">
              <Menu className="w-7 h-7" style={{ color: shop?.primaryColor }} />
            </button>
            <span className="text-3xl font-bold flex text-center" style={{ color: shop?.primaryColor }}>
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

      {/* mobile menu (unchanged) */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[85%] bg-white z-50 md:hidden shadow-2xl animate-slide-right">
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-6">
                <button onClick={() => setIsMobileMenuOpen(false)} className="hover:opacity-70 transition">
                  <X className="w-6 h-6" style={{ color: shop?.primaryColor }} />
                </button>
              </div>
              <nav className="flex-1 px-6">
                <div className="space-y-6">
                  <NavIcon href={`/shop/${shop?.shopSlug}`} icon={<ShoppingCart className="w-6 h-6" />} label="Shop" onClick={() => setIsMobileMenuOpen(false)} isMobile={true} />
                  <NavIcon href={`/shop/${shop?.shopSlug}/blog`} icon={<Newspaper className="w-6 h-6" />} label="Blog" onClick={() => setIsMobileMenuOpen(false)} isMobile={true} />
                  <NavIcon href={`/shop/${shop?.shopSlug}/contact`} icon={<PhoneForwarded className="w-6 h-6" />} label="Contact" onClick={() => setIsMobileMenuOpen(false)} isMobile={true} />
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}