import { useState, useEffect, useRef } from "react";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { Attribute, Category, ProductFormData, ProductVariant } from "../types";
import { useAuth } from "@/context/authcontext";

export function useProductForm() {
  const { isAuthenticated } = useAuth();
  const { shopId, shopType, shopSlug } = useShop();

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [tabWarning, setTabWarning] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showWarning = (message: string, type: "success" | "error" = "error") => {
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
        warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  useEffect(() => {
    if (shopType && isAuthenticated) {
      fetchAttributeSchema(shopType);
    }
  }, [shopType, isAuthenticated]);

  useEffect(() => {
    if (shopId && isAuthenticated) {
      fetchCategories(shopId);
    }
  }, [shopId, isAuthenticated]);

  const fetchAttributeSchema = async (type: string) => {
    setLoadingSchema(true);
    try {
      const res = await fetch(`/api/shopowner/products/attributes?shopType=${type}`);
      const data = await res.json();
      const fields = data.fields || [];
      setAttributeSchema(fields);

      const variantAttrs = fields.filter((f: Attribute) => f.variant === true);
      setVariantAttributes(variantAttrs);

      const productAttrs = fields.filter((f: Attribute) => f.variant !== true);
      const initialAttributes: Record<string, string | number | boolean | null> = {};
      productAttrs.forEach((field: Attribute) => {
        if (field.type === "boolean") {
          initialAttributes[field.name] = false;
        } else if (field.type === "select" && field.options?.length) {
          initialAttributes[field.name] = "";
        } else {
          initialAttributes[field.name] = "";
        }
      });
      
      setFormData((prev) => ({
        ...prev,
        attributes: initialAttributes,
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
      setCategories(
        data.map((c: { category_id: number; category_name: string }) => ({
          id: c.category_id,
          name: c.category_name,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    setShowCategoryForm(false);
    showWarning("Category created successfully!", "success");
  };

  const handleCategoryError = (errorMessage: string) => {
    showWarning(errorMessage, "error");
  };

  const resetForm = () => {
    formData.images.forEach((img) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });

    const productAttrs = attributeSchema.filter((f: Attribute) => f.variant !== true);
    const initialAttributes: Record<string, string | number | boolean | null> = {};
    productAttrs.forEach((field: Attribute) => {
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
      productType: "simple",
      status: "draft",
      price: "",
      discountPrice: "",
      stockQuantity: 1,
      inStock: true,
      attributes: initialAttributes,
      variants: [],
      images: [],
      categoryIds: [],
    });
    setSelectedCategoryId("");
    setSelectedVariantAttrs([]);
    setActiveIndex(0);
    setErrors({});
  };

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
      if (formData.inStock !== false && formData.stockQuantity < 0) {
        pricingErrors.stockQuantity = "Stock quantity cannot be negative";
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
        if (variant.inStock !== false && variant.stockQuantity < 0) {
          pricingErrors[`variant_${i}_stock`] = `Variant ${i + 1}: Stock cannot be negative`;
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
      if (formData.inStock !== false && formData.stockQuantity < 0) {
        pricingErrors.stockQuantity = "Stock cannot be negative";
        errorMessages.push("Stock cannot be negative");
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
        if (variant.inStock !== false && variant.stockQuantity < 0) {
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

  const validateAll = (): boolean => {
    const basicValid = validateBasicInfo();
    const pricingValid = validatePricing();
    const imagesValid = validateImages();
    return basicValid && pricingValid && imagesValid;
  };

  const canPublish = (): boolean => {
    if (formData.status === "published") return true;
    return validateAll();
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

  const handleSubmit = async (overrideStatus?: 'draft' | 'published'): Promise<{ success: boolean; productId?: number; error?: string; fieldErrors?: Record<string, string>; errorStep?: number }> => {
    let finalProductType = formData.productType;
    let finalPrice = formData.price;
    let finalDiscountPrice = formData.discountPrice;
    let finalStockQuantity = formData.inStock !== false ? formData.stockQuantity : 0;
    let finalAttributes = { ...formData.attributes };
    let finalVariants = formData.variants.map(v => ({
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

      if (tempFormData.images.length === 0) {
        fieldErrors.images = "At least one image is required";
        errorStep = 2;
      } else {
        const hasPrimary = tempFormData.images.some((img) => img.isPrimary === true);
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
        shopId,
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

      const productRes = await fetch("/api/shopowner/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const productData = await productRes.json();

      if (!productRes.ok) {
        let errorMessage = productData.error || "Failed to create product";
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

      const productId = productData.product_id;

      if (tempFormData.categoryIds.length > 0) {
        try {
          await Promise.all(
            tempFormData.categoryIds.map(async (categoryId) => {
              const catRes = await fetch(
                `/api/shopowner/products/${productId}/categories`,
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

      return { success: true, productId };
    } catch (error) {
      console.error("Submit failed:", error);
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
    setSelectedVariantAttrs((prev) =>
      prev.includes(attrName)
        ? prev.filter((a) => a !== attrName)
        : [...prev, attrName]
    );
  };

  const handleNext = () => {
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

  const removeCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((id) => id !== categoryId),
    }));
    showWarning("Category removed", "success");
  };

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
    canPublish,
    validateAll,
    validateAllSteps,
    calculateCompletion,
  };
}