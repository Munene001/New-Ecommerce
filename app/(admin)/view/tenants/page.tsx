// app/admin/tenants/page.tsx
import pool from '@/lib/db';
import TenantsClient from './components/tenantClient';
import { RowDataPacket } from 'mysql2';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}

interface StatsRow extends RowDataPacket {
  total_tenants: number;
  free_trial: number;
  active: number;
  expired_suspended: number;
}

export default async function TenantsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  let tenants: any[] = [];
  let stats = {
    total_tenants: 0,
    free_trial: 0,
    active: 0,
    expired_suspended: 0
  };
  let error: string | null = null;

  try {
    const [statsResult] = await pool.query<StatsRow[]>(
      `SELECT 
        COUNT(*) as total_tenants,
        SUM(CASE WHEN t.account_status = 'free_trial' THEN 1 ELSE 0 END) as free_trial,
        SUM(CASE WHEN t.account_status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN t.account_status IN ('expired', 'suspended') THEN 1 ELSE 0 END) as expired_suspended
       FROM tenant t`
    );
    stats = statsResult[0];

    const [tenantsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        t.tenant_id,
        t.business_name,
        t.business_slug,
        t.account_status,
        t.created_at,
        u.email as owner_email,
        u.full_name as owner_name,
        COUNT(s.shop_id) as total_shops
       FROM tenant t
       JOIN users u ON t.user_id = u.user_id
       LEFT JOIN shops s ON t.tenant_id = s.tenant_id
       GROUP BY t.tenant_id
       ORDER BY t.created_at DESC`
    );
    tenants = tenantsRows;
    
  } catch (dbError) {
    console.error('Database error:', dbError);
    error = 'Failed to load tenants';
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
    <TenantsClient 
      initialTenants={tenants}
      initialStats={stats}
    />
  );
}