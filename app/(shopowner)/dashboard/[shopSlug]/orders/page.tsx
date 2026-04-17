import pool from '@/lib/db';
import OrdersClient from './components/ordersClient';
import { RowDataPacket } from 'mysql2';

interface PageProps {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

export default async function OrdersPage({ params }: PageProps) {
  const { shopSlug } = await params;
  
  let shopId: number | null = null;
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
    }
  } catch (dbError) {
    console.error('Database error:', dbError);
    error = 'Failed to load shop';
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
  
  // Only pass shopId and shopSlug - no stats needed
  return (
    <OrdersClient 
      shopId={shopId}
      shopSlug={shopSlug}
    />
  );
}