'use client';

import { useState, useRef, useEffect } from "react";
import { useDashboardProducts } from "@/lib/hooks/useProductDashboard";
import StatsCards from "./statsCard";
import ProductsTable from "./productsTable";
import Button from "@/app/components/ui/button";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";

interface Category {
  category_id: number;
  category_name: string;
}

interface ProductsClientProps {
  shopId: number;
  shopSlug: string;
  categories: Category[];
}

export default function ProductsClient({
  shopId,
  shopSlug,
  categories,
}: ProductsClientProps) {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [categorySelect, setCategorySelect] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("published");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true); // Prevents initial mount debouncer loop clash

  const {
    products,
    stats,
    loading,
    hasMore,
    loadMoreProducts,
    searchProducts,
    filterByCategory,
    filterByStatus,
    refreshProducts,
    resetProducts,
  } = useDashboardProducts(shopId.toString(), "published");

  // Debouncer Effect for Search Input (Skips the empty hit on initial load setup)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (searchInput === "") return;
    }

    const delayDebounceFn = setTimeout(() => {
      searchProducts(searchInput);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, searchProducts]);

  useEffect(() => {
    if (message) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMessage(null), 5000);
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message]);

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.product_id));
    }
  };

  const handleSelectOne = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategorySelect(value);
    setSelectedProducts([]); // Flush selection states when view boundaries switch
    filterByCategory(value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    setSelectedProducts([]); // Flush selection states when view boundaries switch
    filterByStatus(value);
  };

  const handleReset = () => {
    setSearchInput("");
    setCategorySelect("");
    setStatusFilter("published");
    setSelectedProducts([]);
    setMessage(null);
    resetProducts(); 
  };

  const handleBulkDelete = async (productIds: number[]) => {
    if (isDeleting) return;
    setIsDeleting(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/shopowner/products?shopId=${shopId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete products');
      }

      const result = await response.json();
      if (result.success) {
        setSelectedProducts([]);
        refreshProducts();
        setMessage({
          type: 'success',
          text: `Successfully deleted ${result.deletedCount} product(s)`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete products'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = searchInput !== "" || categorySelect !== "" || statusFilter !== "published";

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      <StatsCards
        totalProducts={stats.totalProducts}
        totalCategories={categories.length}
        totalInventoryItems={stats.totalInventoryItems}
        totalInstock={stats.totalInstock}
        totalOutOfStock={stats.totalOutOfStock}
        totalDrafts={stats.totalDrafts}
      />

      <div className="flex justify-end pt-6">
        <Link href={`/dashboard/${shopSlug}/products/add`}>
          <Button className="flex flex-row gap-2 items-center justify-center" variant="secondary">
            <Plus size={18} />
            <span>Add New Product</span>
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 my-4 overflow-x-auto pb-2 md:pb-0">
        <div className="flex-1 min-w-[280px] md:min-w-0 relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-black/70 px-4 h-[59px] pl-13 rounded bg-white text-black placeholder-black/80"
          />
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-three w-7 h-7" />
        </div>

        <select
          value={categorySelect}
          onChange={handleCategoryChange}
          className="w-48 md:w-64 border border-black h-[59px] text-black px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark flex-shrink-0"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.category_name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="w-40 border border-black h-[59px] text-black px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark flex-shrink-0"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>

        {hasActiveFilters && (
          <Button onClick={handleReset} variant="secondary" className="flex items-center gap-2 px-4 h-[59px] flex-shrink-0">
            <X size={18} />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <ProductsTable
        products={products}
        loading={loading}
        shopSlug={shopSlug}
        selectedProducts={selectedProducts}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        loadMore={loadMoreProducts}
        hasMore={hasMore}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
}