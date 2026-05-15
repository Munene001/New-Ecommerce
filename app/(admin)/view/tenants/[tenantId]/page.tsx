// app/admin/tenants/[tenantId]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SimpleToast from "@/app/components/ui/simpleToast";
import Button from "@/app/components/ui/button";
import { ArrowLeft, Trash2, Building2, User, Mail, Phone, MapPin, Calendar, Store } from "lucide-react";
import { useIndividualTenant } from "./hooks/individualTenant";
import OrderSkeleton from "@/app/(shopowner)/dashboard/[shopSlug]/orders/[orderId]/components/orderSkeleton";

interface PageProps {
  params: Promise<{
    tenantId: string;
  }>;
}

interface Shop {
  shop_id: number;
  shop_name: string;
  shop_slug: string;
  shop_type: string;
  created_at: string;
}

export default function IndividualTenant({ params }: PageProps) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_town: '',
    business_address: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    tenant,
    shops,
    loading,
    fetchTenantDetails,
    updateTenant,
    changeStatus,
    deleteTenant,
  } = useIndividualTenant();

  useEffect(() => {
    const loadParams = async () => {
      const { tenantId: id } = await params;
      setTenantId(parseInt(id));
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails(tenantId);
    }
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

  const handleStatusChange = async (newStatus: string) => {
    if (!tenantId) return;
    
    const result = await changeStatus(tenantId, newStatus);
    if (result.success) {
      setMessage({ type: 'success', text: `Status updated to ${newStatus}` });
      fetchTenantDetails(tenantId);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

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

  const handleDeleteTenant = async () => {
    if (!tenantId) return;
    
    const result = await deleteTenant(tenantId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Tenant deleted successfully' });
      setTimeout(() => {
        router.push('/view/tenants');
      }, 1500);
    } else {
      setMessage({ type: 'error', text: result.message });
      setShowDeleteModal(false);
    }
  };

  const handleShopClick = (shopSlug: string) => {
    router.push(`/dashboard/${shopSlug}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 border-green-300';
      case 'free_trial': return 'bg-blue-500/10 text-blue-600 border-blue-300';
      case 'expired': return 'bg-red-500/10 text-red-600 border-red-300';
      case 'suspended': return 'bg-orange-500/10 text-orange-600 border-orange-300';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <OrderSkeleton />;
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Tenant not found</h2>
          <Button
            onClick={() => router.back()}
            variant="secondary"
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-6 px-4 py-6 font-[Poppins] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex gap-6 items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{tenant.business_name}</h1>
            <p className="text-gray-800 text-sm mt-1">Created on {formatDate(tenant.created_at)}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setShowEditModal(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            Edit Info
          </Button>
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="secondary"
            className="flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
          >
            <Trash2 size={18} />
            <span>Delete Tenant</span>
          </Button>
        </div>
      </div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shops */}
          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Store size={18} />
                Shops ({shops.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-300">
              {shops.map((shop: Shop) => (
                <div 
                  key={shop.shop_id} 
                  onClick={() => handleShopClick(shop.shop_slug)}
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{shop.shop_name}</p>
                    <p className="text-sm text-gray-600">{shop.shop_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(shop.created_at)}</p>
                  </div>
                </div>
              ))}
              {shops.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No shops found for this tenant
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tenant Info - Right Column */}
        <div className="space-y-6">
          {/* Business Information */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building2 size={18} />
                Business Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-medium text-black">{tenant.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin size={14} />
                  Location
                </p>
                <p className="text-black">{tenant.business_town}</p>
                <p className="text-black text-sm">{tenant.business_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Slug</p>
                <p className="text-black">{tenant.business_slug}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} />
                Owner Information
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-black">{tenant.owner_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail size={14} />
                  Email
                </p>
                <p className="text-black">{tenant.owner_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone size={14} />
                  Phone
                </p>
                <p className="text-black">{tenant.owner_phone}</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800">Account Status</h2>
            </div>
            <div className="px-6 py-4">
              <select
                value={tenant.account_status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border font-medium cursor-pointer ${getStatusColor(tenant.account_status)}`}
              >
                <option value="free_trial">Free Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
              </select>
              {tenant.status_expiry_date && (
                <p className="text-sm text-gray-600 mt-2">
                  Expiry: {formatDate(tenant.status_expiry_date)}
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={18} />
                Timeline
              </h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-gray-700">{formatDate(tenant.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-gray-700">{formatDate(tenant.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Tenant Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-magenta"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town/City</label>
                <input
                  type="text"
                  value={editForm.business_town}
                  onChange={(e) => setEditForm({ ...editForm, business_town: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-magenta"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={editForm.business_address}
                  onChange={(e) => setEditForm({ ...editForm, business_address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-magenta"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTenant}
                className="px-4 py-2 bg-magenta text-white rounded-md hover:bg-magenta-dark"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tenant</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {tenant.business_name}? This will also delete ALL their shops and data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTenant}
                className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
              >
                Yes, Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}