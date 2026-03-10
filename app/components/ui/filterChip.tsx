// app/(shop)/[shopSlug]/components/FilterChip.tsx
"use client";

import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  color: string;
}

export default function FilterChip({ label, onRemove, color }: FilterChipProps) {
  return (
    <div 
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
      style={{ backgroundColor: color }}
    >
      <span>{label}</span>
      <button onClick={onRemove} className="hover:opacity-80">
        <X size={14} />
      </button>
    </div>
  );
}