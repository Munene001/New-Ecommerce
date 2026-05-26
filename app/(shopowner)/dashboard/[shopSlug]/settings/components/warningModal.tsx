// components/ui/WarningModal.tsx
"use client";

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  oldSlug: string;
  newSlug: string;
  loading?: boolean;
}

export default function WarningModal({
  isOpen,
  onClose,
  onConfirm,
  oldSlug,
  newSlug,
  loading = false,
}: WarningModalProps) {
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 p-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Icon icon="mdi:alert" className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Shop Link change warning
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Changing your shop name will also change your shop Link.Any existing
            links to your shop will stop working.
          </p>

          {/* Visual URL comparison */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Current Shop Link;
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Icon icon="mdi:link" className="w-4 h-4 text-gray-400" />
              <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                {baseUrl}/{oldSlug}
              </code>
            </div>

            <div className="flex justify-center my-2">
              <Icon icon="mdi:arrow-down" className="w-5 h-5 text-gray-400" />
            </div>

            <p className="text-sm font-medium text-gray-700 mb-2">
              New Shop Link(after change)
            </p>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:link" className="w-4 h-4 text-red-400" />
              <code className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                {baseUrl}/{newSlug}
              </code>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon icon="mdi:information" className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800">
                You will be redirected to the new shop URL automatically after saving.
                
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}