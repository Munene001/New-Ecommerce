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

interface CountResult extends RowDataPacket {
  total: number;
}

export default async function OrdersPage({ params }: PageProps) {
  const { shopSlug } = await params;
  
  let shopId: number | null = null;
  let totalOrders = 0;
  let pendingOrders = 0;
  let processingOrders = 0;
  let completedOrders = 0;
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
      
      // Get total orders
      const [totalResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM orders WHERE shop_id = ?',
        [shopId]
      );
      totalOrders = totalResult[0].total;
      
      // Get pending orders
      const [pendingResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM orders WHERE shop_id = ? AND order_status = "pending"',
        [shopId]
      );
      pendingOrders = pendingResult[0].total;
      
      // Get processing orders
      const [processingResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM orders WHERE shop_id = ? AND order_status = "processing"',
        [shopId]
      );
      processingOrders = processingResult[0].total;
      
      // Get completed (delivered) orders
      const [completedResult] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM orders WHERE shop_id = ? AND order_status = "delivered"',
        [shopId]
      );
      completedOrders = completedResult[0].total;
    }
  } catch (dbError) {
    console.error('Database error:', dbError);
    error = 'Failed to load orders';
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
    <OrdersClient 
      shopId={shopId}
      shopSlug={shopSlug}
      totalOrders={totalOrders}
      pendingOrders={pendingOrders}
      processingOrders={processingOrders}
      completedOrders={completedOrders}
    />
  );
}