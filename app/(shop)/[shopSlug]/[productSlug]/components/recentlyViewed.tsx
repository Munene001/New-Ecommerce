'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Props {
  currentProductId: number;
  secondaryColor: string;
}

export default function RecentlyViewed({ currentProductId, secondaryColor }: Props) {
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewed');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecent(parsed.filter((id: number) => id !== currentProductId).slice(0, 5));
      } catch (e) {
        console.error(e);
      }
    }
    const updated = [currentProductId, ...(stored ? JSON.parse(stored) : [])].slice(0, 10);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  }, [currentProductId]);

  if (recent.length === 0) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Recently Viewed</h2>
      <div className="space-y-2">
        {recent.map((productId) => (
          <Link
            key={productId}
            href={`/shop/${productId}`}
            className="block p-2 bg-white rounded border hover:shadow transition"
            style={{ borderColor: secondaryColor + '20' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                img
              </div>
              <span className="text-sm font-medium">Product {productId}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}