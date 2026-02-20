"use client";

import { useState, useRef, useEffect } from "react";
import { useProducts } from "@/lib/hooks/useProduct";
import StatsCards from "./statsCard";
import ProductsTable from "./productsTable";
import Button from "@/app/components/ui/button";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    products,
    loading,
    hasMore,
    loadMoreProducts,
    searchProducts,
    filterByCategory,
    refreshProducts,
  } = useProducts(initialProducts, shopId.toString(), initialTotalPages);

  // Show bulk actions when products are selected
  useEffect(() => {
    setShowBulkActions(selectedProducts.length > 0);
  }, [selectedProducts]);

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        setMessage(null);
      }, 5000);
      
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
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
    setSelectedProducts([]);
    setMessage(null);
    searchProducts("");
    filterByCategory("");
  };

  const handleBulkDeleteClick = () => {
    // This will be handled by the modal in ProductsTable
  };

  const handleBulkDelete = async (productIds: number[]) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/shopowner/products?shopId=${shopId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete products');
      }

      const result = await response.json();
      
      if (result.success) {
        setSelectedProducts([]);
        await refreshProducts();
        setMessage({
          type: 'success',
          text: `Successfully deleted ${result.deletedCount} product(s)`
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to delete products'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = searchInput !== "" || categorySelect !== "";

  return (
    <div className="md:p-4 px-2  py-6 font-[Poppins] relative">
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

      <div className="flex gap-4 my-4 overflow-x-auto pb-2 md:pb-0">
  {/* Search input - fixed width on mobile, flexible on desktop */}
  <div className="flex-1 min-w-[280px] md:min-w-0 relative">
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

  {/* Category select - fixed width on mobile */}
  <select
    value={categorySelect}
    onChange={handleCategoryChange}
    className="w-48 md:w-64 border h-[59px] px-4 rounded focus:outline-none focus:ring-1 focus:ring-magenta-dark flex-shrink-0"
  >
    <option value="">All Categories</option>
    {categories.map((cat) => (
      <option key={cat.category_id} value={cat.category_id}>
        {cat.category_name}
      </option>
    ))}
  </select>

  {/* Reset button - fixed width on mobile */}
  {hasActiveFilters && (
    <Button
      onClick={handleReset}
      variant="secondary"
      className="flex items-center gap-2 px-4 h-[59px] flex-shrink-0"
    >
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

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}