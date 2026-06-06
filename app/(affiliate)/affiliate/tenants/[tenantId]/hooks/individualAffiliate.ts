import { useState, useCallback } from 'react';

interface Tenant {
  tenant_id: number;
  business_name: string;
  business_slug: string;
  business_town: string;
  business_address: string;
  account_status: string;
  status_expiry_date: string;
  created_at: string;
  updated_at: string;
  business_info_complete: number;
  owner_email: string;
  owner_name: string;
  owner_phone: string;
}

interface Shop {
  shop_id: number;
  shop_name: string;
  shop_slug: string;
  shop_type: string;
  created_at: string;
}

interface UseAffiliateIndividualTenantReturn {
  tenant: Tenant | null;
  shops: Shop[];
  loading: boolean;
  fetchTenantDetails: (tenantId: number) => Promise<void>;
  updateTenant: (tenantId: number, data: any) => Promise<{ success: boolean; message: string }>;
}

export function useAffiliateIndividualTenant(): UseAffiliateIndividualTenantReturn {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTenantDetails = useCallback(async (tenantId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/affiliate/tenants/${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch tenant');
      const data = await res.json();
      setTenant(data.tenant);
      setShops(data.shops);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenant = async (tenantId: number, data: any) => {
    try {
      const res = await fetch(`/api/affiliate/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update tenant');
      }
      return { success: true, message: 'Tenant updated successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tenant';
      return { success: false, message: errorMessage };
    }
  };

  return {
    tenant,
    shops,
    loading,
    fetchTenantDetails,
    updateTenant,
  };
}