"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";
import FormField from "@/app/components/ui/formField";

interface DeliveryTier {
  tier_id: number;
  tier_name: string;
  fee: number;
}

interface DeliveryTiersListProps {
  tiers: DeliveryTier[];
  loading: boolean;
  onUpdate: (tierId: number, tierName: string, fee: number) => Promise<boolean>;
  onDelete: (tierId: number) => Promise<boolean>;
  errors: Record<number, string>;
}

export default function DeliveryTiersList({
  tiers,
  loading,
  onUpdate,
  onDelete,
  errors,
}: DeliveryTiersListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editFee, setEditFee] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const startEdit = (tier: DeliveryTier) => {
    setEditingId(tier.tier_id);
    setEditName(tier.tier_name);
    setEditFee(tier.fee.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditFee("");
  };

  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => {
    const value = typeof e === "string" || typeof e === "number" ? String(e) : e.target.value;
    setEditName(value);
  };

  const handleEditFeeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => {
    const value = typeof e === "string" || typeof e === "number" ? String(e) : e.target.value;
    setEditFee(value);
  };

  const handleUpdate = async (tierId: number) => {
    const success = await onUpdate(tierId, editName, Number(editFee));
    if (success) {
      cancelEdit();
    }
  };

  const handleDelete = async (tierId: number) => {
    const success = await onDelete(tierId);
    if (success) {
      setDeleteConfirm(null);
    }
  };

  if (tiers.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon icon="mdi:truck-delivery-outline" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-[Poppins]">No delivery zones set up yet</p>
        <p className="text-sm text-gray-400 mt-1 font-[Poppins]">
          Click "Add Delivery Zone" to create your first zone
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-gray-200">
          <tr>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 font-[Poppins]">Zone Name</th>
            <th className="text-left py-4 px-4 font-semibold text-gray-700 font-[Poppins]">Delivery Fee (KES)</th>
            <th className="text-right py-4 px-4 font-semibold text-gray-700 font-[Poppins]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.tier_id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">
                {editingId === tier.tier_id ? (
                  <FormField
                    name="editName"
                    value={editName}
                    onChange={handleEditNameChange}
                    error={errors[tier.tier_id]?.includes("name") ? errors[tier.tier_id] : undefined}
                    placeholder="Zone name"
                  />
                ) : (
                  <span className="font-medium font-[Poppins]">{tier.tier_name}</span>
                )}
              </td>
              <td className="py-4 px-4">
                {editingId === tier.tier_id ? (
                  <FormField
                    name="editFee"
                    type="number"
                    value={editFee}
                    onChange={handleEditFeeChange}
                    error={errors[tier.tier_id]?.includes("fee") ? errors[tier.tier_id] : undefined}
                    placeholder="Fee"
                  />
                ) : (
                  <span className="font-[Poppins]">KES {tier.fee.toLocaleString()}</span>
                )}
              </td>
              <td className="py-4 px-4 text-right">
                {editingId === tier.tier_id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleUpdate(tier.tier_id)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[Poppins]"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors font-[Poppins]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : deleteConfirm === tier.tier_id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleDelete(tier.tier_id)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[Poppins]"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors font-[Poppins]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(tier)}
                      className="px-3 py-1.5 bg-magenta-dark text-white text-sm font-medium rounded-lg hover:bg-magenta transition-colors font-[Poppins]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(tier.tier_id)}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors font-[Poppins]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}