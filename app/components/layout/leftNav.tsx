"use client";

import NavLink from "../ui/navLink";
import { LayoutDashboard, Package, ShoppingCart, HandCoins, ChartNoAxesCombined, SunMoon, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/authcontext";
import { useRouter } from "next/navigation";

interface NavItem {
  href: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  showBadge?: boolean;
}

interface BaseLeftMenuProps {
  onMenuClicked: (bool: boolean) => void;
  shopSlug?: string;
  unviewedCount: number;
  navItems?: NavItem[]; // Optional custom nav items
}

// Default shop owner nav items
const getDefaultNavItems = (shopSlug?: string): NavItem[] => [
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
    showBadge: true,
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

export default function BaseLeftMenu({ onMenuClicked, shopSlug, unviewedCount, navItems: customNavItems }: BaseLeftMenuProps) {
  const { logout } = useAuth();
  const router = useRouter();

  // Use custom navItems if provided, otherwise fall back to default shop items
  const navItems = customNavItems || getDefaultNavItems(shopSlug);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="space-y-3">
      <div>
        {navItems.map((item) => {
          const showBadge = item.showBadge && unviewedCount > 0;
          
          return (
            <div key={item.href} className="relative">
              <NavLink
                href={item.href}
                title={item.title}
                icon={item.icon}
                className=""
                onMenuClicked={() => onMenuClicked(false)}
              />
              {showBadge && (
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