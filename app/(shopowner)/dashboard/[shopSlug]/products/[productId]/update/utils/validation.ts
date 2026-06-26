import { Attribute, ProductFormData, ProductImage, } from "../../../add/types";

export const validateBasicInfo = (
  formData: ProductFormData,
  attributeSchema: Attribute[]
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!formData.productName.trim()) {
    errors.productName = "Product name is required";
  }
  if (!formData.productSlug.trim()) {
    errors.productSlug = "Product slug is required";
  }
  
  attributeSchema
    .filter((f: Attribute) => f.required && f.variant !== true)
    .forEach((field: Attribute) => {
      const value = formData.attributes[field.name];
      if (field.type !== "boolean" && (!value || value.toString().trim() === "")) {
        errors[`attr.${field.name}`] = `${field.label} is required`;
      }
    });
  
  return errors;
};

export const validatePricing = (
  formData: ProductFormData,
  selectedVariantAttrs: string[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (formData.productType === "simple") {
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = "Valid price is required";
    }
    if (formData.discountPrice && Number(formData.discountPrice) < 0) {
      errors.discountPrice = "Discount price cannot be negative";
    }
    if (
      formData.discountPrice &&
      Number(formData.discountPrice) >= Number(formData.price)
    ) {
      errors.discountPrice = "Discount price must be less than regular price";
    }
    if (formData.inStock !== false && formData.stockQuantity < 0) {
      errors.stockQuantity = "Stock quantity cannot be negative";
    }
  } else {
    if (selectedVariantAttrs.length === 0) {
      errors.variants = "Select at least one attribute that varies";
    }
    if (formData.variants.length === 0) {
      errors.variants = "Add at least one variant";
    }
    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      for (const attr of selectedVariantAttrs) {
        if (!variant.attributes[attr] || variant.attributes[attr].toString().trim() === "") {
          errors[`variant_${i}_${attr}`] = `Variant ${i + 1}: Missing ${attr}`;
        }
      }
      if (!variant.price || Number(variant.price) <= 0) {
        errors[`variant_${i}_price`] = `Variant ${i + 1}: Price must be > 0`;
      }
      if (variant.discountPrice && Number(variant.discountPrice) >= Number(variant.price)) {
        errors[`variant_${i}_discount`] = `Variant ${i + 1}: Discount must be < price`;
      }
      if (variant.inStock !== false && variant.stockQuantity < 0) {
        errors[`variant_${i}_stock`] = `Variant ${i + 1}: Stock cannot be negative`;
      }
    }
  }

  return errors;
};

export const validateImages = (images: ProductImage[]): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (images.length === 0) {
    errors.images = "At least one image is required";
  } else {
    const hasPrimary = images.some((img: ProductImage) => img.isPrimary === true);
    if (!hasPrimary) {
      errors.images = "A primary image is required";
    }
  }
  
  return errors;
};

export const validateAllSteps = (
  formData: ProductFormData,
  attributeSchema: Attribute[],
  selectedVariantAttrs: string[],
  sections: string[]
): {
  hasErrors: boolean;
  firstErrorStep: number;
  stepErrors: Record<string, Record<string, string>>;
  stepNames: string[];
  errorSummary: string;
} => {
  const stepErrors: Record<string, Record<string, string>> = {};
  let firstErrorStep = -1;
  const errorMessages: string[] = [];

  const basicErrors = validateBasicInfo(formData, attributeSchema);
  if (Object.keys(basicErrors).length > 0) {
    stepErrors.basicInfo = basicErrors;
    if (firstErrorStep === -1) firstErrorStep = 0;
    Object.values(basicErrors).forEach((msg) => errorMessages.push(msg));
  }

  const pricingErrors = validatePricing(formData, selectedVariantAttrs);
  if (Object.keys(pricingErrors).length > 0) {
    stepErrors.pricing = pricingErrors;
    if (firstErrorStep === -1) firstErrorStep = 1;
    Object.values(pricingErrors).forEach((msg) => errorMessages.push(msg));
  }

  const imageErrors = validateImages(formData.images);
  if (Object.keys(imageErrors).length > 0) {
    stepErrors.images = imageErrors;
    if (firstErrorStep === -1) firstErrorStep = 2;
    Object.values(imageErrors).forEach((msg) => errorMessages.push(msg));
  }

  let errorSummary = "";
  if (firstErrorStep !== -1) {
    const stepName = sections[firstErrorStep];
    const stepKeyMap: Record<string, string> = {
      "Basic Info": "basicInfo",
      "Pricing & Inventory": "pricing",
      "Images": "images",
      "Categories": "categories",
      "Review & Publish": "review"
    };
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

export const getErrorStep = (errors: Record<string, string>): number | null => {
  if (!errors || Object.keys(errors).length === 0) return null;

  const basicInfoKeys = ['productName', 'productSlug', 'attr.'];
  const pricingKeys = ['price', 'discountPrice', 'variant_', 'variants'];
  const imageKeys = ['images'];

  const errorKeys = Object.keys(errors);

  if (errorKeys.some((key) => basicInfoKeys.some((k) => key.includes(k)))) {
    return 0;
  }
  if (errorKeys.some((key) => pricingKeys.some((k) => key.includes(k)))) {
    return 1;
  }
  if (errorKeys.some((key) => imageKeys.some((k) => key.includes(k)))) {
    return 2;
  }

  return 0;
};