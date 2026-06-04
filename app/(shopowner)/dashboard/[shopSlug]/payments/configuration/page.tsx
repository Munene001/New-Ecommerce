"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { usePaymentConfig } from "./hooks/usePaymentConfig";
import CodModule from "./components/codModule";
import DirectMpesaTab from "./components/directMpesaTab";
import StkPushTab from "./components/stkPushTab";
import InstructionsList from "@/app/components/ui/instructionList";

export default function PaymentConfigurationPage() {
  const { shopSlug } = useShop();
  const [activeTab, setActiveTab] = useState(0);
  const {
    settings,
    loading,
    toggleCod,
    saveDirectMpesa,
    deleteDirectMpesa,
  } = usePaymentConfig();

  const tabs = ["Manual M-Pesa", "STK Push"];

  // Dynamic instructions based on current state
  const getInstructionItems = () => {
    if (!settings.has_direct_mpesa && !settings.has_stk_push) {
      return [
        { text: "Cash on Delivery is currently active" },
        { text: "Configure M-Pesa below to offer mobile payments" },
        { text: "Choose Manual M-Pesa or STK Push as your preferred method" },
         { text: "Stk Push is the recommended faster and modern option but it is complex to set up" },
        { text: "You cannot disable COD until M-Pesa is configured" }
      ];
    }
    
    if (settings.active_payment_type === 'direct_mpesa') {
      return [
        { text: "✓ manual M-Pesa is currently ACTIVE" },
        { text: "Customers will see your M-Pesa details at checkout" },
        { text: "You can now disable COD if you want only mobile payments" },
        { text: "Switch to STK Push tab to configure it (coming soon)" }
      ];
    }
    
    if (settings.active_payment_type === 'stk_push') {
      return [
        { text: "✓ STK Push is currently ACTIVE" },
        { text: "Customers will receive a prompt on their phone" },
        { text: "No manual entry required by customers" }
      ];
    }
    
    return [
      { text: "Configure Manual M-Pesa to start accepting mobile payments" },
      { text: "Your configuration will become active once saved" }
    ];
  };

  const instructionVariant = () => {
    if (!settings.has_direct_mpesa && !settings.has_stk_push) return "blue";
    if (settings.active_payment_type === 'direct_mpesa') return "green";
    if (settings.active_payment_type === 'stk_push') return "green";
    return "blue";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-[Poppins]">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${shopSlug}/payments`}
          className="inline-flex items-center text-gray-700 hover:text-black text-[16px] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Payments
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black">Payment Configuration</h1>
        <p className="text-gray-800 mt-2">
          Configure how you want to receive payments from customers
        </p>
      </div>

       {/* Instructions Box */}
      <div className="mb-6">
        <InstructionsList
          items={getInstructionItems()}
          variant="green"
        />
      </div>

      {/* COD Module */}
      <CodModule
        codEnabled={settings.cod_enabled}
        canDisableCod={settings.can_disable_cod}
        onToggle={toggleCod}
        loading={loading}
      />

     

      {/* Tab Bar */}
      <div className="w-full mb-8">
        <div className="flex">
          <div className="md:w-[75%] w-full">
            <div className="flex justify-between mb-1">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(index)}
                  className={`flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] transition-colors font-[Poppins] ${
                    index === activeTab
                      ? "text-black"
                      : "text-gray-600 hover:text-gray-600"
                  }`}
                  style={{ width: `${100 / tabs.length}%` }}
                >
                  {tab}
                  {settings.active_payment_type === 'direct_mpesa' && index === 0 && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                  {settings.active_payment_type === 'stk_push' && index === 1 && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="relative w-full h-[10px] bg-gray-200">
              <div
                className="absolute h-[10px] bg-three transition-all duration-300"
                style={{
                  width: `${100 / tabs.length}%`,
                  left: `${(100 / tabs.length) * activeTab}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {activeTab === 0 ? (
          <DirectMpesaTab
            config={settings.direct_mpesa}
            isActive={settings.active_payment_type === 'direct_mpesa'}
            onSave={saveDirectMpesa}
            onDelete={deleteDirectMpesa}
            loading={loading}
          />
        ) : (
          <StkPushTab
            isActive={settings.active_payment_type === 'stk_push'}
          />
        )}
      </div>
    </div>
  );
}