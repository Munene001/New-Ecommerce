"use client";

import { Info, AlertCircle } from "lucide-react";

interface CodModuleProps {
  codEnabled: boolean;
  canDisableCod: boolean;
  onToggle: (enabled: boolean) => void;
  loading: boolean;
}

export default function CodModule({ codEnabled, canDisableCod, onToggle, loading }: CodModuleProps) {
  const handleToggle = () => {
    onToggle(!codEnabled);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black">Cash on Delivery (COD)</h3>
          <div className="flex items-center gap-2 mt-1">
            <Info className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-800">
              Customers pay cash when they receive the order
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading || (!codEnabled && !canDisableCod)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            codEnabled ? "bg-green-600" : "bg-gray-300"
          } ${(!codEnabled && !canDisableCod) ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              codEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {!codEnabled && !canDisableCod && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-700">
              Cannot disable COD. Please configure Direct M-Pesa first
            </p>
          </div>
        </div>
      )}
    </div>
  );
}