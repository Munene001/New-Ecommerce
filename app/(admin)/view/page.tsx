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
          <p className="text-white/80 text-sm">
            You have full access to manage all shops, users, and platform settings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Shops</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
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