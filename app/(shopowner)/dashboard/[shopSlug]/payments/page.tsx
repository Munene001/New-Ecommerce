'use client';

import Link from "next/link";
import Button from "@/app/components/ui/button";
import {  CreditCard } from "lucide-react";
import PaymentsStatsCards from "./components/pstatsCard";
import { useShop } from "@/app/(shopowner)/shopownerContext";

export default function PaymentsPage() {
  // Get shop data from context
  const { shopSlug, shopId } = useShop();
  
  // Dummy data for structure - will be replaced with real API calls
  const dummyStats = {
    totalRevenue: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    monthlyRevenue: 0,
  };

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      {/* Stats Cards */}
      <PaymentsStatsCards
        totalRevenue={dummyStats.totalRevenue}
        pendingPayouts={dummyStats.pendingPayouts}
        completedPayouts={dummyStats.completedPayouts}
        monthlyRevenue={dummyStats.monthlyRevenue}
      />



      {/* 
      <div className="flex justify-end pt-6">
        <Link href={`/dashboard/${shopSlug}/payments/delivery`}>
          <Button
            className="flex flex-row gap-2 items-center justify-center"
            variant="secondary"
          >
            <Truck size={18} />
            <span>Delivery Fee Settings</span>
          </Button>
        </Link>
      </div> */}

        {/* Payment Configuration Button */}
      <div className="flex justify-end pt-6">
        <Link href={`/dashboard/${shopSlug}/payments/configuration`}>
          <Button
            className="flex flex-row gap-2 items-center justify-center"
            variant="secondary"
          >
            <CreditCard size={18} />
            <span>Payment Configuration</span>
          </Button>
        </Link>
      </div>

      {/* Future: Payout History Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Payout History</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500 border border-gray-200">
          <p>No payouts yet</p>
          <p className="text-sm mt-1">Payout history will appear here once you start selling</p>
        </div>
      </div>
    </div>
  );
}