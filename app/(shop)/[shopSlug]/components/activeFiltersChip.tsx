"use client";

import { X } from "lucide-react";
import FilterChip from "@/app/components/ui/filterChip";

// Define types (adjust based on your actual data structures)
interface Category {
  id: number | string; // Allow both number or string, but we'll handle comparison
  name: string;
}

interface Shop {
  secondaryColor: string;
  categories: Category[];
}

interface ActiveFilters {
  search: string;
  categories: string[]; // Explicitly string[] from URL
  priceRange: { min: number; max: number } | null;
  sortBy: string;
  inStock: boolean;
}

interface ActiveFiltersChipsProps {
  activeFilters: ActiveFilters;
  shop: Shop;
  onRemoveSearch: () => void;
  onRemoveCategory: (catId: string) => void;
  onRemovePriceRange: () => void;
  onRemoveSort: () => void;
  onRemoveInStock: () => void;
  onClearAll: () => void;
  totalCount: number;
}

export default function ActiveFiltersChips({
  activeFilters,
  shop,
  onRemoveSearch,
  onRemoveCategory,
  onRemovePriceRange,
  onRemoveSort,
  onRemoveInStock,
  onClearAll,
  totalCount,
}: ActiveFiltersChipsProps) {
  const hasAnyFilter =
    activeFilters.search !== "" ||
    activeFilters.categories.length > 0 ||
    activeFilters.priceRange !== null ||
    activeFilters.sortBy !== "newest" ||
    activeFilters.inStock;

  return (
    <div className="mb-4 space-y-2">
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Search chip */}
          {activeFilters.search && (
            <FilterChip
              label={`"${activeFilters.search}"`}
              onRemove={onRemoveSearch}
            />
          )}

          {/* Category chips - now properly typed */}
          {activeFilters.categories.map((catId: string) => {
            
            const category = shop.categories.find(
              (c) => String(c.id) === String(catId)
            );
            return (
              <FilterChip
                key={catId}
                label={category ? category.name : `Category ${catId}`}
                onRemove={() => onRemoveCategory(catId)}
              />
            );
          })}

          {/* Price range chip */}
          {activeFilters.priceRange && (
            <FilterChip
              label={`Ksh ${activeFilters.priceRange.min.toLocaleString()} – ${activeFilters.priceRange.max.toLocaleString()}`}
              onRemove={onRemovePriceRange}
            />
          )}

          {/* Sort chip */}
          {activeFilters.sortBy !== "newest" && (
            <FilterChip
              label={`Sort: ${
                activeFilters.sortBy === "price_low"
                  ? "Price low"
                  : activeFilters.sortBy === "price_high"
                  ? "Price high"
                  : activeFilters.sortBy === "oldest"
                  ? "Oldest"
                  : "Newest"
              }`}
              onRemove={onRemoveSort}
            />
          )}

          {/* In stock chip */}
          {activeFilters.inStock && (
            <FilterChip label="In stock" onRemove={onRemoveInStock} />
          )}

          {/* Clear all button */}
          <button
            onClick={onClearAll}
            className="text-sm text-white flex items-center gap-1 ml-auto px-2 py-1 rounded"
            style={{ backgroundColor: shop.secondaryColor }}
          >
            <X size={14} />
            Clear all
            
          </button>
        </div>
      )}
    </div>
  );
}
