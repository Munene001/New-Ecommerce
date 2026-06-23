// lib/types/product.ts
export interface ProductImage {
  image_id: number;
  image_path: string;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  variant_id: number;
  attributes: Record<string, any>;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface DisplayPrice {
  min: number;
  max: number;
  formatted: string;
  isRange: boolean;
}

export interface StockInfo {
  type: 'simple' | 'varies';
  total: number;
  quantity?: number; // For simple products
  variants?: Array<{
    stock: number;
    attributes: Record<string, any>;
  }>; // For variable products
}

export interface Product {
  product_id: number;
  shop_id: number;
  shop_type: string;
  product_name: string;
  product_slug: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  product_type: 'simple' | 'variable';
  status: 'draft' | 'published';
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
  display_price: DisplayPrice;
  stock_info: StockInfo;
  in_stock: boolean;
  can_publish: boolean;
}