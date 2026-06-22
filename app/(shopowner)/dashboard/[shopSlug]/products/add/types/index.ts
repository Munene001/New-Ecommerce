export interface Attribute {
  name: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  variant?: boolean;  // NEW: true if this attribute can vary
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
  status?: "pending" | "uploading" | "success" | "failed";
  serverId?: number;
  size_kb?: number;
}

// NEW: Product variant interface
export interface ProductVariant {
  attributes: Record<string, string | number | boolean | null>;
  price: string;
  discountPrice?: string;
  stockQuantity: number;
}

export interface ProductFormData {
  productName: string;
  productSlug: string;
  description: string;
  
  // NEW fields
  productType: 'simple' | 'variable';
  status: 'draft' | 'published';
  
  // For SIMPLE products
  price: string;
  discountPrice?: string;
  stockQuantity: number;  // REPLACES inStock
  
  // Product-level attributes (non-variant)
  attributes: Record<string, string | number | boolean | null>;
  
  // For VARIABLE products
  variants: ProductVariant[];  // NEW
  
  images: ProductImage[];
  categoryIds: number[];
}