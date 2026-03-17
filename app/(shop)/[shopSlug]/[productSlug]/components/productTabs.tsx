'use client';

import { useState } from 'react';

interface Props {
  description: string;
  attributes: Record<string, any>;
  reviews: any[];
  secondaryColor: string;
}

export default function ProductTabs({ description, attributes, reviews, secondaryColor }: Props) {
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>('description');

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200">
        {(['description', 'additional', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-black border-b-2'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === tab ? { borderBottomColor: secondaryColor } : {}}
          >
            {tab === 'additional' ? 'Additional Info' : tab}
            {tab === 'reviews' && ` (${reviews.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-4">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p>{description || 'No description available.'}</p>
          </div>
        )}

        {activeTab === 'additional' && (
          <div>
            {attributes && Object.keys(attributes).length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(attributes).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                    {renderValue(value)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No additional information available.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {reviews.length > 0 ? (
              <ul className="space-y-4">
                {reviews.map((review, idx) => (
                  <li key={idx} className="border-b pb-4">
                    {/* Render review */}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No reviews yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}