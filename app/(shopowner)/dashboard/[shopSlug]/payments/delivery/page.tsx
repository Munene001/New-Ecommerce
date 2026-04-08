"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useShop } from "@/app/(shopowner)/shopownerContext";
import { useToast } from "@/context/toastContext";
import Button from "@/app/components/ui/button";
import DeliveryTiersList from "./components/deliveryTierList";
import AddTierForm from "./components/addTierForm";
import { useTiers } from "./hooks/useTiers";

export default function DeliveryFeePage() {
  const { shopSlug, shopId } = useShop();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  
  const {
    tiers,
    loading,
    errors,
    fetchTiers,
    addTier,
    updateTier,
    deleteTier,
  } = useTiers(shopId, showToast);

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative font-[Poppins]">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href={`/dashboard/${shopSlug}/payments`}
          className="inline-flex items-center text-gray-700 hover:text-black text-[16px] transition-colors font-[Poppins]"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 mr-2" />
          Back to Payments
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black font-[Poppins]">
          Delivery Fee Settings
        </h1>
        <p className="text-magenta-dark mt-2 font-[Poppins]">
          Shop: <span className="font-medium text-black">{shopSlug}</span>
        </p>
      </div>

      {/* Add Button */}
      <div className="mb-8">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="secondary"
          className="flex flex-row items-center justify-center gap-2"
        >
          <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
          {showAddForm ? "Cancel" : "Add Delivery Zone"}
        </Button>

        {/* Add Form */}
        {showAddForm && (
          <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <AddTierForm
              onAdd={async (tierName, fee) => {
                const success = await addTier(tierName, fee);
                if (success) {
                  setShowAddForm(false);
                }
              }}
              onCancel={() => setShowAddForm(false)}
              loading={loading}
            />
          </div>
        )}
      </div>

         {/* Instructions Box */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg border mb-5 border-blue-100">
        <div className="flex items-start gap-3">
          
          <div>
            <h4 className="font-medium text-black font-[Poppins]">How delivery fees work</h4>
            <p className="text-sm text-black mt-1 font-[Poppins]">
              Customers will see these zones at checkout. They select their area and the fee is added to their total.
              
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar - Matching product form style */}
      <div className="w-full mb-8">
        <div className="flex">
          <div className="md:w-[75%] w-full">
            <div className="flex justify-between mb-1">
              <button className="flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] text-black transition-colors font-[Poppins]">
                Delivery Zones
              </button>
            </div>
            <div className="relative w-full h-[10px] bg-gray-400">
              <div className="absolute h-[10px] bg-magenta-dark rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm md:p-6 px-3 py-6">
        {loading && !tiers.length ? (
          <div className="flex items-center justify-center py-12">
            <Icon
              icon="mdi:loading"
              className="animate-spin w-8 h-8 text-gray-600"
            />
            <span className="ml-3 text-gray-600 font-[Poppins]">
              Loading delivery zones...
            </span>
          </div>
        ) : (
          <DeliveryTiersList
            tiers={tiers}
            loading={loading}
            onUpdate={updateTier}
            onDelete={deleteTier}
            errors={errors}
          />
        )}
      </div>

   
    </div>
  );
}