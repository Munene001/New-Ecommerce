'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Calendar, Store } from "lucide-react";
import { useAffiliateIndividualTenant } from "./hooks/individualAffiliate";
import OrderSkeleton from "@/app/(shopowner)/dashboard/[shopSlug]/orders/[orderId]/components/orderSkeleton";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default function AffiliateTenantDetail({ params }: PageProps) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_town: '',
    business_address: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { tenant, shops, loading, fetchTenantDetails, updateTenant } = useAffiliateIndividualTenant();

  useEffect(() => {
    const loadParams = async () => {
      const { tenantId: id } = await params;
      setTenantId(parseInt(id));
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (tenantId) fetchTenantDetails(tenantId);
  }, [tenantId, fetchTenantDetails]);

  useEffect(() => {
    if (tenant) {
      setEditForm({
        business_name: tenant.business_name,
        business_town: tenant.business_town,
        business_address: tenant.business_address,
      });
    }
  }, [tenant]);

  const handleUpdateTenant = async () => {
    if (!tenantId) return;
    const result = await updateTenant(tenantId, editForm);
    if (result.success) {
      setShowEditModal(false);
      setMessage({ type: 'success', text: 'Tenant updated successfully' });
      fetchTenantDetails(tenantId);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleShopClick = (shopSlug: string) => {
    router.push(`/dashboard/${shopSlug}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) return <OrderSkeleton />;
  if (!tenant) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Building2 className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Tenant not found</h2>
        <Button onClick={() => router.back()} variant="secondary" className="mt-4">Go Back</Button>
      </div>
    </div>
  );

  return (
    <div className="md:p-6 px-4 py-6 font-[Poppins] max-w-7xl mx-auto">
      <div className="flex gap-6 items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{tenant.business_name}</h1>
            <p className="text-gray-800 text-sm mt-1">Created on {formatDate(tenant.created_at)}</p>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)} variant="secondary" className="flex items-center gap-2">
          Edit Info
        </Button>
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Store size={18} /> Shops ({shops.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-300">
              {shops.map((shop) => (
                <div key={shop.shop_id} onClick={() => handleShopClick(shop.shop_slug)}
                     className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                  <div><p className="font-medium text-gray-800">{shop.shop_name}</p><p className="text-sm text-gray-600">{shop.shop_type}</p></div>
                  <div className="text-right"><p className="text-sm text-gray-500">{formatDate(shop.created_at)}</p></div>
                </div>
              ))}
              {shops.length === 0 && <div className="px-6 py-8 text-center text-gray-500">No shops found</div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Building2 size={18} /> Business Information</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div><p className="text-sm text-gray-600">Business Name</p><p className="font-medium">{tenant.business_name}</p></div>
              <div><p className="text-sm text-gray-600 flex items-center gap-1"><MapPin size={14} /> Location</p><p>{tenant.business_town}</p><p className="text-sm">{tenant.business_address}</p></div>
              <div><p className="text-sm text-gray-600">Slug</p><p>{tenant.business_slug}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><User size={18} /> Owner Information</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div><p className="text-sm text-gray-600">Name</p><p className="font-medium">{tenant.owner_name}</p></div>
              <div><p className="text-sm text-gray-600 flex items-center gap-1"><Mail size={14} /> Email</p><p>{tenant.owner_email}</p></div>
              <div><p className="text-sm text-gray-600 flex items-center gap-1"><Phone size={14} /> Phone</p><p>{tenant.owner_phone}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800">Account Status</h2>
            </div>
            <div className="px-6 py-4">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {tenant.account_status.replace('_', ' ').toUpperCase()}
              </span>
              {tenant.status_expiry_date && <p className="text-sm text-gray-600 mt-2">Expiry: {formatDate(tenant.status_expiry_date)}</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={18} /> Timeline</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div><p className="text-sm text-gray-600">Created</p><p>{formatDate(tenant.created_at)}</p></div>
              <div><p className="text-sm text-gray-600">Last Updated</p><p>{formatDate(tenant.updated_at)}</p></div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Tenant Information</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input type="text" value={editForm.business_name} onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-magenta" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Town/City</label>
                <input type="text" value={editForm.business_town} onChange={(e) => setEditForm({ ...editForm, business_town: e.target.value })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-magenta" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={editForm.business_address} onChange={(e) => setEditForm({ ...editForm, business_address: e.target.value })}
                          rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-magenta" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateTenant} className="px-4 py-2 bg-magenta text-white rounded-md hover:bg-magenta-dark">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}