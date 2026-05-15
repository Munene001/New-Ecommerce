"use client";

import Link from "next/link";
import {
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Settings,
} from "lucide-react";

export default function AdminViewPage() {
  return (
    <div className="max-w-4xl mx-auto font-[Poppins] md:p-4 px-2 py-4">
      {/* Welcome Section */}
      <div className="bg-black bg-[url('/assets/mazehex4.svg')] rounded-xl p-6 mb-8">
        <div className="text-center">
          <p className="text-white mb-2 font-medium text-2xl">
            Welcome, Super Admin
          </p>
          
        </div>
      </div>

      

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Users className="w-8 h-8 text-[#0FA965]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Users
              </h3>
              <p className="text-gray-800 mb-4">
                View, edit, or remove users. Manage customer and shop owner accounts.
              </p>
              <Link
                href="/admin/view/users"
                className="inline-flex items-center gap-2 text-[#0FA965] font-medium hover:underline"
              >
                Manage Users →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Store className="w-8 h-8 text-[#0FA965]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Manage Shops
              </h3>
              <p className="text-gray-800 mb-4">
                View all shops, approve new shops, and manage shop settings.
              </p>
              <Link
                href="/admin/view/shops"
                className="inline-flex items-center gap-2 text-[#0FA965] font-medium hover:underline"
              >
                Manage Shops →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Admin Quick Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/admin/view/analytics"
            className="flex items-center gap-2 text-gray-700 hover:text-[#0FA965] hover:underline text-sm md:text-base"
          >
            <TrendingUp className="w-4 h-4" />
            Analytics →
          </Link>
          <Link
            href="/admin/view/settings"
            className="flex items-center gap-2 text-gray-700 hover:text-[#0FA965] hover:underline text-sm md:text-base"
          >
            <Settings className="w-4 h-4" />
            Platform Settings →
          </Link>
          <Link
            href="/admin/view/orders"
            className="flex items-center gap-2 text-gray-700 hover:text-[#0FA965] hover:underline text-sm md:text-base"
          >
            <ShoppingCart className="w-4 h-4" />
            All Orders →
          </Link>
        </div>
      </div>
    </div>
  );
}