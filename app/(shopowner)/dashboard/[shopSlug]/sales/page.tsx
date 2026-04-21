// app/(dashboard)/[shopSlug]/sales-analytics/page.tsx (Server Component)
// OR maybe it's just the main dashboard page?

import { createSupabaseServerClient } from '@/lib/supabase-server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import SalesAnalyticsClient from './components/salesAnalyticsClient';

interface PageProps {
  params: Promise<{ shopSlug: string }>;
}

interface ShopRow extends RowDataPacket {
  shop_id: number;
}

export default async function SalesAnalyticsPage({ params }: PageProps) {
  const { shopSlug } = await params;
  
  let shopId: number | null = null;
  let error: string | null = null;

  try {
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
  
  return (
    <SalesAnalyticsClient 
      shopId={shopId}
      shopSlug={shopSlug}
    />
  );
}