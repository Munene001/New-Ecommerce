// app/admin/shops/page.tsx
import pool from '@/lib/db';
import ShopsClient from './components/shopsClient';
import { RowDataPacket } from 'mysql2';

interface PageProps {
  searchParams: Promise<{ page?: string; tenantId?: string; shopType?: string; search?: string }>;
}

interface StatsRow extends RowDataPacket {
  most_popular_type: string;
  most_popular_count: number;
  least_popular_type: string;
  least_popular_count: number;
  total_shops: number;
  recently_created: number;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
  shop_name: string;
  shop_slug: string;
  shop_type: string;
  created_at: Date;
  tenant_id: number;
  tenant_name: string;
  tenant_status: string;
  owner_email: string;
  owner_name: string;
  product_count: number;
}

export default async function ShopsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  let shops: any[] = [];
  let stats = {
    most_popular_type: 'N/A',
    most_popular_count: 0,
    least_popular_type: 'N/A',
    least_popular_count: 0,
    total_shops: 0,
    recently_created: 0
  };
  let error: string | null = null;

  try {
    const [statsResult] = await pool.query<StatsRow[]>(
      `SELECT 
        (SELECT shop_type FROM shops GROUP BY shop_type ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_type,
        (SELECT COUNT(*) FROM shops GROUP BY shop_type ORDER BY COUNT(*) DESC LIMIT 1) as most_popular_count,
        (SELECT shop_type FROM shops GROUP BY shop_type ORDER BY COUNT(*) ASC LIMIT 1) as least_popular_type,
        (SELECT COUNT(*) FROM shops GROUP BY shop_type ORDER BY COUNT(*) ASC LIMIT 1) as least_popular_count,
        COUNT(*) as total_shops,
        SUM(CASE WHEN s.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recently_created
       FROM shops s
       LEFT JOIN (
         SELECT shop_id, COUNT(*) as product_count
         FROM products
         GROUP BY shop_id
       ) p ON s.shop_id = p.shop_id`
    );
    
    if (statsResult.length > 0) {
      stats = statsResult[0];
    }

    const [shopsRows] = await pool.query<ShopRow[]>(
      `SELECT 
        s.shop_id,
        s.shop_name,
        s.shop_slug,
        s.shop_type,
        s.created_at,
        t.tenant_id,
        t.business_name as tenant_name,
        t.account_status as tenant_status,
        u.email as owner_email,
        u.full_name as owner_name,
        COALESCE(p.product_count, 0) as product_count
       FROM shops s
       JOIN tenant t ON s.tenant_id = t.tenant_id
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN (
         SELECT shop_id, COUNT(*) as product_count
         FROM products
         GROUP BY shop_id
       ) p ON s.shop_id = p.shop_id
       ORDER BY s.created_at DESC`
    );
    
    // Convert Date objects to strings
    shops = shopsRows.map(shop => ({
      ...shop,
      created_at: shop.created_at instanceof Date ? shop.created_at.toISOString() : shop.created_at
    }));
    
  } catch (dbError) {
    console.error('Database error:', dbError);
    error = 'Failed to load shops';
  }
  
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
  
  return (
    <ShopsClient 
      initialShops={shops}
      initialStats={stats}
    />
  );
}