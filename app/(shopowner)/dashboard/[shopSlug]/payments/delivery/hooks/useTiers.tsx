import { useState, useEffect, useCallback } from "react";

interface DeliveryTier {
  tier_id: number;
  tier_name: string;
  fee: number;
}

export function useTiers(shopId: number, showToast: (message: string, type: "success" | "error") => void) {
  const [tiers, setTiers] = useState<DeliveryTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const fetchTiers = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/shopowner/payments/delivery?shop_id=${shopId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTiers(data.data);
      } else {
        showToast(data.error || "Failed to fetch delivery tiers", "error");
      }
    } catch (error) {
      showToast("Failed to fetch delivery tiers", "error");
    } finally {
      setLoading(false);
    }
  }, [shopId, showToast]);

  const addTier = async (tierName: string, fee: number) => {
    setLoading(true);
    try {
      const response = await fetch("/api/shopowner/payments/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_id: shopId, tier_name: tierName, fee }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast("Delivery zone added successfully", "success");
        await fetchTiers();
        return true;
      } else {
        showToast(data.error || "Failed to add delivery zone", "error");
        return false;
      }
    } catch (error) {
      showToast("Failed to add delivery zone", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (tierId: number, tierName: string, fee: number) => {
    setLoading(true);
    setErrors((prev) => ({ ...prev, [tierId]: "" }));
    
    try {
      const response = await fetch(`/api/shopowner/payments/delivery/${tierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier_name: tierName, fee }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast("Delivery zone updated successfully", "success");
        await fetchTiers();
        return true;
      } else {
        const errorMsg = data.error || "Failed to update delivery zone";
        setErrors((prev) => ({ ...prev, [tierId]: errorMsg }));
        showToast(errorMsg, "error");
        return false;
      }
    } catch (error) {
      const errorMsg = "Failed to update delivery zone";
      setErrors((prev) => ({ ...prev, [tierId]: errorMsg }));
      showToast(errorMsg, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTier = async (tierId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shopowner/payments/delivery/${tierId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToast("Delivery zone deleted successfully", "success");
        await fetchTiers();
        return true;
      } else {
        showToast(data.error || "Failed to delete delivery zone", "error");
        return false;
      }
    } catch (error) {
      showToast("Failed to delete delivery zone", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  return {
    tiers,
    loading,
    errors,
    fetchTiers,
    addTier,
    updateTier,
    deleteTier,
  };
}