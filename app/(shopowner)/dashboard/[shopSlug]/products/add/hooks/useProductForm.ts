import { useState, useEffect } from "react";
import { useShop } from "@/app/(shopowner)/shopContext";
import { Attribute, Category, ProductFormData } from "../types";

export function useProductForm() {
  const { shopId, shopType, shopSlug } = useShop();
  
  // Tab state
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Primary Details", "Optional Details", "Images"];
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    productSlug: "",
    description: "",
    price: "",
    inStock: true,
    attributes: {},
    images: [],
    categoryIds: []
  });
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  
  // Attribute schema
  const [attributeSchema, setAttributeSchema] = useState<Attribute[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Fetch attribute schema when shopType is available
  useEffect(() => {
    if (shopType) {
      fetchAttributeSchema(shopType);
    }
  }, [shopType]);

  // Fetch categories when shopId is available
  useEffect(() => {
    if (shopId) {
      fetchCategories(shopId);
    }
  }, [shopId]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Get attribute schema based on shop type
  const fetchAttributeSchema = async (type: string) => {
    setLoadingSchema(true);
    try {
      console.log("🔍 Fetching attributes for shop type:", type);
      const res = await fetch(`/api/shopowner/products/attributes?shopType=${type}`);
      const data = await res.json();
      console.log("Attribute schema response:", data);
      
      const fields = data.fields || [];
      setAttributeSchema(fields);
      
      // Initialize attributes object with empty values
      const initialAttributes: Record<string, any> = {};
      fields.forEach((field: Attribute) => {
        if (field.type === "boolean") {
          initialAttributes[field.name] = false;
        } else if (field.type === "select" && field.options?.length) {
          initialAttributes[field.name] = "";
        } else {
          initialAttributes[field.name] = "";
        }
      });
      
      setFormData(prev => ({
        ...prev,
        attributes: initialAttributes
      }));
      
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
    } finally {
      setLoadingSchema(false);
    }
  };

  // Fetch categories for dropdown
  const fetchCategories = async (id: number) => {
    try {
      console.log("🔍 Fetching categories for shopId:", id);
      const res = await fetch(`/api/shopowner/categories?shopId=${id}`);
      const data = await res.json();
      console.log("📦 Categories response:", data);
      setCategories(data.map((c: any) => ({ id: c.category_id, name: c.category_name })));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Handle category creation
  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    setShowCategoryForm(false);
  };

  // Reset form to initial state
  const resetForm = () => {
    // Clear all images preview URLs to prevent memory leaks
    formData.images.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });

    // Re-initialize attributes with empty values based on current schema
    const initialAttributes: Record<string, any> = {};
    attributeSchema.forEach((field: Attribute) => {
      if (field.type === "boolean") {
        initialAttributes[field.name] = false;
      } else if (field.type === "select" && field.options?.length) {
        initialAttributes[field.name] = "";
      } else {
        initialAttributes[field.name] = "";
      }
    });

    setFormData({
      productName: "",
      productSlug: "",
      description: "",
      price: "",
      inStock: true,
      attributes: initialAttributes,
      images: [],
      categoryIds: []
    });
    
    setSelectedCategoryId("");
    setActiveIndex(0);
    setErrors({});
  };

  // Validate Primary tab only
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

  // Validate full form before submission
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
    
    if (formData.images.length === 0) {
      newErrors.images = "At least one image is required";
    } else {
      const hasPrimary = formData.images.some(img => img.isPrimary);
      if (!hasPrimary) {
        newErrors.images = "A primary image is required";
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.productName || newErrors.productSlug || newErrors.price || Object.keys(newErrors).some(k => k.startsWith('attr.'))) {
        setActiveIndex(0);
      } else if (newErrors.images) {
        setActiveIndex(2);
      }
      return false;
    }
    
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError("");
    
    try {
      const productRes = await fetch('/api/shopowner/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          productName: formData.productName,
          productSlug: formData.productSlug,
          description: formData.description,
          price: formData.price,
          inStock: formData.inStock,
          attributes: formData.attributes
        })
      });

      const productData = await productRes.json();
      
      if (!productRes.ok) {
        throw new Error(productData.error || 'Failed to create product');
      }

      const productId = productData.product_id;
      console.log("✅ Product created with ID:", productId);

      // Upload images in parallel
      const imageFiles = formData.images.filter(img => img.file);
      
      if (imageFiles.length > 0) {
        console.log(`📸 Uploading ${imageFiles.length} images in parallel...`);
        
        const uploadPromises = imageFiles.map(async (image) => {
          const imageFormData = new FormData();
          imageFormData.append('image', image.file!);
          imageFormData.append('isPrimary', String(image.isPrimary));

          const imageRes = await fetch(`/api/shopowner/products/${productId}/images`, {
            method: 'POST',
            body: imageFormData
          });

          if (!imageRes.ok) {
            const error = await imageRes.json();
            console.error(`❌ Failed to upload image (primary: ${image.isPrimary}):`, error);
            return { success: false };
          } else {
            console.log(`✅ Image uploaded (primary: ${image.isPrimary})`);
            return { success: true };
          }
        });

        await Promise.all(uploadPromises);
      }

      // Add categories in parallel
      if (formData.categoryIds.length > 0) {
        console.log(`🏷️ Adding ${formData.categoryIds.length} categories in parallel...`);
        
        const categoryPromises = formData.categoryIds.map(async (categoryId) => {
          const catRes = await fetch(`/api/shopowner/products/${productId}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_id: categoryId })
          });

          if (!catRes.ok) {
            console.error(`❌ Failed to add category ${categoryId}:`, await catRes.json());
          } else {
            console.log(`✅ Category ${categoryId} added to product`);
          }
        });

        await Promise.all(categoryPromises);
      }

      console.log("🎉 Product creation complete!");
      resetForm();
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error("❌ Submit failed:", error);
      setSubmitError(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // Handle next/previous with validation
  const handleNext = () => {
    if (activeIndex === 0 && !validatePrimaryTab()) {
      return;
    }
    
    if (activeIndex < sections.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  // Handle tab click with validation
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
        alert("Please complete all required fields in Primary Details first");
        setActiveIndex(0);
        return;
      }
    }
    setActiveIndex(index);
  };

  return {
    // State
    activeIndex,
    setActiveIndex,
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
    submitError,
    showSuccess,
    shopSlug,
    shopId,
    shopType,
    
    // Handlers
    handleCategoryCreated,
    handleNext,
    handlePrevious,
    handleTabClick,
    resetForm,
  };
}