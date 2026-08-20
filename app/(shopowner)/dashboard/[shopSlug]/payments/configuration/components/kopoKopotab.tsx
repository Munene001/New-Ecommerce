"use client";

import { 
  CheckCircle, 
  Trash2, 
  Save,
  Loader2,
  Key,
  Shield,
  Smartphone,
  Zap,
  HelpCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import FormField from "@/app/components/ui/formField";

interface KopokopoConfig {
  client_id: string | null;
  client_secret: string | null;
  till_number: string | null;
  webhook_secret: string | null;
}

interface KopokopoTabProps {
  config: KopokopoConfig | null;
  isActive: boolean;
  onSave: (config: any) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  loading: boolean;
}

export default function KopokopoTab({ config, isActive, onSave, onDelete, loading }: KopokopoTabProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tillNumber, setTillNumber] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  useEffect(() => {
    if (config) {
      setClientId(config.client_id || '');
      setClientSecret(config.client_secret || '');
      setTillNumber(config.till_number || '');
      setWebhookSecret(config.webhook_secret || '');
    }
  }, [config]);

  const hasConfig = config && config.client_id !== null && config.client_id !== '';

  const getActiveMessage = () => {
    if (!config || !config.client_id) return null;
    return `Kopo Kopo STK Push (Till: ${config.till_number || 'N/A'})`;
  };

  const activeMessage = getActiveMessage();

  const handleSave = async () => {
    const cleanClientId = clientId.trim();
    const cleanClientSecret = clientSecret.trim();
    const cleanTillNumber = tillNumber.trim();

    if (!cleanClientId) {
      alert('Client ID is required');
      return;
    }
    if (!cleanClientSecret) {
      alert('Client Secret is required');
      return;
    }
    if (!cleanTillNumber) {
      alert('Till Number is required');
      return;
    }

    const payload: any = {
      client_id: cleanClientId,
      client_secret: cleanClientSecret,
      till_number: cleanTillNumber,
    };

    if (webhookSecret.trim()) {
      payload.webhook_secret = webhookSecret.trim();
    }

    await onSave(payload);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove your Kopo Kopo configuration?')) {
      await onDelete();
      setClientId('');
      setClientSecret('');
      setTillNumber('');
      setWebhookSecret('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 py-6 px-3">
      {isActive && activeMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium">
            Active: {activeMessage}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Kopo Kopo STK Push Configuration</h3>
        {hasConfig && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Remove Configuration
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Smartphone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-black">
            <h4 className="font-medium text-sm">Kopo Kopo STK Push</h4>
            <p className="text-sm mt-1">
              Customers will receive a prompt on their phone to complete payment. 
              Enter your Kopo Kopo credentials below.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
              <Zap className="w-3 h-3" />
              <span>Customers receive a prompt on their phone - no manual entry required</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-black">
            <p className="text-sm font-medium text-yellow-700">Kopo Kopo API Credentials</p>
            <p className="text-xs text-yellow-600 mt-1">
              These credentials are obtained from the Kopo Kopo Developer Portal.
              You need a registered Till number to get these.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <FormField
            name="client_id"
            label="Client ID"
            value={clientId}
            onChange={(e: any) => setClientId(e.target.value)}
            type="text"
            placeholder="Enter Client ID from Kopo Kopo portal"
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Your Kopo Kopo API Client ID
          </p>
        </div>

        <div>
          <FormField
            name="client_secret"
            label="Client Secret"
            value={clientSecret}
            onChange={(e: any) => setClientSecret(e.target.value)}
            type="password"
            placeholder="Enter Client Secret from Kopo Kopo portal"
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Your Kopo Kopo API Client Secret - this will be encrypted
          </p>
        </div>

        <div>
          <FormField
            name="till_number"
            label="Till Number"
            value={tillNumber}
            onChange={(e: any) => setTillNumber(e.target.value)}
            type="text"
            placeholder="e.g., 123456"
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Your Kopo Kopo Till number for receiving payments
          </p>
        </div>

        <div className="border-t border-gray-200 py-4 mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Webhook Configuration (Optional)
          </h4>
          <div>
            <FormField
              name="webhook_secret"
              label="Webhook Secret"
              value={webhookSecret}
              onChange={(e: any) => setWebhookSecret(e.target.value)}
              type="text"
              placeholder="Enter webhook secret or leave blank to auto-generate"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Optional - if left blank, a secret will be auto-generated for secure callbacks
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {hasConfig ? "Update & Activate" : "Save & Activate"}
          </>
        )}
      </button>
    </div>
  );
}