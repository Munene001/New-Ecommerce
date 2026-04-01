export interface Attribute {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id?: number;
  file?: File;
  preview: string;
  isPrimary: boolean;
  size_kb?: number;
}

export interface ProductFormData {
  productName: string;
  productSlug: string;
  description: string;
  price: string;
  discountPrice?: string; // Add this (optional)
  inStock: boolean;
  attributes: Record<string, string | number | boolean | null>;
  images: ProductImage[];
  categoryIds: number[];
}