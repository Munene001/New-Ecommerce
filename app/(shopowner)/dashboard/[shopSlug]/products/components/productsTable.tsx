"use client";

import { useState, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import BulkActions from "@/app/components/ui/bulkAction";
import { Product } from "@/lib/types/product";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  shopSlug: string;
  selectedProducts: number[];
  onSelectAll: () => void;
  onSelectOne: (productId: number) => void;
  loadMore: () => void;
  hasMore: boolean;
  onBulkDelete?: (productIds: number[]) => void;
}

const SkeletonRow = () => (
  <div className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50/5 transition-colors min-w-full">
    <div className="w-[5%] px-4">
      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="w-[13%]">
      <div className="w-[98px] h-[67px] bg-gray-200 rounded-sm animate-pulse"></div>
    </div>
    <div className="w-[20%]">
      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
    </div>
    <div className="w-[10%]">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
    </div>
    <div className="w-[10%]">
      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
    <div className="w-[12%]">
      <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
    </div>
    <div className="w-[12%]">
      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
    <div className="w-[10%]">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
    </div>
    <div className="w-[8%]">
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
  onBulkDelete,
}: ProductsTableProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionValues, setActionValues] = useState<
    Record<number, string | number>
  >({});

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
    [loading, hasMore, loadMore],
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStockColor = (inStock: boolean) => {
    return inStock
      ? "bg-[#0FA965]/10 text-[#0FA965]"
      : "bg-red-500/10 text-red-500";
  };

  const getVariantCount = (product: Product): number => {
    if (product.product_type === "variable" && product.variants) {
      return product.variants.length;
    }
    return 0;
  };

  const getTotalStock = (product: Product): number => {
    if (product.product_type === "variable" && product.stock_info) {
      return product.stock_info.total || 0;
    }
    return product.stock_quantity || 0;
  };

  const handleBulkDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    if (onBulkDelete) {
      onBulkDelete(selectedProducts);
    }
  };

  const handleClearSelection = () => {
    if (selectedProducts.length === products.length) {
      onSelectAll();
    } else {
      products.forEach((product) => {
        if (selectedProducts.includes(product.product_id)) {
          onSelectOne(product.product_id);
        }
      });
    }
  };

  const handleActionChange = (value: string | number, productId: number) => {
    setActionValues((prev) => ({ ...prev, [productId]: value }));
    if (value === "update") {
      router.push(`/dashboard/${shopSlug}/products/${productId}/update`);
    } else if (value === "delete") {
      if (selectedProducts.length > 0) {
        if (selectedProducts.length === products.length) {
          onSelectAll();
        } else {
          selectedProducts.forEach((id) => onSelectOne(id));
        }
      }
      onSelectOne(productId);
    }
    setTimeout(() => {
      setActionValues((prev) => ({ ...prev, [productId]: "" }));
    }, 1000);
  };

  return (
    <div className="md:w-full relative">
      <BulkActions
        selectedCount={selectedProducts.length}
        onClearSelection={handleClearSelection}
        onDelete={handleBulkDeleteClick}
      />

      <div className="w-full overflow-x-auto">
        <div className="min-w-[1100px] md:min-w-full">
          {/* Table header */}
          <div className="flex flex-row border-b border-[#294248] h-[52px] items-center text-gray-900 font-medium text-sm bg-gray-50">
            <div className="w-[5%] px-4">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-[#0FA965] focus:ring-[#0FA965]"
                checked={
                  selectedProducts.length === products.length &&
                  products.length > 0
                }
                onChange={onSelectAll}
              />
            </div>
            <div className="w-[13%]">Image</div>
            <div className="w-[20%]">Product Name</div>
            <div className="w-[10%]">Type</div>
            <div className="w-[12%]">Price (KSh)</div>
            <div className="w-[10%]">Stock</div>
            <div className="w-[12%]">Created</div>
            <div className="w-[10%]">Status</div>
            <div className="w-[8%]">Actions</div>
          </div>

          {/* Table content */}
          {loading && products.length === 0 ? (
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
                  className="flex flex-row border-b border-[#294248] h-[72px] items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="w-[5%] px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#0FA965] focus:ring-[#0FA965]"
                      checked={selectedProducts.includes(product.product_id)}
                      onChange={() => onSelectOne(product.product_id)}
                    />
                  </div>

                  <div className="w-[13%]">
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

                  <div className="w-[20%] pr-4 min-w-0">
                    <div className="font-medium truncate text-gray-900">
                      {product.product_name}
                    </div>
                    {product.product_type === "variable" && (
                      <div className="text-xs text-gray-500 truncate">
                        {getVariantCount(product)} variant
                        {getVariantCount(product) > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  <div className="w-[8%]">
                    {product.product_type === "variable" ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-blue-600">
                          Variable
                        </span>
                        <span className="text-xs text-gray-500">
                          {getVariantCount(product)} variants
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        Simple
                      </span>
                    )}
                  </div>

                  <div className="w-[12%] pr-4 flex flex-col items-center justify-center text-center">
                    <div className="text-gray-900 font-medium">
                      {product.product_type === "variable" ? (
                        <div className="text-xs flex flex-col items-center justify-center">
                          <div>{product.display_price?.formatted || "N/A"}</div>
                          {product.discount_price && (
                            <div className="text-[#0FA965] text-xs">
                              {product.discount_price}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {product.discount_price ? (
                            <span className="text-[#0FA965]">
                              {product.discount_price}
                            </span>
                          ) : (
                            product.price
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-[10%] flex items-center justify-center text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStockColor(
                        product.in_stock,
                      )}`}
                    >
                      {product.product_type === "variable" ? (
                        <div className="flex flex-col items-center justify-center">
                          <span>{getTotalStock(product)} total</span>
                          <span className="text-xs font-normal opacity-90">
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      ) : product.in_stock ? (
                        "In Stock"
                      ) : (
                        "Out of Stock"
                      )}
                    </span>
                  </div>

                  <div className="w-[12%] px-2 text-gray-500 text-sm">
                    {formatDate(product.created_at)}
                  </div>

                  <div className="w-[10%]">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        product.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {product.status || "draft"}
                    </span>
                  </div>

                  <div className="w-[11%]">
                    <select
                      className="border border-black text-black rounded-sm p-1 text-sm"
                      value={actionValues[product.product_id] || ""}
                      onChange={(e) =>
                        handleActionChange(e.target.value, product.product_id)
                      }
                    >
                      <option className="text-black" value="">
                        Actions
                      </option>
                      <option value="update">Update</option>
                      {product.status === "draft" && (
                        <option value="publish">Publish</option>
                      )}
                      <option value="delete">Delete</option>
                    </select>
                  </div>
                </div>
              ))}

              {loading && products.length > 0 && (
                <div className="flex justify-center items-center py-4">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin w-6 h-6 text-magenta-dark"
                  />
                </div>
              )}

              {!hasMore && products.length > 0 && (
                <div className="text-center py-4 text-gray-500">
                  No more products to load
                </div>
              )}
            </div>
          ) : (
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedProducts.length} selected
              product(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
