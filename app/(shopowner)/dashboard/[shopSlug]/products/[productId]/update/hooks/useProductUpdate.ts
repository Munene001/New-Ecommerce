// app/(shopowner)/dashboard/[shopSlug]/products/update/hooks/useProductUpdate.ts
'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { useAuth } from "@/context/authcontext";
import { Attribute, Category, ProductFormData, ProductVariant } from "../../../add/types";

export function useProductUpdate() {
  const { shopId, shopType, shopSlug } = useShop();
  const params = useParams();
  const productId = params.productId as string;
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const warningRef = useRef<HTMLDivElement>(null);
  
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
    stockQuantity: 0,
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

  // Fetch product data
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

      // Set product type and variants
      const productType = productData.product_type || 'simple';
      const variants = productData.variants || [];
      
      // Determine selected variant attributes from existing variants
      let selectedAttrs: string[] = [];
      if (productType === 'variable' && variants.length > 0) {
        const attrKeys = new Set<string>();
        variants.forEach((v: any) => {
          Object.keys(v.attributes || {}).forEach(key => attrKeys.add(key));
        });
        selectedAttrs = Array.from(attrKeys);
      }

      setFormData({
        productName: productData.product_name || "",
        productSlug: productData.product_slug || "",
        description: productData.description || "",
        productType: productType,
        status: productData.status || 'draft',
        price: productType === 'variable' ? "0" : (productData.price?.toString() || ""),
        discountPrice: productType === 'variable' ? "" : (productData.discount_price?.toString() || ""),
        stockQuantity: productType === 'variable' ? 0 : (productData.stock_quantity || 0),
        attributes: attributes,
        variants: variants.map((v: any) => ({
          attributes: v.attributes || {},
          price: v.price?.toString() || "0",
          discountPrice: v.discount_price?.toString() || "",
          stockQuantity: v.stock_quantity || 0,
        })),
        images: [], // Images will be loaded separately by ImagesForm
        categoryIds: categoryData.map((c: { category_id: number }) => c.category_id)
      });

      // Set selected variant attributes
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

  useEffect(() => {
    if (productId && shopId && isAuthenticated) {
      fetchProduct();
    }
  }, [productId, shopId, isAuthenticated, fetchProduct]);

  // Fetch attribute schema
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

  // Fetch categories
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
    setCategories(prev => [...prev, newCategory]);
    setShowCategoryForm(false);
    showWarning("Category created successfully!", 'success');
  };

  const handleCategoryError = (errorMessage: string) => {
    showWarning(errorMessage, 'error');
  };

  // Validation functions
  const validateBasicInfo = (): boolean => {
    const basicErrors: Record<string, string> = {};
    if (!formData.productName.trim()) {
      basicErrors.productName = "Product name is required";
    }
    if (!formData.productSlug.trim()) {
      basicErrors.productSlug = "Product slug is required";
    }
    attributeSchema
      .filter((f) => f.required && f.variant !== true)
      .forEach((field) => {
        const value = formData.attributes[field.name];
        if (field.type === "boolean") return;
        if (!value || value.toString().trim() === "") {
          basicErrors[`attr.${field.name}`] = `${field.label} is required`;
        }
      });
    setErrors(basicErrors);
    return Object.keys(basicErrors).length === 0;
  };

  const validatePricing = (): boolean => {
    const pricingErrors: Record<string, string> = {};
    
    if (formData.productType === "simple") {
      if (!formData.price || Number(formData.price) <= 0) {
        pricingErrors.price = "Valid price is required";
      }
      if (formData.discountPrice && Number(formData.discountPrice) < 0) {
        pricingErrors.discountPrice = "Discount price cannot be negative";
      }
      if (
        formData.discountPrice &&
        Number(formData.discountPrice) >= Number(formData.price)
      ) {
        pricingErrors.discountPrice = "Discount price must be less than regular price";
      }
    } else {
      if (selectedVariantAttrs.length === 0) {
        pricingErrors.variants = "Select at least one attribute that varies";
      }
      if (formData.variants.length === 0) {
        pricingErrors.variants = "Add at least one variant";
      }
      for (let i = 0; i < formData.variants.length; i++) {
        const variant = formData.variants[i];
        for (const attr of selectedVariantAttrs) {
          if (!variant.attributes[attr] || variant.attributes[attr].toString().trim() === "") {
            pricingErrors[`variant_${i}_${attr}`] = `Variant ${i + 1}: Missing ${attr}`;
          }
        }
        if (!variant.price || Number(variant.price) <= 0) {
          pricingErrors[`variant_${i}_price`] = `Variant ${i + 1}: Price must be > 0`;
        }
        if (variant.discountPrice && Number(variant.discountPrice) >= Number(variant.price)) {
          pricingErrors[`variant_${i}_discount`] = `Variant ${i + 1}: Discount must be < price`;
        }
      }
    }
    setErrors(pricingErrors);
    return Object.keys(pricingErrors).length === 0;
  };

  const validateImages = (): boolean => {
    const imageErrors: Record<string, string> = {};
    if (formData.images.length === 0) {
      imageErrors.images = "At least one image is required";
    } else {
      const hasPrimary = formData.images.some((img) => img.isPrimary === true);
      if (!hasPrimary) {
        imageErrors.images = "A primary image is required";
      }
    }
    setErrors(imageErrors);
    return Object.keys(imageErrors).length === 0;
  };

  const validateAllSteps = (): {
    hasErrors: boolean;
    firstErrorStep: number;
    stepErrors: Record<string, Record<string, string>>;
    stepNames: string[];
    errorSummary: string;
  } => {
    const stepErrors: Record<string, Record<string, string>> = {};
    let firstErrorStep = -1;
    const errorMessages: string[] = [];
    
    const basicErrors: Record<string, string> = {};
    if (!formData.productName.trim()) {
      basicErrors.productName = "Product name is required";
      errorMessages.push("Product name is required");
    }
    if (!formData.productSlug.trim()) {
      basicErrors.productSlug = "Product slug is required";
      errorMessages.push("Product slug is required");
    }
    attributeSchema
      .filter((f) => f.required && f.variant !== true)
      .forEach((field) => {
        const value = formData.attributes[field.name];
        if (field.type === "boolean") return;
        if (!value || value.toString().trim() === "") {
          basicErrors[`attr.${field.name}`] = `${field.label} is required`;
          errorMessages.push(`${field.label} is required`);
        }
      });
    
    if (Object.keys(basicErrors).length > 0) {
      stepErrors.basicInfo = basicErrors;
      if (firstErrorStep === -1) firstErrorStep = 0;
    }

    const pricingErrors: Record<string, string> = {};
    if (formData.productType === "simple") {
      if (!formData.price || Number(formData.price) <= 0) {
        pricingErrors.price = "Valid price is required";
        errorMessages.push("Valid price is required");
      }
      if (formData.discountPrice && Number(formData.discountPrice) < 0) {
        pricingErrors.discountPrice = "Discount price cannot be negative";
        errorMessages.push("Discount price cannot be negative");
      }
      if (
        formData.discountPrice &&
        Number(formData.discountPrice) >= Number(formData.price)
      ) {
        pricingErrors.discountPrice = "Discount price must be less than regular price";
        errorMessages.push("Discount price must be less than regular price");
      }
    } else {
      if (selectedVariantAttrs.length === 0) {
        pricingErrors.variants = "Select at least one attribute that varies";
        errorMessages.push("Select at least one attribute that varies");
      }
      if (formData.variants.length === 0) {
        pricingErrors.variants = "Add at least one variant";
        errorMessages.push("Add at least one variant");
      }
      for (let i = 0; i < formData.variants.length; i++) {
        const variant = formData.variants[i];
        for (const attr of selectedVariantAttrs) {
          if (!variant.attributes[attr] || variant.attributes[attr].toString().trim() === "") {
            pricingErrors[`variant_${i}_${attr}`] = `Variant ${i + 1}: Missing ${attr}`;
            errorMessages.push(`Variant ${i + 1}: Missing ${attr}`);
          }
        }
        if (!variant.price || Number(variant.price) <= 0) {
          pricingErrors[`variant_${i}_price`] = `Variant ${i + 1}: Price must be > 0`;
          errorMessages.push(`Variant ${i + 1}: Price must be greater than 0`);
        }
        if (variant.discountPrice && Number(variant.discountPrice) >= Number(variant.price)) {
          pricingErrors[`variant_${i}_discount`] = `Variant ${i + 1}: Discount must be < price`;
          errorMessages.push(`Variant ${i + 1}: Discount must be less than price`);
        }
        if (variant.stockQuantity !== undefined && variant.stockQuantity < 0) {
          pricingErrors[`variant_${i}_stock`] = `Variant ${i + 1}: Stock cannot be negative`;
          errorMessages.push(`Variant ${i + 1}: Stock cannot be negative`);
        }
      }
    }
    
    if (Object.keys(pricingErrors).length > 0) {
      stepErrors.pricing = pricingErrors;
      if (firstErrorStep === -1) firstErrorStep = 1;
    }

    const imageErrors: Record<string, string> = {};
    if (formData.images.length === 0) {
      imageErrors.images = "At least one image is required";
      errorMessages.push("At least one product image is required");
    } else {
      const hasPrimary = formData.images.some((img) => img.isPrimary === true);
      if (!hasPrimary) {
        imageErrors.images = "A primary image is required";
        errorMessages.push("A primary image is required");
      }
    }
    
    if (Object.keys(imageErrors).length > 0) {
      stepErrors.images = imageErrors;
      if (firstErrorStep === -1) firstErrorStep = 2;
    }

    let errorSummary = "";
    if (firstErrorStep !== -1) {
      const stepKeyMap: Record<string, string> = {
        "Basic Info": "basicInfo",
        "Pricing & Inventory": "pricing",
        "Images": "images",
        "Categories": "categories",
        "Review & Publish": "review"
      };
      
      const stepName = sections[firstErrorStep];
      const stepKey = stepKeyMap[stepName] || stepName.toLowerCase().replace(/ & /g, '').replace(/ /g, '');
      const firstErrors = stepErrors[stepKey] || {};
      const errorList = Object.values(firstErrors);
      
      if (errorList.length === 1) {
        errorSummary = errorList[0];
      } else if (errorList.length <= 3) {
        errorSummary = errorList.join("; ");
      } else {
        errorSummary = `${errorList.length} errors in "${stepName}" section`;
      }
    }

    return {
      hasErrors: firstErrorStep !== -1,
      firstErrorStep,
      stepErrors,
      stepNames: sections,
      errorSummary,
    };
  };

  const calculateCompletion = () => {
    const stepDetails = {
      basicInfo: { completed: false, items: [] as string[] },
      pricing: { completed: false, items: [] as string[] },
      images: { completed: false, items: [] as string[] },
      categories: { completed: false, items: [] as string[] },
      review: { completed: false, items: [] as string[] },
    };

    const basicItems = [];
    if (formData.productName.trim()) {
      basicItems.push("Product name filled");
    }
    if (formData.productSlug.trim()) {
      basicItems.push("Product slug filled");
    }
    const requiredAttrs = attributeSchema.filter((f) => f.required && f.variant !== true);
    let attrCount = 0;
    requiredAttrs.forEach((field) => {
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

    const pricingItems = [];
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

    const imageItems = [];
    const hasPrimary = formData.images.some((img) => img.isPrimary === true);
    if (hasPrimary) {
      imageItems.push("Primary image uploaded");
    }
    const additionalCount = formData.images.filter((img) => img.isPrimary !== true).length;
    if (additionalCount > 0) {
      imageItems.push(`${additionalCount} additional images`);
    }
    stepDetails.images = { completed: hasPrimary, items: imageItems };

    const categoryItems = [];
    if (formData.categoryIds.length > 0) {
      categoryItems.push(`${formData.categoryIds.length} categories selected`);
    } else {
      categoryItems.push("No categories selected (optional)");
    }
    stepDetails.categories = { completed: true, items: categoryItems };

    const reviewItems = [];
    const nameFilled = !!formData.productName.trim();
    const slugFilled = !!formData.productSlug.trim();
    const priceValid = formData.productType === "simple" ? (formData.price && Number(formData.price) > 0) : true;
    const hasPrimaryImage = formData.images.some((img) => img.isPrimary === true);
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

  // Variant management
  const addVariant = () => {
    const newVariant: ProductVariant = {
      attributes: {},
      price: "",
      discountPrice: "",
      stockQuantity: 0,
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
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
      }
      return { ...prev, variants: newVariants };
    });
  };

  const toggleVariantAttribute = (attrName: string) => {
    setSelectedVariantAttrs((prev) =>
      prev.includes(attrName)
        ? prev.filter((a) => a !== attrName)
        : [...prev, attrName]
    );
  };

  // Submit handlers
  const handleSubmit = async (overrideStatus?: 'draft' | 'published'): Promise<{ success: boolean; productId?: number; error?: string }> => {
    let finalProductType = formData.productType;
    let finalPrice = formData.price;
    let finalDiscountPrice = formData.discountPrice;
    let finalStockQuantity = formData.stockQuantity;
    let finalAttributes = { ...formData.attributes };
    let finalVariants = formData.variants;

    if (formData.productType === "variable" && formData.variants.length === 1) {
      const singleVariant = formData.variants[0];
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

    const validateConverted = (): boolean => {
      const errors: Record<string, string> = {};
      if (!tempFormData.productName.trim()) {
        errors.productName = "Product name is required";
      }
      if (!tempFormData.productSlug.trim()) {
        errors.productSlug = "Product slug is required";
      }
      
      if (overrideStatus === 'published') {
        if (finalProductType === "simple") {
          if (!finalPrice || Number(finalPrice) <= 0) {
            errors.price = "Valid price is required";
          }
          if (finalDiscountPrice && Number(finalDiscountPrice) >= Number(finalPrice)) {
            errors.discountPrice = "Discount must be less than regular price";
          }
        }
        if (tempFormData.images.length === 0) {
          errors.images = "At least one image is required";
        } else {
          const hasPrimary = tempFormData.images.some((img) => img.isPrimary === true);
          if (!hasPrimary) {
            errors.images = "A primary image is required";
          }
        }
      }
      
      setErrors(errors);
      return Object.keys(errors).length === 0;
    };

    if (!validateConverted()) {
      return { success: false, error: "Please fix all validation errors." };
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
        const errorMessage = productData.error || "Failed to update product";
        return { success: false, error: errorMessage };
      }

      const updatedProductId = productData.product_id;

      if (tempFormData.categoryIds.length > 0) {
        try {
          await Promise.all(
            tempFormData.categoryIds.map(async (categoryId) => {
              const catRes = await fetch(
                `/api/shopowner/products/${updatedProductId}/categories`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ category_id: categoryId }),
                }
              );
              if (!catRes.ok) {
                throw new Error(`Failed to add category ${categoryId}`);
              }
            })
          );
        } catch (catError) {
          return {
            success: false,
            error: catError instanceof Error ? catError.message : "Failed to link categories",
          };
        }
      }

      if (overrideStatus === 'published') {
        setFormData(prev => ({ ...prev, status: 'published' }));
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
  }> => {
    const validation = validateAllSteps();
    
    if (validation.hasErrors) {
      const firstStepName = validation.stepNames[validation.firstErrorStep];
      const stepKeyMap: Record<string, string> = {
        "Basic Info": "basicInfo",
        "Pricing & Inventory": "pricing",
        "Images": "images",
        "Categories": "categories",
        "Review & Publish": "review"
      };
      const stepKey = stepKeyMap[firstStepName] || firstStepName.toLowerCase().replace(/ & /g, '').replace(/ /g, '');
      const firstStepErrors = validation.stepErrors[stepKey] || {};
      
      setErrors(firstStepErrors);
      
      return { 
        success: false, 
        error: validation.errorSummary || `Please complete required fields in "${firstStepName}" section`,
        errorStep: validation.firstErrorStep,
        errorSummary: validation.errorSummary,
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
    };
  };

  // Navigation
  const handleNext = () => {
    if (activeIndex === 0 && !validateBasicInfo()) {
      showWarning("Please fill out all required fields before proceeding", 'error');
      return;
    }
    if (activeIndex === 1 && !validatePricing()) {
      showWarning("Please fix pricing errors before proceeding", 'error');
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
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const resetForm = () => {
    // Reset form state (keeps product data)
  };

  // Category management
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
      categoryIds: prev.categoryIds.filter((id) => id !== categoryId),
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
    validateAllSteps,
  };
}