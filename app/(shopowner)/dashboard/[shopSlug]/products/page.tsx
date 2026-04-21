// app/(shopowner)/dashboard/[shopSlug]/products/page.tsx
import pool from '@/lib/db';
import ProductsClient from './components/productClient';
import { RowDataPacket } from 'mysql2';

interface PageProps {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

interface CategoryRow extends RowDataPacket {
  category_id: number;
  category_name: string;
}

export default async function AllProducts({ params }: PageProps) {
  const { shopSlug } = await params;
  
  let shopId: number | null = null;
  let categories: CategoryRow[] = [];
  let error: string | null = null;

  try {
    // Get shop_id from slug
    const [shopRows] = await pool.query<ShopRow[]>(
      'SELECT shop_id FROM shops WHERE shop_slug = ?',
      [shopSlug]
    );
    
    if (!shopRows || shopRows.length === 0) {
      error = 'Shop not found';
    } else {
      shopId = shopRows[0].shop_id;
      
      // Get categories for filter dropdown
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
  
  if (error || !shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Shop not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <ProductsClient 
      shopId={shopId}
      shopSlug={shopSlug}
      categories={categories}
    />
  );
}