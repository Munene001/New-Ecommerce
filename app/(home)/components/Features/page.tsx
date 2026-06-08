"use client";

import FeatureCard from "./components/unit";
import Image from "next/image";
import { Package, ShoppingCart, ClipboardList, TrendingUp } from "lucide-react";
import Button from "@/app/components/ui/button";
import Link from "next/link";

const FeaturesSection = () => {
  const features = [
    {
      icon: Package,
      title: "Add Products in Seconds",
      description:
        "Upload images, set prices, and go live — no technical skills needed.",
    },
    {
      icon: ShoppingCart,
      title: "Simple Checkout Experience",
      description:
        "Let customers browse, select, and order without back-and-forth messages.",
    },
    {
      icon: ClipboardList,
      title: "Manage Orders Easily",
      description:
        "Track orders, update status, and stay organized from one place.",
    },
    {
      icon: TrendingUp,
      title: "See What's Selling",
      description:
        "Get insights into your products and track your growth over time.",
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4 max-w-7xl mx-auto">
      {/* Section Header - White text for black background */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white font-[Poppins] mb-3">
          Everything you need to run your online store
        </h2>
        <p className="text-gray-200 text-base md:text-lg max-w-2xl mx-auto">
          From adding products to managing orders — all in one simple dashboard.
        </p>
      </div>

      {/* 2x2 Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-10">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      <div className="flex py-6 justify-center ">
        <Link
          href="/pricing"
          className="bg-three text-white flex items-center justify-center text-[20px] h-[50px] font-semibold rounded-lg p-4"
        >
          View Our Pricing
        </Link>
      </div>

      {/* Dashboard Screenshot */}
      <div className="rounded-2xl overflow-hidden   max-w-4xl mx-auto">
        <Image
          src="/images/home/cover3.webp"
          alt="Seller dashboard showing orders, products, and analytics"
          width={1200}
          height={800}
          className="w-full h-auto "
        />
      </div>
    </section>
  );
};

export default FeaturesSection;
