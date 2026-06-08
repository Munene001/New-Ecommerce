"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ExternalLink,
  ShoppingCart,
  CreditCard,
  Palette,
  Share2,
  MonitorSmartphone,
  Monitor,
} from "lucide-react";
import { useState } from "react";
import ShareButton from "@/app/components/ui/shareButton";

export default function Dashboard() {
  const params = useParams();
  const shopSlug = params?.shopSlug as string;
  const [] = useState(false);

  // Guard against undefined shopSlug
  if (!shopSlug) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0FA965] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const guides = [
    {
      icon: ShoppingCart,
      title: "Add Your First Product",
      description:
        "Start by uploading your products with clear images, competitive prices, and detailed descriptions.",
      link: `/dashboard/${shopSlug}/products`,
      linkText: "Products →",
    },
    {
      icon: CreditCard,
      title: "Set Up Payment Methods",
      description:
        "Connect your M-Pesa Till or Buy Goods number to start accepting payments from customers securely.",
      link: `/dashboard/${shopSlug}/payments`,
      linkText: "Payments →",
    },
    {
      icon: Palette,
      title: "Customize Shop Appearance",
      description:
        "Make your shop unique by changing colors, uploading your logo, and setting up your brand style.",
      link: `/dashboard/${shopSlug}/appearance`,
      linkText: "Appearance",
    },
    {
      icon: Share2,
      title: "Share Your Shop & Start Selling",
      description:
        "Your shop is live! Share the link with customers, post on social media, and start making sales.",
      link: `/shop/${shopSlug}`,
      external: true,
      linkText: "Visit Your Shop →",
    },
  ];

  const quickLinks = [
    { label: "View All Products", href: `/dashboard/${shopSlug}/products` },
    { label: "Sales Reports", href: `/dashboard/${shopSlug}/sales` },
    { label: "Shop Settings", href: `/dashboard/${shopSlug}/settings` },
    { label: "Your Profile", href: `/dashboard/${shopSlug}/profile` },
  ];

  return (
    <div className="max-w-4xl mx-auto font-[Poppins] md:p-4 px-2 py-4">
      {/* Mobile Notice - visible only on mobile */}
      <div className="md:hidden bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <MonitorSmartphone className="w-9 h-9 text-amber-600  mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Mobile View</p>
          <p>
            For the best dashboard experience, please use a computer or laptop.
          </p>
        </div>
      </div>

      <div className="bg-black bg-[url('/assets/mazehex4.svg')] rounded-xl p-6 mb-8 relative">
        {/* Desktop Notice - visible only on desktop */}
        <div className="hidden md:flex absolute top-4 right-4 items-center gap-2 text-white/60 text-xs">
          <Monitor className="w-4 h-4" />
          <span>Best dashboard view on desktop</span>
        </div>

        <div className="text-center">
          <p className="text-white mb-4 font-medium text-2xl">
            Your shop is live and ready for customers:
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white/10 rounded-lg p-3 mb-3">
            <Link
              href={`https://${shopSlug}.paziatech.co.ke`}
              target="_blank"
              className="text-white hover:underline font-medium text-sm sm:text-base break-all"
            >
              {shopSlug}.paziatech.co.ke
            </Link>

            {/* Share Button */}
            <ShareButton
              title="My Shop"
              text="Check out my shop"
              url={`https://${shopSlug}.paziatech.co.ke`}
              variant="primary"
              showLabel
            />
          </div>

          <p className="text-white/80 text-sm">
            Share this link on social media, WhatsApp, or with your contacts
          </p>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {guides.map((guide, index) => {
          const Icon = guide.icon;
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon className="w-8 h-8 text-[#0FA965]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-gray-800 mb-4">{guide.description}</p>
                  <Link
                    href={guide.link}
                    target={guide.external ? "_blank" : undefined}
                    className="inline-flex items-center gap-2 text-[#0FA965] font-medium hover:underline"
                  >
                    {guide.linkText}
                    {guide.external && <ExternalLink className="w-4 h-4" />}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Other Sections You Might Need */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Other Sections
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="text-gray-700 hover:text-[#0FA965] hover:underline text-sm md:text-base"
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
