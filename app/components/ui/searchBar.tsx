"use client";

import { Search, X, Loader2 } from "lucide-react";
import { FormEvent, InputHTMLAttributes } from "react";

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  onClear: () => void;
  loading?: boolean;
  placeholder?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>; // added
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  loading = false,
  placeholder = "Search products...",
  className = "",
  onFocus, // destructure
  ...props
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus} // attach
        placeholder={placeholder}
        className="w-full pl-4 pr-12 py-4 border border-[var(--secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]"
        {...props}
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