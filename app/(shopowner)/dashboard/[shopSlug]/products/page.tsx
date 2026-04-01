// app/(shopowner)/dashboard/[shopSlug]/products/page.tsx
import pool from '@/lib/db';
import ProductsClient from './components/productClient';
import { RowDataPacket } from 'mysql2';

interface PageProps {
  params: Promise<{  
    shopSlug: string;
  }>;
  searchParams: Promise<{  
    page?: string;
  }>;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

interface CountResult extends RowDataPacket {
  total: number;
}

interface CategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
}

interface ProductImage {
  image_id: number;
  image_path: string;
  is_primary: boolean;
  created_at: string;
}

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  price: number;
  discount_price: number | null;
  in_stock: number;
  product_slug: string;
  created_at: Date;
  images: string | ProductImage[] | null;
}

export default async function AllProducts({ params, searchParams }: PageProps) {
  // Await both params and searchParams
  const { shopSlug } = await params;
  const { page } = await searchParams;
  
  const currentPage = parseInt(page || '1');
  const limit = 20;
  
  let shopId: number | null = null;
  let totalProducts = 0;
  let totalCategories = 0;
  let totalDiscounted = 0;
  let totalInstock = 0;
  let products: ProductRow[] = [];
  let categories: CategoryRow[] = [];
  let totalPages = 0;
  let error: string | null = null;

  try {
    // 1. Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (!shopRows || shopRows.length === 0) {
      console.log('Shop not found for slug:', shopSlug);
      error = 'Shop not found';
    } else {
      shopId = shopRows[0].shop_id;
      
      // 2. Get TOTAL PRODUCTS count for stats
      const [totalProductsResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM products WHERE shop_id = ?',
        [shopId]
      );
      totalProducts = totalProductsResult[0].total;
      
      // 3. Get CATEGORIES count for stats
      const [categoriesResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM categories WHERE shop_id = ?',
        [shopId]
      );
      totalCategories = categoriesResult[0].total;
      
      // 4. Get DISCOUNTED count for stats
      const [discountedResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM products WHERE shop_id = ? AND discount_price IS NOT NULL',
        [shopId]
      );
      totalDiscounted = discountedResult[0].total;
      
      // 5. Get INSTOCK count for stats
      const [instockResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM products WHERE shop_id = ? AND in_stock = 1',
        [shopId]
      );
      totalInstock = instockResult[0].total;
      
      // 6. Get paginated products with primary image for initial display
      const [productRows] = await pool.query<ProductRow[]>(`
        SELECT 
          p.product_id,
          p.product_name,
          p.price,
          p.discount_price,
          p.in_stock,
          p.product_slug,
          p.created_at,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'image_id', pi.image_id,
                'image_path', pi.image_path,
                'is_primary', pi.is_primary,
                'created_at', pi.created_at
              )
            )
            FROM product_images pi
            WHERE pi.product_id = p.product_id
          ) as images
        FROM products p
        WHERE p.shop_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [shopId, limit, (currentPage - 1) * limit]);
      
      products = productRows;
      totalPages = Math.ceil(totalProducts / limit);
      
      const [categoryRows] = await pool.query<CategoryRow[]>(
        'SELECT category_id, category_name FROM categories WHERE shop_id = ? ORDER BY category_name',
        [shopId]
      );
      categories = categoryRows;
    }
  } catch (dbError) {
    console.error('Database error:', dbError);
    error = 'Failed to load products';
  }
  
  // Convert to plain objects for serialization
  const initialProducts = JSON.parse(JSON.stringify(products));
  const initialCategories = JSON.parse(JSON.stringify(categories));
  
  // If there was an error, show error message
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  // If shop not found
  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
          <p className="text-gray-600">The shop you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }
  
  // Pass everything to client component
  return (
    <ProductsClient 
      
      shopId={shopId}
      shopSlug={shopSlug}
      
      
      totalProducts={totalProducts}
      totalCategories={totalCategories}
      totalDiscounted={totalDiscounted}
      totalInstock={totalInstock}
      categories={initialCategories}
    />
  );
}