export interface Attribute {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  variant?: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id?: string | number;
  file?: File;
  preview: string;
  isPrimary: boolean;
  status?: "pending" | "uploading" | "success" | "failed" | "deleted";
  serverId?: number;
  size_kb?: number;
}

export interface ProductVariant {
  attributes: Record<string, string | number | boolean | null>;
  price: string;
  discountPrice?: string;
  stockQuantity: number;
  inStock?: boolean;
}

export interface ProductFormData {
  productName: string;
  productSlug: string;
  description: string;
  productType: 'simple' | 'variable';
  status: 'draft' | 'published';
  price: string;
  discountPrice?: string;
  stockQuantity: number;
  inStock: boolean;
  attributes: Record<string, string | number | boolean | null>;
  variants: ProductVariant[];
  images: ProductImage[];
  categoryIds: number[];
}