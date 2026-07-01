'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { useAuth } from "@/context/authcontext";
import { Attribute, Category, ProductFormData, ProductVariant, ProductImage } from "../../../add/types";
import { validateBasicInfo, validatePricing, validateImages, validateAllSteps, getErrorStep } from "../utils/validation";

export function useProductUpdate() {
  const { shopId, shopType, shopSlug } = useShop();
  const params = useParams();
  const productId = params.productId as string;
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const warningRef = useRef<HTMLDivElement>(null);
  const imagesLoadedRef = useRef(false);
  const isInitialFetchRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const sections = ["Basic Info", "Pricing & Inventory", "Images", "Categories", "Review & Publish"];

  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    productSlug: "",
    description: "",
    productType: "simple",
    status: "draft",
    price: "",
    discountPrice: "",
    stockQuantity: 1,
    inStock: true,
    attributes: {},
    variants: [],
    images: [],
    categoryIds: [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [attributeSchema, setAttributeSchema] = useState<Attribute[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState<Attribute[]>([]);
  const [selectedVariantAttrs, setSelectedVariantAttrs] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
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

  const [tabWarning, setTabWarning] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    if (isInitialFetchRef.current) return;
    isInitialFetchRef.current = true;

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

      const productType = productData.product_type || 'simple';
      const variants = productData.variants || [];

      let selectedAttrs: string[] = [];
      if (productType === 'variable' && variants.length > 0) {
        const attrKeys = new Set<string>();
        variants.forEach((v: any) => {
          Object.keys(v.attributes || {}).forEach((key: string) => attrKeys.add(key));
        });
        selectedAttrs = Array.from(attrKeys);
      }

      setFormData((prev) => ({
        productName: productData.product_name || "",
        productSlug: productData.product_slug || "",
        description: productData.description || "",
        productType: productType,
        status: productData.status || 'draft',
        price: productType === 'variable' ? "0" : (productData.price?.toString() || ""),
        discountPrice: productType === 'variable' ? "" : (productData.discount_price?.toString() || ""),
        stockQuantity: productType === 'variable' ? 0 : (productData.stock_quantity || 1),
        inStock: productType === 'variable' ? true : (productData.stock_quantity > 0),
        attributes: attributes,
        variants: variants.map((v: any) => ({
          attributes: v.attributes || {},
          price: v.price?.toString() || "0",
          discountPrice: v.discount_price?.toString() || "",
          stockQuantity: v.stock_quantity || 1,
          inStock: v.stock_quantity > 0,
        })),
        images: prev.images,
        categoryIds: categoryData.map((c: { category_id: number }) => c.category_id)
      }));

      if (selectedAttrs.length > 0) {
        setSelectedVariantAttrs(selectedAttrs);
      }

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

  const markImagesLoaded = useCallback(() => {
    imagesLoadedRef.current = true;
  }, []);

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

      const variantAttrs = fields.filter((f: Attribute) => f.variant === true);
      setVariantAttributes(variantAttrs);
    } catch (error) {
      console.error("Failed to fetch attributes:", error);
    } finally {
      setLoadingSchema(false);
    }
  };

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

  useEffect(() => {
    if (shopId && isAuthenticated) {
      fetchCategories(shopId);
    }
  }, [shopId, isAuthenticated]);

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    setShowCategoryForm(false);
    showWarning("Category created successfully!", 'success');
  };

  const handleCategoryError = (errorMessage: string) => {
    showWarning(errorMessage, 'error');
  };

  const validateStep = (index: number): boolean => {
    let stepErrors: Record<string, string> = {};
    
    if (index === 0) {
      stepErrors = validateBasicInfo(formData, attributeSchema);
    } else if (index === 1) {
      stepErrors = validatePricing(formData, selectedVariantAttrs);
    } else if (index === 2) {
      stepErrors = validateImages(formData.images);
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const calculateCompletion = () => {
    const visibleImages = formData.images.filter(img => img.status !== "deleted");
    
    const stepDetails = {
      basicInfo: { completed: false, items: [] as string[] },
      pricing: { completed: false, items: [] as string[] },
      images: { completed: false, items: [] as string[] },
      categories: { completed: false, items: [] as string[] },
      review: { completed: false, items: [] as string[] },
    };

    const basicItems: string[] = [];
    if (formData.productName.trim()) {
      basicItems.push("Product name filled");
    }
    if (formData.productSlug.trim()) {
      basicItems.push("Product slug filled");
    }
    const requiredAttrs = attributeSchema.filter((f: Attribute) => f.required && f.variant !== true);
    let attrCount = 0;
    requiredAttrs.forEach((field: Attribute) => {
      const value = formData.attributes[field.name];
      if (field.type === "boolean" || (value && value.toString().trim() !== "")) {
        attrCount++;
      }
    });
    if (attrCount === requiredAttrs.length && requiredAttrs.length > 0) {
      basicItems.push("All required attributes filled");
    }
    const basicComplete = basicItems.length >= 2 && attrCount === requiredAttrs.length;
    stepDetails.basicInfo = { completed: basicComplete, items: basicItems };

    const pricingItems: string[] = [];
    if (formData.productType === "simple") {
      if (formData.price && Number(formData.price) > 0) {
        pricingItems.push("Price set");
      }
      if (formData.stockQuantity >= 0) {
        pricingItems.push("Stock set");
      }
    } else {
      if (selectedVariantAttrs.length > 0) {
        pricingItems.push(`Attributes selected: ${selectedVariantAttrs.join(", ")}`);
      }
      if (formData.variants.length >= 2) {
        pricingItems.push(`${formData.variants.length} variants added`);
      } else if (formData.variants.length === 1) {
        pricingItems.push("1 variant (will convert to simple)");
      }
      let variantComplete = true;
      for (const variant of formData.variants) {
        for (const attr of selectedVariantAttrs) {
          if (!variant.attributes[attr] || variant.attributes[attr].toString().trim() === "") {
            variantComplete = false;
            break;
          }
        }
        if (!variant.price || Number(variant.price) <= 0) {
          variantComplete = false;
        }
        if (!variantComplete) break;
      }
      if (variantComplete && formData.variants.length > 0) {
        pricingItems.push("All variants complete");
      }
    }
    const pricingComplete = formData.productType === "simple"
      ? pricingItems.length >= 2
      : formData.variants.length >= 1 && pricingItems.length >= 2;
    stepDetails.pricing = { completed: pricingComplete, items: pricingItems };

    const imageItems: string[] = [];
    const hasPrimary = visibleImages.some((img: ProductImage) => img.isPrimary === true);
    if (hasPrimary) {
      imageItems.push("Primary image uploaded");
    }
    const additionalCount = visibleImages.filter((img: ProductImage) => img.isPrimary !== true).length;
    if (additionalCount > 0) {
      imageItems.push(`${additionalCount} additional images`);
    }
    stepDetails.images = { completed: hasPrimary, items: imageItems };

    const categoryItems: string[] = [];
    if (formData.categoryIds.length > 0) {
      categoryItems.push(`${formData.categoryIds.length} categories selected`);
    } else {
      categoryItems.push("No categories selected (optional)");
    }
    stepDetails.categories = { completed: true, items: categoryItems };

    const reviewItems: string[] = [];
    const nameFilled = !!formData.productName.trim();
    const slugFilled = !!formData.productSlug.trim();
    const priceValid = formData.productType === "simple" ? (formData.price && Number(formData.price) > 0) : true;
    const hasPrimaryImage = visibleImages.some((img: ProductImage) => img.isPrimary === true);
    const allValid: boolean = !!(nameFilled && slugFilled && priceValid && hasPrimaryImage);

    if (allValid) {
      reviewItems.push("All validations passed");
    } else {
      reviewItems.push("Some validations incomplete");
    }
    stepDetails.review = { completed: allValid, items: reviewItems };

    const stepWeights = [20, 30, 20, 10, 20];
    const stepCompletions = [
      basicComplete ? 1 : 0,
      pricingComplete ? 1 : 0,
      hasPrimary ? 1 : 0,
      1,
      allValid ? 1 : 0
    ];

    let totalWeight = 0;
    let completedWeight = 0;
    for (let i = 0; i < stepWeights.length; i++) {
      totalWeight += stepWeights[i];
      completedWeight += stepCompletions[i] * stepWeights[i];
    }

    const percentage = Math.round((completedWeight / totalWeight) * 100);

    return {
      percentage,
      completedSteps: stepCompletions.reduce((a, b) => a + b, 0),
      totalSteps: 5,
      steps: stepDetails,
      canPublish: !!(allValid && hasPrimaryImage),
    };
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      attributes: {},
      price: "",
      discountPrice: "",
      stockQuantity: 1,
      inStock: true,
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i: number) => i !== index),
    }));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      if (field === "attributes") {
        newVariants[index].attributes = value;
      } else if (field === "price") {
        newVariants[index].price = value;
      } else if (field === "discountPrice") {
        newVariants[index].discountPrice = value;
      } else if (field === "stockQuantity") {
        newVariants[index].stockQuantity = value;
      } else if (field === "inStock") {
        newVariants[index].inStock = value;
        if (value === false) {
          newVariants[index].stockQuantity = 0;
        } else {
          if (newVariants[index].stockQuantity === 0) {
            newVariants[index].stockQuantity = 1;
          }
        }
      }
      return { ...prev, variants: newVariants };
    });
  };

  const toggleVariantAttribute = (attrName: string) => {
    setSelectedVariantAttrs((prev: string[]) =>
      prev.includes(attrName)
        ? prev.filter((a: string) => a !== attrName)
        : [...prev, attrName]
    );
  };

  const handleSubmit = async (overrideStatus?: 'draft' | 'published'): Promise<{ success: boolean; productId?: number; error?: string; fieldErrors?: Record<string, string>; errorStep?: number }> => {
    let finalProductType = formData.productType;
    let finalPrice = formData.price;
    let finalDiscountPrice = formData.discountPrice;
    let finalStockQuantity = formData.inStock !== false ? formData.stockQuantity : 0;
    let finalAttributes = { ...formData.attributes };
    let finalVariants = formData.variants.map((v: ProductVariant) => ({
      ...v,
      stockQuantity: v.inStock !== false ? v.stockQuantity : 0
    }));

    if (formData.productType === "variable" && formData.variants.length === 1) {
      const singleVariant = finalVariants[0];
      finalProductType = "simple";
      finalPrice = singleVariant.price;
      finalDiscountPrice = singleVariant.discountPrice || "";
      finalStockQuantity = singleVariant.stockQuantity;
      finalAttributes = {
        ...formData.attributes,
        ...singleVariant.attributes
      };
      finalVariants = [];
    }

    const tempFormData = {
      ...formData,
      productType: finalProductType,
      price: finalPrice,
      discountPrice: finalDiscountPrice,
      stockQuantity: finalStockQuantity,
      attributes: finalAttributes,
      variants: finalVariants,
    };

    const fieldErrors: Record<string, string> = {};
    let errorStep = -1;

    if (!tempFormData.productName.trim()) {
      fieldErrors.productName = "Product name is required";
    }
    if (!tempFormData.productSlug.trim()) {
      fieldErrors.productSlug = "Product slug is required";
    }

    if (overrideStatus === 'published') {
      if (finalProductType === "simple") {
        if (!finalPrice || Number(finalPrice) <= 0) {
          fieldErrors.price = "Valid price is required";
          errorStep = 1;
        }
        if (finalDiscountPrice && Number(finalDiscountPrice) >= Number(finalPrice)) {
          fieldErrors.discountPrice = "Discount must be less than regular price";
          errorStep = 1;
        }
        if (finalStockQuantity < 0) {
          fieldErrors.stockQuantity = "Stock cannot be negative";
          errorStep = 1;
        }
      } else {
        if (selectedVariantAttrs.length === 0) {
          fieldErrors.variants = "Select at least one attribute that varies";
          errorStep = 1;
        }
        if (finalVariants.length === 0) {
          fieldErrors.variants = "Add at least one variant";
          errorStep = 1;
        }
        for (let i = 0; i < finalVariants.length; i++) {
          const variant = finalVariants[i];
          for (const attr of selectedVariantAttrs) {
            if (!variant.attributes[attr] || variant.attributes[attr].toString().trim() === "") {
              fieldErrors[`variant_${i}_${attr}`] = `Variant ${i + 1}: Missing ${attr}`;
              errorStep = 1;
            }
          }
          if (!variant.price || Number(variant.price) <= 0) {
            fieldErrors[`variant_${i}_price`] = `Variant ${i + 1}: Price must be > 0`;
            errorStep = 1;
          }
          if (variant.discountPrice && Number(variant.discountPrice) >= Number(variant.price)) {
            fieldErrors[`variant_${i}_discount`] = `Variant ${i + 1}: Discount must be < price`;
            errorStep = 1;
          }
        }
      }

      const visibleImages = tempFormData.images.filter(img => img.status !== "deleted");
      
      if (visibleImages.length === 0) {
        fieldErrors.images = "At least one image is required";
        errorStep = 2;
      } else {
        const hasPrimary = visibleImages.some((img: ProductImage) => img.isPrimary === true);
        if (!hasPrimary) {
          fieldErrors.images = "A primary image is required";
          errorStep = 2;
        }
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return {
        success: false,
        error: "Please fix the highlighted fields",
        fieldErrors,
        errorStep: errorStep !== -1 ? errorStep : 0
      };
    }

    setLoading(true);
    try {
      const statusToSend = overrideStatus || tempFormData.status || 'draft';

      const payload = {
        productName: tempFormData.productName,
        productSlug: tempFormData.productSlug,
        description: tempFormData.description,
        productType: finalProductType,
        status: statusToSend,
        attributes: finalAttributes,
        price: finalProductType === "simple" ? finalPrice : 0,
        discountPrice: finalProductType === "simple" ? finalDiscountPrice || null : null,
        stockQuantity: finalProductType === "simple" ? finalStockQuantity : 0,
        variants: finalProductType === "variable" ? finalVariants : [],
      };

      const productRes = await fetch(`/api/shopowner/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const productData = await productRes.json();

      if (!productRes.ok) {
        let errorMessage = productData.error || "Failed to update product";
        const fieldErrors: Record<string, string> = {};

        if (productData.field === 'productName' || productData.error?.includes('name already exists')) {
          fieldErrors.productName = productData.error || "A product with this name already exists. Please use a different name.";
          errorStep = 0;
          errorMessage = "Product name already exists";
        } else if (productData.error?.includes('slug')) {
          fieldErrors.productSlug = "This product slug already exists. Please use a different slug.";
          errorStep = 0;
          errorMessage = "Product slug already exists";
        }

        setErrors(fieldErrors);
        return {
          success: false,
          error: errorMessage,
          fieldErrors,
          errorStep
        };
      }

      const updatedProductId = productData.product_id;

      if (tempFormData.categoryIds.length > 0) {
        try {
          const categoryResults = await Promise.allSettled(
            tempFormData.categoryIds.map(async (categoryId: number) => {
              const catRes = await fetch(
                `/api/shopowner/products/${updatedProductId}/categories`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ category_id: categoryId }),
                }
              );
              
              if (catRes.status === 409) {
                return { success: true, categoryId, alreadyExists: true };
              }
              
              if (!catRes.ok) {
                const errorText = await catRes.text();
                throw new Error(`Failed to add category ${categoryId}: ${errorText}`);
              }
              
              return { success: true, categoryId };
            })
          );

          const failedCategories = categoryResults.filter(r => r.status === 'rejected');
          if (failedCategories.length > 0) {
            console.warn('Some categories failed to link:', failedCategories);
            showWarning(`Warning: ${failedCategories.length} category(ies) could not be linked.`, 'error');
          }
        } catch (catError) {
          console.warn('Category linking failed (non-critical):', catError);
          showWarning('Warning: Some categories could not be linked, but product was updated.', 'error');
        }
      }

      if (overrideStatus === 'published') {
        setFormData((prev) => ({ ...prev, status: 'published' }));
      }

      return { success: true, productId: updatedProductId };
    } catch (error) {
      console.error("Update failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected network error occurred",
      };
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (): Promise<{
    success: boolean;
    productId?: number;
    error?: string;
    errorStep?: number;
    errorSummary?: string;
    fieldErrors?: Record<string, string>;
  }> => {
    const validation = validateAllSteps(formData, attributeSchema, selectedVariantAttrs, sections);

    if (validation.hasErrors) {
      const firstStepErrors = validation.stepErrors[Object.keys(validation.stepErrors)[0]] || {};
      setErrors(firstStepErrors);
      return {
        success: false,
        error: validation.errorSummary || "Please complete required fields",
        errorStep: validation.firstErrorStep,
        errorSummary: validation.errorSummary,
        fieldErrors: firstStepErrors,
      };
    }

    const completion = calculateCompletion();
    if (!completion.canPublish) {
      return {
        success: false,
        error: "Please complete all required fields before publishing."
      };
    }

    const result = await handleSubmit('published');
    return {
      success: result.success,
      productId: result.productId,
      error: result.error,
      errorStep: result.errorStep,
      fieldErrors: result.fieldErrors,
    };
  };

  const handleNext = () => {
    if (!validateStep(activeIndex)) {
      const errorStep = getErrorStep(errors);
      if (errorStep !== null) {
        setActiveIndex(errorStep);
      }
      showWarning("Please fix the errors before proceeding", 'error');
      return;
    }
    setTabWarning(null);
    if (activeIndex < sections.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handlePrevious = () => {
    setTabWarning(null);
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleTabClick = (index: number) => {
    setTabWarning(null);
    setActiveIndex(index);
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const resetForm = () => {};

  const addCategory = (categoryId: number) => {
    if (formData.categoryIds.includes(categoryId)) {
      showWarning("Category already added", "error");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      categoryIds: [...prev.categoryIds, categoryId],
    }));
    setSelectedCategoryId("");
    showWarning("Category added successfully", "success");
  };

  const removeCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((id: number) => id !== categoryId),
    }));
    showWarning("Category removed", "success");
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
    variantAttributes,
    selectedVariantAttrs,
    toggleVariantAttribute,
    loadingSchema,
    loading,
    errors,
    setErrors,
    shopSlug,
    shopId,
    shopType,
    tabWarning,
    modalState,
    warningRef,
    showWarning,
    isLoadingProduct,
    productId,
    handleCategoryCreated,
    handleCategoryError,
    handleSubmit,
    handlePublish,
    handleNext,
    handlePrevious,
    handleTabClick,
    resetForm,
    closeModal,
    addCategory,
    removeCategory,
    addVariant,
    removeVariant,
    updateVariant,
    calculateCompletion,
    markImagesLoaded,
  };
}