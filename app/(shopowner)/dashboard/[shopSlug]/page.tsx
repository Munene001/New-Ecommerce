"use client"

import Link from "next/link";
import { CheckCircle, ExternalLink, ShoppingCart, CreditCard, Palette, Share2 } from "lucide-react";

interface DashboardPageProps {
  params: {
    shopSlug: string;
  };
}

export default function Dashboard({ params }: DashboardPageProps) {
  const { shopSlug } = params;

  const guides = [
    {
      icon: ShoppingCart,
      title: "Add Your First Product",
      description: "Start by uploading your products with clear images, competitive prices, and detailed descriptions.",
      link: `/dashboard/${shopSlug}/products/add`,
      linkText: "Products →"
    },
    {
      icon: CreditCard,
      title: "Set Up Payment Methods",
      description: "Connect your M-Pesa Till or Buy Goods number to start accepting payments from customers securely.",
      link: `/dashboard/${shopSlug}/payments`,
      linkText: "Payments →"
    },
    {
      icon: Palette,
      title: "Customize Shop Appearance",
      description: "Make your shop unique by changing colors, uploading your logo, and setting up your brand style.",
      link: `/dashboard/${shopSlug}/appearance`,
      linkText: "Appearance"
    },
    {
      icon: Share2,
      title: "Share Your Shop & Start Selling",
      description: "Your shop is live! Share the link with customers, post on social media, and start making sales.",
      link: `/shop/${shopSlug}`,
      external: true,
      linkText: "Visit Your Shop →"
    },
  ];

  const quickLinks = [
    { label: "View All Products", href: `/dashboard/${shopSlug}/products` },
    { label: "Sales Reports", href: `/dashboard/${shopSlug}/sales` },
    { label: "Shop Settings", href: `/dashboard/${shopSlug}/settings` },
    { label: "Your Profile", href: `/dashboard/${shopSlug}/profile` },
  ];

  return (
    <div className="max-w-4xl mx-auto font-[Poppins] p-4">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0FA965]/10 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-[#0FA965]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Your Shop Dashboard
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Your shop <span className="font-semibold text-[#0FA965]">{shopSlug}</span> is ready. 
          Here's how to set everything up:
        </p>
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
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {guide.description}
                  </p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Sections</h3>
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

      {/* Shop URL Display */}
      <div className="bg-[#0FA965]/5 border border-[#0FA965]/20 rounded-xl p-6 text-center">
        <p className="text-gray-700 mb-3 font-medium">Your shop is live and ready for customers:</p>
        <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3">
          <span className="text-gray-800 font-medium">
            thamanitech.com/shop/{shopSlug}
          </span>
          <Link 
            href={`/shop/${shopSlug}`}
            target="_blank"
            className="text-[#0FA965] hover:underline ml-3 font-medium"
          >
            Preview Shop
          </Link>
        </div>
        <p className="text-gray-500 text-sm mt-3">
          Share this link on social media, WhatsApp, or with your contacts
        </p>
      </div>
    </div>
  );
}