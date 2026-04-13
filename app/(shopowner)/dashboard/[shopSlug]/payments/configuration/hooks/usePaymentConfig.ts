"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/context/toastContext";
import { useShop } from "@/app/(shopowner)/shopownerContext";

interface DirectMpesaConfig {
  type: 'paybill' | 'till' | 'pochi' | 'send_money' | null;
  business_number: string | null;
  account_number: string | null;
  till_number: string | null;
  phone_number: string | null;
}

interface PaymentSettings {
  cod_enabled: boolean;
  has_direct_mpesa: boolean;
  has_stk_push: boolean;
  has_any_mpesa_config: boolean;
  can_disable_cod: boolean;
  active_payment_type: 'direct_mpesa' | 'stk_push' | null;
  direct_mpesa: DirectMpesaConfig | null;
}

export function usePaymentConfig() {
  const { shopId } = useShop();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    cod_enabled: true,
    has_direct_mpesa: false,
    has_stk_push: false,
    has_any_mpesa_config: false,
    can_disable_cod: false,
    active_payment_type: null,
    direct_mpesa: null,
  });

  const fetchSettings = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/shopowner/payments?shop_id=${shopId}`);
      const data = await res.json();
      
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggleCod = async (enabled: boolean) => {
    if (!enabled && !settings.can_disable_cod) {
      showToast("Cannot disable COD. Please configure an Mpesa option first", "error");
      return false;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/shopowner/payments?shop_id=${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cod_enabled: enabled }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSettings(prev => ({ ...prev, cod_enabled: enabled }));
        showToast(`COD ${enabled ? 'enabled' : 'disabled'} successfully`, "success");
        await fetchSettings();
        return true;
      } else {
        showToast(data.error || "Failed to update COD", "error");
        return false;
      }
    } catch (error) {
      showToast("Network error", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveDirectMpesa = async (config: {
    type: string;
    business_number?: string;
    account_number?: string;
    till_number?: string;
    phone_number?: string;
  }) => {
    setLoading(true);
    try {
      // ✅ Fixed: Remove /direct-mpesa from URL
      const res = await fetch(`/api/shopowner/payments?shop_id=${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast("Direct M-Pesa configuration saved successfully", "success");
        await fetchSettings();
        return true;
      } else {
        showToast(data.error || "Failed to save configuration", "error");
        return false;
      }
    } catch (error) {
      showToast("Network error", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteDirectMpesa = async () => {
    setLoading(true);
    try {
      // ✅ Fixed: Remove /direct-mpesa from URL and add action body
      const res = await fetch(`/api/shopowner/payments?shop_id=${shopId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'direct-mpesa' }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast("Direct M-Pesa configuration removed", "success");
        await fetchSettings();
        return true;
      } else {
        showToast(data.error || "Failed to remove configuration", "error");
        return false;
      }
    } catch (error) {
      showToast("Network error", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    toggleCod,
    saveDirectMpesa,
    deleteDirectMpesa,
    refresh: fetchSettings,
  };
}