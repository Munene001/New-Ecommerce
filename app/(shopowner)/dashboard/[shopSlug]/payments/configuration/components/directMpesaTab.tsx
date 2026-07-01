"use client";

import { 
  CheckCircle, 
  Trash2, 
  Building2, 
  QrCode, 
  Store, 
  Phone, 
  Info, 
  Save,
  Loader2 
} from "lucide-react";
import { useState, useEffect } from "react";
import FormField from "@/app/components/ui/formField";

interface DirectMpesaConfig {
  type: 'paybill' | 'till' | 'pochi' | 'send_money' | null;
  business_number: string | null;
  account_number: string | null;
  till_number: string | null;
  phone_number: string | null;
}

interface DirectMpesaTabProps {
  config: DirectMpesaConfig | null;
  isActive: boolean;
  onSave: (config: any) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  loading: boolean;
}

export default function DirectMpesaTab({ config, isActive, onSave, onDelete, loading }: DirectMpesaTabProps) {
  const [selectedType, setSelectedType] = useState<'paybill' | 'till' | 'pochi' | 'send_money'>('paybill');
  const [businessNumber, setBusinessNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [tillNumber, setTillNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (config && config.type) {
      setSelectedType(config.type);
      setBusinessNumber(config.business_number || '');
      setAccountNumber(config.account_number || '');
      setTillNumber(config.till_number || '');
      setPhoneNumber(config.phone_number || '');
    }
  }, [config]);

  const hasConfig = config && config.type !== null;

  const getInstruction = () => {
    switch (selectedType) {
      case 'paybill':
        return {
          title: "Paybill Configuration",
          instruction: "Enter your Paybill business number and account number. Customers will use these to send money.",
        };
      case 'till':
        return {
          title: "Till Number Configuration",
          instruction: "Enter your Lipa Na M-Pesa Till number. Customers will use this to pay.",
        };
      case 'pochi':
        return {
          title: "Pochi La Biashara Configuration",
          instruction: "Enter your Pochi La Biashara Till number. This is for business transactions.",
        };
      case 'send_money':
        return {
          title: "Send Money Configuration",
          instruction: "Enter the phone number where customers should send money. Format: 0712345678",
        };
      default:
        return { title: "", instruction: "" };
    }
  };

  const instruction = getInstruction();

  // Get formatted active message
  const getActiveMessage = () => {
    if (!config || !config.type) return null;
    
    const typeLabels = {
      paybill: 'Paybill',
      till: 'Till Number',
      pochi: 'Pochi La Biashara',
      send_money: 'Send Money'
    };
    
    const typeLabel = typeLabels[config.type];
    let details = '';
    
    switch (config.type) {
      case 'paybill':
        details = `Business Number: ${config.business_number || 'N/A'}${config.account_number ? ` | Account: ${config.account_number}` : ''}`;
        break;
      case 'till':
      case 'pochi':
        details = `Till Number: ${config.till_number || 'N/A'}`;
        break;
      case 'send_money':
        details = `Phone: ${config.phone_number || 'N/A'}`;
        break;
    }
    
    return `${typeLabel} (${details})`;
  };

  const activeMessage = getActiveMessage();

  const handleSave = async () => {
    const payload: any = { type: selectedType };
    
    switch (selectedType) {
      case 'paybill':
        if (!businessNumber) return;
        payload.business_number = businessNumber;
        payload.account_number = accountNumber;
        break;
      case 'till':
      case 'pochi':
        if (!tillNumber) return;
        payload.till_number = tillNumber;
        break;
      case 'send_money':
        if (!phoneNumber) return;
        payload.phone_number = phoneNumber;
        break;
    }
    
    await onSave(payload);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove your M-Pesa configuration?')) {
      await onDelete();
      setBusinessNumber('');
      setAccountNumber('');
      setTillNumber('');
      setPhoneNumber('');
    }
  };

  const typeButtons = [
    { id: 'paybill' as const, label: 'Paybill', icon: Building2 },
    { id: 'till' as const, label: 'Till Number', icon: QrCode },
    { id: 'pochi' as const, label: 'Pochi La Biashara', icon: Store },
    { id: 'send_money' as const, label: 'Send Money', icon: Phone },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {isActive && activeMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium">
            Active: {activeMessage}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Direct M-Pesa Configuration</h3>
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

      {/* Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select M-Pesa Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {typeButtons.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedType === type.id
                    ? "border-three bg-orange-50 text-three"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="text-black">
            <h4 className="font-medium text-sm">{instruction.title}</h4>
            <p className="text-sm mt-1">{instruction.instruction}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Fields */}
      <div className="space-y-4 mb-6">
        {selectedType === 'paybill' && (
          <>
            <FormField
              name="business_number"
              label="Business Number"
              value={businessNumber}
              onChange={(e) => setBusinessNumber((e as React.ChangeEvent<HTMLInputElement>).target.value)}
              type="text"
              placeholder="e.g., 123456"
              required
            />
            <FormField
              name="account_number"
              label="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber((e as React.ChangeEvent<HTMLInputElement>).target.value)}
              type="text"
              placeholder="e.g., SHOP001 or Order Number"
            />
          </>
        )}

        {(selectedType === 'till' || selectedType === 'pochi') && (
          <FormField
            name="till_number"
            label="Till Number"
            value={tillNumber}
            onChange={(e) => setTillNumber((e as React.ChangeEvent<HTMLInputElement>).target.value)}
            type="text"
            placeholder="e.g., 123456"
            required
          />
        )}

        {selectedType === 'send_money' && (
          <FormField
            name="phone_number"
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber((e as React.ChangeEvent<HTMLInputElement>).target.value)}
            type="tel"
            placeholder="e.g., 0712345678"
            required
          />
        )}
      </div>

      {/* Save Button */}
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