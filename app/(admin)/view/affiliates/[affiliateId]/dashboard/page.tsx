'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Users, Store } from 'lucide-react';
import DashCard from '@/app/components/ui/dashCard';
import TenantsTable from '../../../tenants/components/tenantTable';
import ShopsTable from '../../../shops/components/shopsTables';

interface Affiliate {
  affiliate_id: number;
  full_name: string;
  email: string;
  conversion_count: number;
  created_at: string;
}

export default function AdminAffiliateDashboard() {
  const params = useParams();
  const affiliateId = params.affiliateId;
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [tenants, setTenants] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/affiliates/${affiliateId}/dashboard`)
      .then(res => res.json())
      .then(data => {
        setAffiliate(data.affiliate);
        setTenants(data.tenants);
        setShops(data.shops);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [affiliateId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!affiliate) return <div className="p-8">Affiliate not found</div>;

  const referralLink = `${window.location.origin}/go/${affiliate.affiliate_id}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{affiliate.full_name}</h1>
      <p className="text-gray-600 mb-6">{affiliate.email}</p>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DashCard title="Referrals (conversions)" value={affiliate.conversion_count} icon={Users} />
        <DashCard title="Total Tenants" value={tenants.length} icon={Store} />
        <DashCard title="Total Shops" value={shops.length} icon={Store} />
      </div>

      {/* Referral link (optional) */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <p className="text-sm font-medium mb-2">Referral Link</p>
        <div className="flex gap-2">
          <input type="text" readOnly value={referralLink} className="flex-1 p-2 border rounded bg-white text-sm" />
          <button onClick={() => navigator.clipboard.writeText(referralLink)} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Referred Tenants */}
      <h2 className="text-xl font-semibold mb-4">Referred Tenants</h2>
      <div className="mb-8">
        <TenantsTable
          tenants={tenants}
          loading={false}
          hasMore={false}
          loadMore={() => {}}
          onRowClick={(tenantId) => window.open(`/affiliate/tenants/${tenantId}`, '_blank')}
        />
      </div>

      {/* Shops from those tenants */}
      <h2 className="text-xl font-semibold mb-4">Shops</h2>
      <ShopsTable
        shops={shops}
        loading={false}
        hasMore={false}
        loadMore={() => {}}
        onRowClick={(shopId) => window.open(`/affiliate/shops/${shopId}`, '_blank')}
      />
    </div>
  );
}