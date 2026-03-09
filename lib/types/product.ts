// lib/types/product.ts
export interface Product {
    product_id: number;
    product_name: string;
    price: number;
    discount_price: number | null;
    in_stock: boolean;
    product_slug: string;
    primary_image?: string | null;
    images?: {
      image_id: number;
      image_path: string;
      is_primary: boolean;
      created_at: string;
    }[];
    description?: string;
    created_at?: string;
  }