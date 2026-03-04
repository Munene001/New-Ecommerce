// app/(shop)/[shopSlug]/page.tsx
"use client";

import { useShop } from "../ShopContext";
import { useProducts } from "@/lib/hooks/useProduct";
import ProductCard from "./components/ProductCard";
import { useEffect, useState } from "react";
import { Search, Filter, X } from "lucide-react";

export default function ShopPage() {
  const { shop } = useShop();
  const [initialProducts, setInitialProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  console.log('1. Shop data:', shop);
  
  // Fetch initial products
  useEffect(() => {
    console.log('2. Shop ID:', shop?.shopId);
    
    if (!shop?.shopId) return;
    
    const fetchInitial = async () => {
      console.log('3. Fetching products for shop:', shop.shopId);
      try {
        const res = await fetch(`/api/shopowner/products?shopId=${shop.shopId}&limit=20`);
        const data = await res.json();
        console.log('4. Initial products response:', data);
        setInitialProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    const fetchCategories = async () => {
      console.log('5. Fetching categories for shop:', shop.shopId);
      try {
        const res = await fetch(`/api/shopowner/categories?shopId=${shop.shopId}`);
        const data = await res.json();
        console.log('6. Categories response:', data);
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchInitial();
    fetchCategories();
  }, [shop?.shopId]);
  
  const {
    products,
    loading,
    hasMore,
    loadMoreProducts,
    searchProducts,
    filterByCategory
  } = useProducts(initialProducts, shop?.shopId?.toString() || '');
  
  console.log('7. Products from hook:', products);
  console.log('8. Loading state:', loading);
  console.log('9. Initial products state:', initialProducts);
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProducts(searchTerm);
  };
  
  // Handle category filter
  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    filterByCategory(categoryId);
    setIsFilterOpen(false);
  };
  
  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    searchProducts('');
  };
  
  if (!shop) return <div>Loading shop...</div>;
  
  // Determine grid columns based on card style
  const getGridClass = () => {
    if (shop.productCardStyle === 'compact') {
      return 'grid-cols-1';
    }
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };
  
  return (
    <div className="min-h-screen font-[Poppins]">
      {/* Mobile Filter Sidebar */}
      {isFilterOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 p-6 shadow-xl md:hidden overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Categories */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryFilter('')}
                  className={`block w-full text-left px-3 py-2 rounded ${
                    selectedCategory === '' ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.id)}
                    className={`block w-full text-left px-3 py-2 rounded ${
                      selectedCategory === cat.id ? 'bg-black text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      
      <div className="container mx-auto px-4 py-6">
        {/* Header with title and active filters */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Welcome to {shop.shopName}
          </h1>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search - full width on mobile, flexible on desktop */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </form>
            
            {/* Filter Button - visible on mobile */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <Filter className="w-5 h-5" />
              Filters
              {selectedCategory && <span className="ml-1 w-2 h-2 bg-black rounded-full"></span>}
            </button>
            
            {/* Desktop Categories */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black transition flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Active Filters Tags (mobile) */}
          {(searchTerm || selectedCategory) && (
            <div className="flex flex-wrap gap-2 mt-3 md:hidden">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-full text-sm">
                  Search: {searchTerm}
                  <button onClick={() => {setSearchTerm(''); searchProducts('');}}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-full text-sm">
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => handleCategoryFilter('')}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Results count */}
        <p className="text-sm text-gray-600 mb-4">
          {products.length} {products.length === 1 ? 'product' : 'products'} found
        </p>
        
        {/* Products grid */}
        {products.length > 0 ? (
          <div className={`grid gap-4 md:gap-6 ${getGridClass()}`}>
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
        
        {/* Load more button */}
        {hasMore && products.length > 0 && (
          <div className="text-center mt-8">
            <button 
              onClick={loadMoreProducts}
              disabled={loading}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}