import { useState, useEffect, useRef } from "react";
import { useShop } from "@/app/(shopowner)/shopContext";
import { Attribute, Category, ProductFormData } from "../types";

export function useProductForm() {
  const { shopId, shopType, shopSlug } = useShop();
  
  const warningRef = useRef<HTMLDivElement>(null);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Primary Details", "Optional Details", "Images"];
  
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
        warningRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  useEffect(() => {
    if (shopType) {
      fetchAttributeSchema(shopType);
    }
  }, [shopType]);

  useEffect(() => {
    if (shopId) {
      fetchCategories(shopId);
    }
  }, [shopId]);

  const fetchAttributeSchema = async (type: string) => {
    setLoadingSchema(true);
    try {
      const res = await fetch(`/api/shopowner/products/attributes?shopType=${type}`);
      const data = await res.json();
      
      const fields = data.fields || [];
      setAttributeSchema(fields);
      
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

  const fetchCategories = async (id: number) => {
    try {
      const res = await fetch(`/api/shopowner/categories?shopId=${id}`);
      const data = await res.json();
      setCategories(data.map((c: any) => ({ id: c.category_id, name: c.category_name })));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories(prev => [...prev, newCategory]);
    setShowCategoryForm(false);
    showWarning("Category created successfully!", 'success');
  };

  const handleCategoryError = (errorMessage: string) => {
    showWarning(errorMessage, 'error');
  };

  const resetForm = () => {
    formData.images.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });

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
      discountPrice: "", 
      inStock: true,
      attributes: initialAttributes,
      images: [],
      categoryIds: []
    });
    
    setSelectedCategoryId("");
    setActiveIndex(0);
    setErrors({});
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
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
          discountPrice: formData.discountPrice || null,
          inStock: formData.inStock,
          attributes: formData.attributes
        })
      });

      const productData = await productRes.json();
      
      if (!productRes.ok) {
        throw new Error(productData.error || 'Failed to create product');
      }

      const productId = productData.product_id;

      const imageFiles = formData.images.filter(img => img.file);
      
      if (imageFiles.length > 0) {
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
            return { success: false };
          } else {
            return { success: true };
          }
        });

        await Promise.all(uploadPromises);
      }

      if (formData.categoryIds.length > 0) {
        const categoryPromises = formData.categoryIds.map(async (categoryId) => {
          const catRes = await fetch(`/api/shopowner/products/${productId}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_id: categoryId })
          });

          if (!catRes.ok) {
            console.error(`❌ Failed to add category ${categoryId}:`, await catRes.json());
          }
        });

        await Promise.all(categoryPromises);
      }
      
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Product has been created successfully.'
      });
      
      resetForm();
      
    } catch (error: any) {
      console.error("❌ Submit failed:", error);
      
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.message || "Failed to create product"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeIndex === 0 && !validatePrimaryTab()) {
      showWarning("Please fill out all Primary fields before proceeding", 'error');
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
  };

  return {
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
    shopSlug,
    shopId,
    shopType,
    tabWarning,
    modalState,
    warningRef,
    showWarning,
    
    handleCategoryCreated,
    handleCategoryError,
    handleNext,
    handlePrevious,
    handleTabClick,
    resetForm,
    closeModal,
  };
}