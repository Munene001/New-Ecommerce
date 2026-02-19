"use client";

import { useState, useRef, useEffect } from "react";
import { useProducts } from "@/lib/hooks/useProduct";
import StatsCards from "./statsCard";
import ProductsTable from "./productsTable";
import Button from "@/app/components/ui/button";
import { Plus, X } from "lucide-react";
import Link from "next/link";
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
    <div className="p-6 font-[Poppins] relative">
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

      <div className="flex gap-4 my-4">
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

        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="secondary"
            className="flex items-center gap-2 px-4 h-[59px]"
          >
            <X size={18} />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Message Banner - fixed at bottom in same position as bulk actions */}
      {message && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
          <div
            ref={messageRef}
            className={`flex items-center justify-between gap-4 px-6 py-3 rounded-full shadow-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon 
                icon={message.type === 'success' ? "mdi:check-circle" : "mdi:alert-circle"} 
                className={`w-5 h-5 ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`} 
              />
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className={`p-1 rounded-full hover:bg-black/5 transition-colors ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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