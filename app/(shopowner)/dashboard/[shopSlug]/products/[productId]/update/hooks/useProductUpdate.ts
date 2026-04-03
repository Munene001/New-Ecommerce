"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { useAuth } from "@/context/authcontext";
import { Attribute, Category, ProductFormData } from "../../../add/types";

export function useProductUpdate() {
  const { shopId, shopType, shopSlug } = useShop();
  const params = useParams();
  const productId = params.productId as string;
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const warningRef = useRef<HTMLDivElement>(null);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Primary Details", "Optional Details"];
  
  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    productSlug: "",
    description: "",
    price: "",
    discountPrice: "",
    inStock: true,
    attributes: {},
    images: [],
    categoryIds: []
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  
  const [attributeSchema, setAttributeSchema] = useState<Attribute[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [tabWarning, setTabWarning] = useState<{text: string; type: 'success' | 'error'} | null>(null);
  
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, router]);

  const showWarning = (message: string, type: 'success' | 'error' = 'error') => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    setTabWarning({ text: message, type });
    scrollToWarning();
    warningTimerRef.current = setTimeout(() => {
      setTabWarning(null);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, []);

  const scrollToWarning = () => {
    setTimeout(() => {
      if (warningRef.current) {
        warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const fetchProduct = useCallback(async () => {
    setIsLoadingProduct(true);
    try {
      const productRes = await fetch(`/api/shopowner/products/${productId}`);
      if (!productRes.ok) throw new Error('Failed to fetch product');
      const productData = await productRes.json();

      const categoriesRes = await fetch(`/api/shopowner/products/${productId}/categories`);
      if (!categoriesRes.ok) throw new Error('Failed to fetch product categories');
      const categoryData = await categoriesRes.json();

      const attributes = typeof productData.attributes === 'string' 
        ? JSON.parse(productData.attributes) 
        : productData.attributes || {};

      setFormData({
        productName: productData.product_name || "",
        productSlug: productData.product_slug || "",
        description: productData.description || "",
        price: productData.price?.toString() || "",
        discountPrice: productData.discount_price?.toString() || "",
        inStock: productData.in_stock === 1 || productData.in_stock === true,
        attributes: attributes,
        images: [],
        categoryIds: categoryData.map((c: { category_id: number }) => c.category_id)
      });

    } catch (error) {
      console.error("Failed to fetch product:", error);
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load product data'
      });
    } finally {
      setIsLoadingProduct(false);
    }
  }, [productId]);

  // Fetch product data
  useEffect(() => {
    if (productId && shopId && isAuthenticated) {
      fetchProduct();
    }
  }, [productId, shopId, isAuthenticated, fetchProduct]);

  const fetchAttributeSchema = async (type: string) => {
    setLoadingSchema(true);
    try {
      const res = await fetch(`/api/shopowner/products/attributes?shopType=${type}`);
      const data = await res.json();
      const fields = data.fields || [];
      setAttributeSchema(fields);
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
    } finally {
      setLoadingSchema(false);
    }
  };

  // Fetch attribute schema
  useEffect(() => {
    if (shopType && isAuthenticated) {
      fetchAttributeSchema(shopType);
    }
  }, [shopType, isAuthenticated]);

  const fetchCategories = async (id: number) => {
    try {
      const res = await fetch(`/api/shopowner/categories?shopId=${id}`);
      const data = await res.json();
      setCategories(data.map((c: { category_id: number; category_name: string }) => ({ 
        id: c.category_id, 
        name: c.category_name 
      })));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Fetch categories
  useEffect(() => {
    if (shopId && isAuthenticated) {
      fetchCategories(shopId);
    }
  }, [shopId, isAuthenticated]);

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    setShowCategoryForm(false);
    showWarning("Category created successfully!", 'success');
  };

  const handleCategoryError = (errorMessage: string) => {
    showWarning(errorMessage, 'error');
  };

  const validatePrimaryTab = (): boolean => {
    const primaryErrors: Record<string, string> = {};
    if (!formData.productName.trim()) {
      primaryErrors.productName = "Product name is required";
    }
    if (!formData.productSlug.trim()) {
      primaryErrors.productSlug = "Product slug is required";
    }
    if (!formData.price || Number(formData.price) <= 0) {
      primaryErrors.price = "Valid price is required";
    }
    if (formData.discountPrice && Number(formData.discountPrice) < 0) {
      primaryErrors.discountPrice = "Discount price cannot be negative";
    }
    if (formData.discountPrice && Number(formData.discountPrice) >= Number(formData.price)) {
      primaryErrors.discountPrice = "Discount price must be less than regular price";
    }
    attributeSchema.filter(f => f.required).forEach(field => {
      const value = formData.attributes[field.name];
      if (field.type === 'boolean') return;
      if (!value || value.toString().trim() === '') {
        primaryErrors[`attr.${field.name}`] = `${field.label} is required`;
      }
    });
    setErrors(primaryErrors);
    return Object.keys(primaryErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.productName.trim()) {
      newErrors.productName = "Product name is required";
    }
    if (!formData.productSlug.trim()) {
      newErrors.productSlug = "Product slug is required";
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
    attributeSchema.filter(f => f.required).forEach(field => {
      const value = formData.attributes[field.name];
      if (field.type === 'boolean') return;
      if (!value || value.toString().trim() === '') {
        newErrors[`attr.${field.name}`] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeCategory = async (categoryId: number) => {
    try {
      const res = await fetch(`/api/shopowner/products/${productId}/categories?categoryId=${categoryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove category');
      }

      setFormData(prev => ({
        ...prev,
        categoryIds: prev.categoryIds.filter(id => id !== categoryId)
      }));

      showWarning("Category removed successfully", 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove category';
      showWarning(errorMessage, 'error');
    }
  };

  const addCategory = async (categoryId: number) => {
    try {
      const res = await fetch(`/api/shopowner/products/${productId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category_id: categoryId })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add category');
      }

      setFormData(prev => ({
        ...prev,
        categoryIds: [...prev.categoryIds, categoryId]
      }));

      setSelectedCategoryId("");
      showWarning("Category added successfully", 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category';
      showWarning(errorMessage, 'error');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showWarning("Please fix the errors before submitting", 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/shopowner/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: formData.productName,
          productSlug: formData.productSlug,
          description: formData.description,
          price: formData.price,
          discountPrice: formData.discountPrice || null,
          inStock: formData.inStock,
          attributes: formData.attributes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }
      
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Product has been updated successfully.'
      });
    } catch (error) {
      console.error("❌ Update failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update product";
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeIndex === 0 && !validatePrimaryTab()) {
      showWarning("Please fill out all required fields before proceeding", 'error');
      return;
    }
    setTabWarning(null);
    if (activeIndex < sections.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setTabWarning(null);
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleTabClick = (index: number) => {
    if (index > 0) {
      const hasPrimaryErrors = 
        !formData.productName.trim() ||
        !formData.productSlug.trim() ||
        !formData.price || Number(formData.price) <= 0 ||
        attributeSchema.filter(f => f.required).some(field => {
          if (field.type === 'boolean') return false;
          const value = formData.attributes[field.name];
          return !value || value.toString().trim() === '';
        });
      if (hasPrimaryErrors) {
        showWarning("Please complete all required fields in Primary Details first", 'error');
        return;
      }
    }
    setTabWarning(null);
    setActiveIndex(index);
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (modalState.type === 'success') {
      // Optionally redirect to products list
      // router.push(`/dashboard/${shopSlug}/products`);
    }
  };

  return {
    activeIndex,
    sections,
    formData,
    setFormData,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    showCategoryForm,
    setShowCategoryForm,
    attributeSchema,
    loadingSchema,
    loading,
    errors,
    shopSlug,
    shopId,
    shopType,
    tabWarning,
    modalState,
    warningRef,
    showWarning,
    isLoadingProduct,
    
    handleCategoryCreated,
    handleCategoryError,
    handleNext,
    handlePrevious,
    handleTabClick,
    closeModal,
    removeCategory,
    addCategory,
  };
}