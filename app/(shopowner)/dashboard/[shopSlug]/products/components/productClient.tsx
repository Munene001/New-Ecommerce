"use client";

import { useState } from "react";
import { useProducts } from "@/lib/hooks/useProduct";
import StatsCards from "./statsCard";
import ProductsTable from "./productsTable";
import Button from "@/app/components/ui/button";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import FormField from "@/app/components/ui/formField";
import { Icon } from "@iconify/react";

interface ProductsClientProps {
  initialProducts: any[];
  shopId: number;
  shopSlug: string;
  totalProducts: number;
  totalCategories: number;
  totalDiscounted: number;
  totalInstock: number;
  categories: any[];
  initialPage: number;
  totalPages: number;
}

export default function ProductsClient({
  initialProducts,
  shopId,
  shopSlug,
  totalProducts,
  totalCategories,
  totalDiscounted,
  totalInstock,
  categories,
  initialPage,
  totalPages: initialTotalPages,
}: ProductsClientProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [categorySelect, setCategorySelect] = useState("");

  const {
    products,
    loading,
    hasMore,
    loadMoreProducts,
    searchProducts,
    filterByCategory,
  } = useProducts(initialProducts, shopId.toString(), initialTotalPages);

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.product_id));
    }
  };

  const handleSelectOne = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    searchProducts(value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategorySelect(value);
    filterByCategory(value);
  };

  const handleReset = () => {
    setSearchInput("");
    setCategorySelect("");
    searchProducts(""); // Clear search
    filterByCategory(""); // Clear category filter (pass empty string for "All Categories")
  };

  const hasActiveFilters = searchInput !== "" || categorySelect !== "";

  return (
    <div className="p-6 font-[Poppins]">
      {/* Stats Cards - Static (no skeleton needed) */}
      <StatsCards
        totalProducts={totalProducts}
        totalCategories={totalCategories}
        totalDiscounted={totalDiscounted}
        totalInstock={totalInstock}
        currentShown={products.length}
      />

      <div className="flex justify-end pt-6">
        <Link href={`/dashboard/${shopSlug}/products/add`}>
          <Button
            className="flex flex-row gap-2 items-center justify-center"
            variant="secondary"
          >
            <Plus size={18} />
            <span>Add New Product</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 my-4">
        {/* Search input with icon */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={handleSearch}
            className="w-full border border-black/70 px-4 h-[59px] pl-13 rounded bg-white text-black placeholder-black/80"
          />
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-three w-7 h-7"
          />
        </div>

        {/* Category select */}
        <select
          value={categorySelect}
          onChange={handleCategoryChange}
          className="w-64 border h-[59px] px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>

        {/* Reset button - only show when filters are active */}
        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="secondary"
            className="flex items-center  gap-2 px-4 h-[59px]"
          >
            <X size={18} />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Products Table with Skeleton Loader */}
      <ProductsTable
        products={products}
        loading={loading}
        shopSlug={shopSlug}
        selectedProducts={selectedProducts}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        loadMore={loadMoreProducts}
        hasMore={hasMore}
      />
    </div>
  );
}