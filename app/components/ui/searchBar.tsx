"use client";

import { Search, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  loading: boolean;
  secondaryColor: string;
  shopSlug: string;
  variant: "desktop" | "mobile";
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  loading,
  secondaryColor,
  shopSlug,
  variant,
  placeholder = "Search products...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when coming from focusSearch param
  useEffect(() => {
    if (searchParams.get("focusSearch") === "true") {
      inputRef.current?.focus();
      // Remove the param from URL without triggering navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete("focusSearch");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  const handleFocus = () => {
    const homePath = `/${shopSlug}`;
    const currentPath = window.location.pathname;
    // Navigate to home if not already there (ignore trailing slash)
    if (currentPath !== homePath && currentPath !== homePath + "/") {
      router.push(`${homePath}?focusSearch=true`);
    }
  };

  if (variant === "mobile") {
    return (
      <form onSubmit={onSubmit} className="p-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none  focus:ring-opacity-50 transition-all"
            style={
              {
              
                borderColor: secondaryColor,
              } as React.CSSProperties
            }
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {value && !loading && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </form>
    );
  }

  // Desktop variant
  return (
    <form onSubmit={onSubmit} className="relative w-[80%]">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full pl-4 pr-12 py-4 border border-[var(--secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {loading && <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />}
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="hover:opacity-70 transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <Search className="w-5 h-5 text-gray-600" />
      </div>
    </form>
  );
}