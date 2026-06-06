'use client';

import { useState, useEffect } from 'react';
import { Trash2, Users, Eye } from 'lucide-react'; // Added Eye
import DashCard from '@/app/components/ui/dashCard';
import Link from 'next/link';

interface Affiliate {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  conversion_count: number;
  created_at: string;
}

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/affiliates');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAffiliates(data.affiliates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this affiliate permanently? All linked tenants will have affiliate_id set to NULL.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/affiliates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setAffiliates(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Error deleting affiliate');
    } finally {
      setDeletingId(null);
    }
  };

  const totalAffiliates = affiliates.length;
  const totalConversions = affiliates.reduce((sum, a) => sum + (a.conversion_count || 0), 0);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Affiliate Management</h1>

      {/* Stats Cards using DashCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <DashCard title="Total Affiliates" value={totalAffiliates} icon={Users} />
        <DashCard title="Total Referrals (conversions)" value={totalConversions} icon={Users} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
              )}
              {error && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-red-500">Error: {error}</td></tr>
              )}
              {!loading && !error && affiliates.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No affiliates found.</td></tr>
              )}
              {affiliates.map(aff => (
                <tr key={aff.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{aff.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{aff.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{aff.conversion_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(aff.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      {/* Eye icon to admin dashboard */}
                      <Link
                        href={`/view/affiliates/${aff.id}/dashboard`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Affiliate Dashboard"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(aff.id)}
                        disabled={deletingId === aff.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete Affiliate"
                      >
                        {deletingId === aff.id ? '...' : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}