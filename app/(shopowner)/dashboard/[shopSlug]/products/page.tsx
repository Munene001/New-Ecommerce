// app/(shopowner)/dashboard/[shopSlug]/products/page.tsx
import pool from '@/lib/db';
import ProductsClient from './components/productClient';

interface PageProps {
  params: Promise<{  
    shopSlug: string;
  }>;
  searchParams: Promise<{  
    page?: string;
  }>;
}

export default async function AllProducts({ params, searchParams }: PageProps) {
  // Await both params and searchParams
  const { shopSlug } = await params;
  const { page } = await searchParams;
  
  const currentPage = parseInt(page || '1');
  const limit = 20;
  
  try {
    // 1. Get shop_id from slug
    const [shopRows] = await pool.query(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (!shopRows || (shopRows as any[]).length === 0) {
      console.log('Shop not found for slug:', shopSlug); 
    }
    
    const shopId = (shopRows as any[])[0].shop_id;
    
    // 2. Get TOTAL PRODUCTS count for stats
    const [totalProductsResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE shop_id = ?',
      [shopId]
    );
    const totalProducts = (totalProductsResult as any[])[0].total;
    
    // 3. Get CATEGORIES count for stats
    const [categoriesResult] = await pool.query(
      'SELECT COUNT(*) as total FROM categories WHERE shop_id = ?',
      [shopId]
    );
    const totalCategories = (categoriesResult as any[])[0].total;
    
    // 4. Get DISCOUNTED count for stats
    const [discountedResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE shop_id = ? AND discount_price IS NOT NULL',
      [shopId]
    );
    const totalDiscounted = (discountedResult as any[])[0].total;
    
    // 5. Get INSTOCK count for stats
    const [instockResult] = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE shop_id = ? AND in_stock = 1',
      [shopId]
    );
    const totalInstock = (instockResult as any[])[0].total;
    
    // 6. Get paginated products with primary image for initial display
    const [products] = await pool.query(`
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
    
    const totalPages = Math.ceil(totalProducts / limit);
    
    const [categories] = await pool.query(
      'SELECT category_id, category_name FROM categories WHERE shop_id = ? ORDER BY category_name',
      [shopId]
    );
    
    // Convert to plain objects for serialization
    const initialProducts = JSON.parse(JSON.stringify(products));
    const initialCategories = JSON.parse(JSON.stringify(categories));
    
    // 8. Pass everything to client component
    return (
      <ProductsClient 
        initialProducts={initialProducts}
        shopId={shopId}
        shopSlug={shopSlug}
        initialPage={currentPage}
        totalPages={totalPages}
        totalProducts={totalProducts}
        totalCategories={totalCategories}
        totalDiscounted={totalDiscounted}
        totalInstock={totalInstock}
        categories={initialCategories}
      />
    );
    
  } catch (error) {
    console.error('Database error:', error);
    return <div>Error loading products</div>;
  }
}