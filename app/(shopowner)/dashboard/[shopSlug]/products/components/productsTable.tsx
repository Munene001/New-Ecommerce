"use client";

import { useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface ProductsTableProps {
  products: any[];
  loading: boolean;
  shopSlug: string;
  selectedProducts: number[];
  onSelectAll: () => void;
  onSelectOne: (productId: number) => void;
  loadMore: () => void;
  hasMore: boolean;
}

// Skeleton row component
const SkeletonRow = () => (
  <div className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50/5 transition-colors min-w-full">
    <div className="w-[5.7%] px-4">
      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="w-[13.5%]">
      <div className="w-[98px] h-[67px] bg-gray-200 rounded-sm animate-pulse"></div>
    </div>
    <div className="w-[21%]">
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
    </div>
    <div className="w-[21%]">
      <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
    </div>
    <div className="w-[12%]">
      <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
    </div>
    <div className="w-[11%] px-2">
      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
    <div className="w-[9.5%] px-2">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
    </div>
    <div className="w-[6.3%]">
      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

export default function ProductsTable({
  products,
  loading,
  shopSlug,
  selectedProducts,
  onSelectAll,
  onSelectOne,
  loadMore,
  hasMore,
}: ProductsTableProps) {
  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get stock status color
  const getStockColor = (inStock: boolean) => {
    return inStock
      ? "bg-[#0FA965]/10 text-[#0FA965]"
      : "bg-red-500/10 text-red-500";
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-row border-b border-[#294248] h-[52px] items-center text-[#4B5563] font-medium text-sm min-w-full bg-gray-50">
        <div className="w-[5.7%] px-4">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-[#0FA965] focus:ring-[#0FA965]"
            checked={
              selectedProducts.length === products.length && products.length > 0
            }
            onChange={onSelectAll}
          />
        </div>
        <div className="w-[13.5%]">Image</div>
        <div className="w-[21%]">Product Name</div>
        <div className="w-[12%]">Price(ksh)</div>
        <div className="w-[12%]">Discount</div>
        <div className="w-[12%]">Stock</div>
        <div className="w-[11%]">Created</div>
        <div className="w-[9.5%]">Actions</div>
      </div>

      {/* Product rows */}
      {loading && products.length === 0 ? (
        // Initial loading skeletons
        <div className="mt-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : products.length > 0 ? (
        <div className="mt-2">
          {products.map((product, index) => (
            <div
              key={product.product_id}
              ref={index === products.length - 1 ? lastProductRef : null}
              className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50 transition-colors min-w-full"
            >
              {/* Checkbox - 5.7% */}
              <div className="w-[5.7%] px-4">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#0FA965] focus:ring-[#0FA965]"
                  checked={selectedProducts.includes(product.product_id)}
                  onChange={() => onSelectOne(product.product_id)}
                />
              </div>

              {/* Image - 13.5% */}
              <div className="w-[13.5%]">
                {product.images && product.images.length > 0 ? (
                  <div
                    className="w-[98px] h-[67px] bg-gray-100 rounded-sm overflow-hidden"
                    style={{
                      backgroundImage: `url(/api/shopowner/products/${product.product_id}/images/primary?w=200)`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  <div className="w-[98px] h-[67px] bg-gray-100 rounded-sm flex items-center justify-center text-gray-400">
                    <Icon icon="mdi:image-off" className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Product Name & Slug - 21% */}
              <div className="w-[21%] pr-4">
                <div className="font-medium text-gray-900">
                  {product.product_name}
                </div>
                <div className="text-sm text-gray-500">
                  {product.product_slug}
                </div>
              </div>

              {/* Price - 12% */}
              <div className="w-[12%] pr-4">
                <div className="text-gray-900 font-medium">{product.price}</div>
              </div>

              {/* Discount - 12% */}
              <div className="w-[12%] pr-4">
                {product.discount_price ? (
                  <div className="text-[#0FA965] font-medium">
                    ${product.discount_price}
                  </div>
                ) : (
                  <div className="text-gray-400">—</div>
                )}
              </div>

              {/* Stock - 12% */}
              <div className="w-[12%]">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStockColor(
                    product.in_stock
                  )}`}
                >
                  {product.in_stock ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              {/* Created Date - 11% */}
              <div className="w-[11%] px-2 text-gray-500 text-sm">
                {formatDate(product.created_at)}
              </div>

              {/* Actions - 9.5% */}
              <div className="w-[9.5%]">
                <Link
                  href={`/dashboard/${shopSlug}/products/${product.product_id}/edit`}
                >
                  <button className="p-2 hover:bg-[#0FA965]/10 rounded-md transition-colors group">
                    <Icon
                      icon="mdi:pencil"
                      className="w-5 h-5 text-gray-500 group-hover:text-[#0FA965]"
                    />
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {/* Loading more indicator */}
          {loading && products.length > 0 && (
            <div className="flex justify-center items-center py-4">
              <Icon
                icon="mdi:loading"
                className="animate-spin w-6 h-6 text-magenta-dark"
              />
              <span className="ml-2 text-gray-500 animate-pulse">
                
              </span>
            </div>
          )}

          {/* No more products message */}
          {!hasMore && products.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              No more products to load
            </div>
          )}
        </div>
      ) : (
        // No products found
        <div className="flex flex-col justify-center items-center h-64 text-gray-500">
          <Icon
            icon="mdi:package-variant"
            className="w-16 h-16 mb-4 text-gray-400"
          />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
}
