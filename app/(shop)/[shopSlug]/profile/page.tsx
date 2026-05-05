"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authcontext";
import { useShop } from "@/app/(shop)/ShopContext";
import { LogOut, Package, Clock, ChevronRight, ShoppingBag, User, Mail, Phone, Heart } from "lucide-react";
import Link from "next/link";
import PageBar from "@/app/components/layout/pageBar";

type Order = {
  order_id: number;
  order_number: string;
  shop_id: number;
  shop_slug: string;
  shop_name: string;
  subtotal: number;
  order_status: string;
  created_at: string;
};

// Overall Skeleton Loader
function ProfileSkeleton() {
  const { shop } = useShop();
  const secondaryColor = shop?.secondaryColor || "#fbbf24";
  
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 sticky top-0 z-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="w-20 h-9 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-3">
        <div className="rounded-2xl p-4 animate-pulse" style={{ background: `linear-gradient(135deg, ${secondaryColor}10 0%, ${secondaryColor}10 100%)` }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <div className="flex-1 h-11 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 h-11 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-100 p-5 animate-pulse" style={{ backgroundColor: `${secondaryColor}08` }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-28 bg-gray-200 rounded"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-5 w-36 bg-gray-200 rounded mb-2"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, profile, isAuthenticated, loading, logout } = useAuth();
  const { shop } = useShop();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const primaryColor = shop?.primaryColor || "#000000";
  const secondaryColor = shop?.secondaryColor || "#fbbf24";

  const tabs = ["Orders", "Wishlist"];

  // Handle redirects based on role and shop context
  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      if (profile.role === "shop_owner" && profile.shopSlug) {
        router.replace(`/dashboard/${profile.shopSlug}`);
        return;
      }
    }
  }, [isAuthenticated, profile, loading, router]);

  // Redirect non-authenticated users to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login?redirect=/profile");
    }
  }, [loading, isAuthenticated, router]);

  // Fetch orders - only for customers
  useEffect(() => {
    if (isAuthenticated && profile && profile.role === "customer") {
      fetchOrders();
    }
  }, [isAuthenticated, profile]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch("/api/shops/customers/orders");
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    const currentShopSlug = sessionStorage.getItem("currentShopSlug") || shop?.shopSlug || "my-awesome-shop-1770384778711";
    router.push(`/${currentShopSlug}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
      processing: { bg: "bg-blue-100", text: "text-blue-800", label: "Processing" },
      delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
    };
    const style = styles[status as keyof typeof styles] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  if (loading || (isAuthenticated && profile?.role === "customer" && isLoadingOrders && activeTab === 0)) {
    return <ProfileSkeleton />;
  }

  if (profile?.role === "shop_owner") {
    return null;
  }

  return (
    
    <div className="min-h-screen">
    <PageBar 
  breadcrumb="My Profile"
  itemCount={orders.length}
  itemName="Orders"
/>
     

    

      {/* Profile Card */}
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-3">
        <div 
          className="rounded-2xl p-5"
          style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}07 100%)` }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{profile?.fullName || "Customer"}</h2>
              <div className="flex flex-col gap-2 mt-1">
                <span className="flex items-center gap-1.5 text-sm text-gray-900 truncate">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-900">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{profile.phone}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="hidden lg:block text-right">
              <div className="text-xs text-gray-500">Logged in as</div>
              <div className="text-sm font-medium text-gray-800 truncate max-w-[150px]">{profile?.fullName?.split(' ')[0] || "User"}</div>
            </div>
          </div>
        </div>
      </div>
       <div className="border-b border-gray-100 ">
        <div className="max-w-3xl mx-auto px-4 py-1">
          <div className="flex items-center justify-between">
           <div></div>
           
            <button
              onClick={handleLogout}
              className="flex flex-row items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(index)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                activeTab === index
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {index === 0 ? (
                <ShoppingBag className="w-5 h-5" />
              ) : (
                <Heart className="w-5 h-5" />
              )}
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-8">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-base">No orders yet</p>
              <p className="text-sm text-gray-700 mt-1">When you place orders, they'll appear here</p>
              <Link
                href={`/${shop?.shopSlug}`}
                className="inline-block mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: secondaryColor }}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.order_id}
                  href={`/${order.shop_slug}/orders/${order.order_id}`}
                  className="block rounded-2xl border border-gray-100 p-5 active:scale-[0.99] transition-all duration-200 hover:shadow-md hover:border-gray-200"
                  style={{ backgroundColor: `${secondaryColor}08` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className=" text-[16px] font-semibold text-black px-2.5 py-1 rounded-md">
                          #{order.order_number}
                        </span>
                        {getStatusBadge(order.order_status)}
                      </div>
             
                      <div className="flex items-center gap-4 text-sm text-black">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{formatDate(order.created_at)}</span>
                        </span>
                        <span className="font-bold text-gray-900 text-base">
                          {formatCurrency(order.subtotal)}
                        </span>
                      </div>
                    </div>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ backgroundColor: `${secondaryColor}25` }}
                    >
                      <ChevronRight className="w-5 h-5" style={{ color: secondaryColor }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wishlist Tab Content (Placeholder) */}
      {activeTab === 1 && (
        <div className="max-w-3xl mx-auto px-4 pb-8">
          <div className="rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-base">Wishlist coming soon</p>
            <p className="text-sm text-gray-400 mt-1">Save your favorite items here</p>
          </div>
        </div>
      )}
    </div>
  );
}