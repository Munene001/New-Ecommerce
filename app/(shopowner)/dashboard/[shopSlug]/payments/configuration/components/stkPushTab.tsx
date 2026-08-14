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

interface StkPushConfig {
  type: 'paybill' | 'till' | null;
  shortcode: string | null;
  consumer_key: string | null;
  consumer_secret: string | null;
  passkey: string | null;
  business_number: string | null;
  till_number: string | null;
  account_number: string | null;
}

interface StkPushTabProps {
  config: StkPushConfig | null;
  isActive: boolean;
  onSave: (config: any) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  loading: boolean;
}

export default function StkPushTab({ config, isActive, onSave, onDelete, loading }: StkPushTabProps) {
  const [selectedType, setSelectedType] = useState<'paybill' | 'till'>('paybill');
  const [shortcode, setShortcode] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');

  // Helper to extract value regardless of whether FormField returns an Event or raw value
  const parseValue = (e: any) => (typeof e === 'string' ? e : e?.target?.value) ?? '';

  // Load existing config
  useEffect(() => {
    if (config && config.type) {
      setSelectedType(config.type);
      setShortcode(config.shortcode || '');
      setConsumerKey(config.consumer_key || '');
      setConsumerSecret(config.consumer_secret || '');
      setPasskey(config.passkey || '');
    }
  }, [config]);

  const hasConfig = config && config.type !== null;

  const getInstruction = () => {
    switch (selectedType) {
      case 'paybill':
        return {
          title: "Safaricom Paybill STK Push",
          instruction: "Customers will receive a prompt on their phone to complete payment. Enter your Safaricom Paybill details below.",
        };
      case 'till':
        return {
          title: "Safaricom Till STK Push",
          instruction: "Customers will receive a prompt on their phone to complete payment. Enter your Safaricom Till number details below.",
        };
      default:
        return { title: "", instruction: "" };
    }
  };

  const instruction = getInstruction();

  const getActiveMessage = () => {
    if (!config || !config.type) return null;
    
    const typeLabels = {
      paybill: 'Paybill',
      till: 'Till'
    };
    
    const typeLabel = typeLabels[config.type];
    return `${typeLabel} STK Push (${config.shortcode || 'N/A'})`;
  };

  const activeMessage = getActiveMessage();

  const handleSave = async () => {
    const cleanShortcode = shortcode.trim();
    const cleanKey = consumerKey.trim();
    const cleanSecret = consumerSecret.trim();
    const cleanPasskey = passkey.trim();

    if (!cleanShortcode) {
      alert('Shortcode is required');
      return;
    }
    if (!cleanKey || !cleanSecret || !cleanPasskey) {
      alert('Consumer Key, Consumer Secret, and Passkey are required');
      return;
    }

    const payload: any = {
      type: selectedType,
      shortcode: cleanShortcode,
      consumer_key: cleanKey,
      consumer_secret: cleanSecret,
      passkey: cleanPasskey,
    };

    await onSave(payload);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove your STK Push configuration?')) {
      await onDelete();
      setShortcode('');
      setConsumerKey('');
      setConsumerSecret('');
      setPasskey('');
    }
  };

  const businessTypeOptions = [
    { id: 'paybill', name: 'Paybill' },
    { id: 'till', name: 'Till Number' },
  ];

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
        <h3 className="text-lg font-semibold text-black">Safaricom STK Push Configuration</h3>
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

      <div className="mb-6">
        <FormField
          name="business_type"
          label="Select Business Type"
          value={selectedType}
          onChange={(e: any) => setSelectedType(parseValue(e) as 'paybill' | 'till')}
          type="select"
          options={businessTypeOptions}
          placeholder="Select business type"
          required
        />
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Smartphone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-black">
            <h4 className="font-medium text-sm">{instruction.title}</h4>
            <p className="text-sm mt-1">{instruction.instruction}</p>
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
            <p className="text-sm font-medium text-yellow-700">Safaricom Daraja API Credentials</p>
            <p className="text-xs text-yellow-600 mt-1">
              These credentials are obtained from the Safaricom Daraja Developer Portal after going live.
              You need a registered Paybill or Till number to get these.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <FormField
            name="shortcode"
            label="Shortcode"
            value={shortcode}
            onChange={(e: any) => setShortcode(parseValue(e))}
            type="text"
            placeholder="e.g., 174379"
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Your business shortcode (Paybill or Till number)
          </p>
        </div>

        <div className="border-t border-gray-200 py-4 mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Safaricom Daraja API Credentials
          </h4>
          <div className="flex flex-col gap-3">
            <FormField
              name="consumer_key"
              label="Consumer Key"
              value={consumerKey}
              onChange={(e: any) => setConsumerKey(parseValue(e))}
              type="text"
              placeholder="Enter Consumer Key from Daraja portal"
              required
            />
            
            <FormField
              name="consumer_secret"
              label="Consumer Secret"
              value={consumerSecret}
              onChange={(e: any) => setConsumerSecret(parseValue(e))}
              type="password"
              placeholder="Enter Consumer Secret from Daraja portal"
              required
            />
            
            <div>
              <label className="block md:text-sm text-[16px] font-medium text-black mb-2">
                Passkey <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                name="passkey"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter Passkey from Daraja portal"
                required
                className="w-full px-4 md:py-3 py-4 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black min-h-[52px] md:min-h-[44px]"
              />
            </div>
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