"use client";

import { useState } from "react";
import Button from "@/app/components/ui/button";
import FormField from "@/app/components/ui/formField";

interface AddTierFormProps {
  onAdd: (tierName: string, fee: number) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export default function AddTierForm({ onAdd, onCancel, loading }: AddTierFormProps) {
  const [tierName, setTierName] = useState("");
  const [fee, setFee] = useState("");
  const [errors, setErrors] = useState<{ tierName?: string; fee?: string }>({});

  const validate = () => {
    const newErrors: { tierName?: string; fee?: string } = {};
    
    if (!tierName.trim()) {
      newErrors.tierName = "Zone name is required";
    } else if (tierName.length > 100) {
      newErrors.tierName = "Zone name must be less than 100 characters";
    }
    
    if (!fee) {
      newErrors.fee = "Fee is required";
    } else if (isNaN(Number(fee)) || Number(fee) < 0) {
      newErrors.fee = "Fee must be a valid positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTierNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => {
    const value = typeof e === "string" || typeof e === "number" ? String(e) : e.target.value;
    setTierName(value);
    if (errors.tierName) setErrors({ ...errors, tierName: undefined });
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => {
    const value = typeof e === "string" || typeof e === "number" ? String(e) : e.target.value;
    setFee(value);
    if (errors.fee) setErrors({ ...errors, fee: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onAdd(tierName.trim(), Number(fee));
    setTierName("");
    setFee("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-black font-[Poppins]">Add New Delivery Zone</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          name="tierName"
          label="Zone Name"
          value={tierName}
          onChange={handleTierNameChange}
          error={errors.tierName}
          placeholder="e.g., CBD, Westlands, Kilimani"
          required
        />
        
        <FormField
          name="fee"
          label="Delivery Fee (KES)"
          type="number"
          value={fee}
          onChange={handleFeeChange}
          error={errors.fee}
          placeholder="e.g., 50, 100, 150"
          required
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          
          className="px-4 py-2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          variant="secondary"
          className="px-4 py-2"
        >
          {loading ? "Adding..." : "Add Zone"}
        </Button>
      </div>
    </form>
  );
}