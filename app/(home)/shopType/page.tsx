'use client';

import Button from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authcontext'; 

interface ShopType {
  value: string;
  label: string;
}

export default function ShopTypeSelection() {
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { token, isAuthenticated, logout } = useAuth(); 

  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/onboardfully');
    }
  }, [isAuthenticated, router]);

  const fetchShopTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shopowner/shop-type');
      const data = await response.json();
      if (data.success) {
        setShopTypes(data.shopTypes);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/shopowner/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // ✅ send token
        },
        body: JSON.stringify({ shop_type: selectedType }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(data.redirectTo || '/dashboard');
      } else {
        // If 401, token may be invalid – logout and redirect to login
        if (response.status === 401) {
          logout();
          router.push('/auth/login?redirect=/onboardfully');
        } else {
          setError(data.error || 'Failed to complete onboarding');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white">Loading shop types...</div>
      </div>
    );
  }

  return (
    <div className="flex md:min-h-screen font-[Plus_Jakarta_Sans] md:items-center justify-start md:justify-center bg-transparent p-4 overflow-auto">
      <div className="w-full max-w-md p-8 border border-gray-100/30 rounded-xl md:bg-black/60 bg-black/20 shadow-md md:mt-0 mt-[80px]">
        <h1 className="text-2xl font-bold text-three/90 mb-6">Complete Onboarding</h1>
        <p className="text-gray-300 mb-6">Select your shop type to continue to your dashboard.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            {shopTypes.map((shop) => (
              <div key={shop.value} className="flex items-center p-3 rounded-lg hover:bg-white/5 transition">
                <input
                  type="radio"
                  id={shop.value}
                  name="shopType"
                  value={shop.value}
                  checked={selectedType === shop.value}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-5 w-5 text-magenta focus:ring-magentaDark cursor-pointer"
                  disabled={submitting}
                />
                <label
                  htmlFor={shop.value}
                  className="ml-3 block text-lg font-medium text-white cursor-pointer"
                >
                  {shop.label}
                </label>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            variant="secondary"
            disabled={!selectedType || submitting}
            className="w-full flex flex-row items-center justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Onboarding'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}