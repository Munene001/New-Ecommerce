"use client";

import { X } from "lucide-react";
import FilterChip from "@/app/components/ui/filterChip";
import Button from "@/app/components/ui/button";

interface ActiveFilterChipsProps {
  activeFilters: any; 
  categories: Array<{ id: string | number; name: string }>;
  totalCount: number;
  onRemoveSearch: () => void;
  onRemoveCategory: (categoryId: string) => void | Promise<void>;
  onRemovePriceRange: () => void;
  onRemoveSort: () => void;
  onRemoveInStock: () => void;
  onClearAll: () => void;
  secondaryColor: string;
}

export default function ActiveFilterChips({
  activeFilters,
  categories,
  totalCount,
  onRemoveSearch,
  onRemoveCategory,
  onRemovePriceRange,
  onRemoveSort,
  onRemoveInStock,
  onClearAll,
  secondaryColor,
}: ActiveFilterChipsProps) {
  const hasActiveFilters =
    activeFilters.search ||
    activeFilters.categories.length > 0 ||
    activeFilters.priceRange ||
    activeFilters.sortBy !== "newest" ||
    activeFilters.inStock;

  if (!hasActiveFilters) return null;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search chip */}
        {activeFilters.search && (
          <FilterChip
            label={`"${activeFilters.search}"`}
            onRemove={onRemoveSearch}
            color={secondaryColor}
          />
        )}

        {/* Category chips - with type-safe ID handling */}
        {activeFilters.categories.map((catId: unknown) => {
          const catIdStr = String(catId);
          const category = categories.find((c) => String(c.id) === catIdStr);
          if (!category) return null;
          return (
            <FilterChip
              key={catIdStr}
              label={category.name}
              onRemove={() => onRemoveCategory(catIdStr)} 
              color={secondaryColor}
            />
          );
        })}

        {/* Price range chip */}
        {activeFilters.priceRange && (
          <FilterChip
            label={`Ksh ${activeFilters.priceRange.min.toLocaleString()} – ${activeFilters.priceRange.max.toLocaleString()}`}
            onRemove={onRemovePriceRange}
            color={secondaryColor}
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
            color={secondaryColor}
          />
        )}

        {/* In stock chip */}
        {activeFilters.inStock && (
          <FilterChip
            label="In stock"
            onRemove={onRemoveInStock}
            color={secondaryColor}
          />
        )}

        {/* Clear all button */}
        <Button
          onClick={onClearAll}
          className="text-sm bg-black text-white flex items-center gap-1 ml-auto"
        >
          Clear all
          <X size={14} />
        </Button>
      </div>

      {/* Result count */}
      <div className="text-sm text-gray-500">
        {totalCount} {totalCount === 1 ? "product" : "products"} found
      </div>
    </div>
  );
}