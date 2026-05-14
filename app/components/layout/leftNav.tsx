"use client";

import NavLink from "../ui/navLink";
import { LayoutDashboard, Package, ShoppingCart, HandCoins, ChartNoAxesCombined, SunMoon, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";

interface BaseLeftMenuProps {
  onMenuClicked: (bool: boolean) => void;
  shopSlug?: string;
  unviewedCount: number; 
}

export default function BaseLeftMenu({ onMenuClicked, shopSlug, unviewedCount }: BaseLeftMenuProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const navItems = [
    {
      href: `/dashboard/${shopSlug}/`,
      title: "Dashboard",
      icon: LayoutDashboard
    },
    {
      title: "Products",
      icon: Package,
      href: `/dashboard/${shopSlug}/products`,
    },
    {
      title: "Orders",
      icon: ShoppingCart,
      href: `/dashboard/${shopSlug}/orders`,
    },
    {
      href: `/dashboard/${shopSlug}/payments`,
      title: "Payments",
      icon: HandCoins
    },
    {
      href: `/dashboard/${shopSlug}/sales`,
      title: "Sales and Analytics",
      icon: ChartNoAxesCombined
    },
    {
      href: `/dashboard/${shopSlug}/appearance`,
      title: "Appearance",
      icon: SunMoon
    },
    {
      href: `/dashboard/${shopSlug}/settings`,
      title: "Settings",
      icon: Settings
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="space-y-3">
      <div>
        {navItems.map((item) => {
          // Check if this is the Orders item
          const isOrders = item.title === "Orders";
          
          return (
            <div key={item.href} className="relative">
              <NavLink
                href={item.href}
                title={item.title}
                icon={item.icon}
                className=""
                onMenuClicked={() => onMenuClicked(false)}
              />
              {isOrders && unviewedCount > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-magenta text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unviewedCount}
                </div>
              )}
            </div>
          );
        })}

        <div>
          <div className="w-full">
            <div className="flex items-center justify-between py-[15px] px-6 rounded-md transition-colors gap-3 hover:bg-[#1E3134]">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="flex items-center gap-3 flex-1"
              >
                <LogOut size={16} className="hover:text-tunga-accent" />
                <span className="header-font">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}