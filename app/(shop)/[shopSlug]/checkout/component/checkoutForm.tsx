"use client";

import { useState, useEffect } from "react";
import { CreditCard, Wallet, Truck } from "lucide-react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import FormInput from "@/app/components/ui/formInput";

interface CheckoutFormProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    specialInstructions: string;
  };
  onChange: (field: string, value: string) => void;
  paymentMethod: "mpesa" | "cod";
  onPaymentMethodChange: (method: "mpesa" | "cod") => void;
  secondaryColor?: string;
  codEnabled?: boolean;
  mpesaEnabled?: boolean;
}

// Convert Kenyan number formats to +254 format
const convertToE164 = (phone: string): string | undefined => {
  if (!phone) return undefined;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('07') && cleaned.length === 10) {
    return `+254${cleaned.substring(1)}`;
  }
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return `+254${cleaned}`;
  }
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (phone.startsWith('+254')) return phone;
  
  return undefined;
};

export default function CheckoutForm({
  formData,
  onChange,
  paymentMethod,
  onPaymentMethodChange,
  secondaryColor,
  codEnabled = true,
  mpesaEnabled = true,
}: CheckoutFormProps) {
  const [phoneValue, setPhoneValue] = useState<string | undefined>(() => 
    convertToE164(formData.phone)
  );

  const handlePhoneChange = (value: string | undefined) => {
    setPhoneValue(value);
    onChange("phone", value || "");
  };

  useEffect(() => {
    const converted = convertToE164(formData.phone);
    if (converted !== phoneValue) {
      setPhoneValue(converted);
    }
  }, [formData.phone]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:p-6">
      {/* Payment Method - MOVED TO TOP */}
      <div>
        <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" style={{ color: secondaryColor }} />
          Payment Method
        </h3>
        
        <div className="space-y-3">
          {/* M-Pesa - Radio button style */}
          {mpesaEnabled && (
            <label 
              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === "mpesa" ? "border-opacity-100 bg-opacity-5" : "border-gray-200"
              }`}
              style={{ 
                borderColor: paymentMethod === "mpesa" ? secondaryColor : undefined,
                backgroundColor: paymentMethod === "mpesa" ? `${secondaryColor}10` : undefined
              }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mpesa"
                  checked={paymentMethod === "mpesa"}
                  onChange={() => onPaymentMethodChange("mpesa")}
                  className="w-4 h-4"
                  style={{ accentColor: secondaryColor }}
                />
                <Wallet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-black">M-Pesa</p>
                  <p className="text-xs text-gray-500">Pay via M-Pesa (STK Push or Paybill)</p>
                </div>
              </div>
              {paymentMethod === "mpesa" && (
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              )}
            </label>
          )}
          
          {/* Cash on Delivery */}
          {codEnabled && (
            <button
              type="button"
              onClick={() => onPaymentMethodChange("cod")}
              className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "cod" 
                  ? "border-opacity-100 bg-opacity-5" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ 
                borderColor: paymentMethod === "cod" ? secondaryColor : undefined,
                backgroundColor: paymentMethod === "cod" ? `${secondaryColor}10` : undefined
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === "cod" ? "border-" : "border-gray-300"
                }`}
                style={paymentMethod === "cod" ? { borderColor: secondaryColor } : {}}
                >
                  {paymentMethod === "cod" && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  )}
                </div>
                <CreditCard className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <p className="font-medium text-black">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when you receive your order</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-200 my-6"></div>
      
      {/* Delivery Information - NOW AFTER PAYMENT METHOD */}
      <h2 className="text-xl font-semibold text-black mb-5 flex items-center gap-2">
        Delivery Information
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={onChange}
            placeholder="John Doe"
            required
            icon="user"
          />
          
          <FormInput
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={onChange}
            type="email"
            placeholder="john@example.com"
            required
            icon="mail"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              international
              defaultCountry="KE"
              value={phoneValue}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              className="w-full text-black"
            />
            <style jsx global>{`
              .PhoneInput {
                display: flex;
                align-items: center;
                gap: 8px;
                border: 1px solid #d1d5db;
                border-radius: 0.5rem;
                padding: 0.75rem;
              }
              .PhoneInput:focus-within {
                outline: none;
                ring: 2px solid ${secondaryColor};
              }
              .PhoneInputInput {
                border: none;
                outline: none;
                flex: 1;
                background: transparent;
                font-size: 1rem;
              }
            `}</style>
          </div>
          
          <FormInput
            label="City / Town"
            name="city"
            value={formData.city}
            onChange={onChange}
            placeholder="Nairobi"
            required
            icon="mapPin"
          />
        </div>
        
        <FormInput
          label="Delivery Address"
          name="address"
          value={formData.address}
          onChange={onChange}
          type="textarea"
          placeholder="Street name, building, apartment number, landmark..."
          required
          icon="home"
          rows={3}
        />
        
        <FormInput
          label="Special Instructions (Optional)"
          name="specialInstructions"
          value={formData.specialInstructions}
          onChange={onChange}
          type="textarea"
          placeholder="Preferred color, packaging choice, etc"
          icon="message"
          rows={2}
        />
      </div>
      
      {/* Delivery Note */}
      <div className="mt-5 p-4 bg-yellow-50 rounded-lg border-l-4" style={{ borderLeftColor: secondaryColor }}>
        <div className="flex gap-3">
          <Truck className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-black">
            <strong>Delivery Fee:</strong> Not included in total. The seller will contact you after 
            order placement to confirm delivery fee based on your location and package size.
          </p>
        </div>
      </div>
    </div>
  );
}