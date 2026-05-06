"use client";

import FeatureCard from "./components/featureCard";
import Reviews from "./components/review";
import { Store, MessageCircle, Repeat } from "lucide-react";

const TrustSection = () => {
  const features = [
   
    {
      icon: MessageCircle,
      title: "Sell Beyond WhatsApp",
      description:
        "Stop losing orders in chats. Give customers a proper place to view products and buy anytime.",
    },
    {
      icon: Repeat,
      title: "Keep Customers Coming Back",
      description:
        "Build a real brand — not just one-time sales. Your store becomes your online home.",
    },
     {
      icon: Store,
      title: "A Store Customers Actually Want to Browse",
      description:
        "Clean, fast, mobile-first design that makes people stay and explore — not bounce.",
    },
  ];

  const reviews = [
    {
      stars: 5,
      quote:
        "Started selling in minutes. First M-Pesa payment came through same day!",
      author: "James M., Nairobi",
    },
    {
      stars: 5,
      quote:
        "My sales increased 40% in first month. Customers love the M-Pesa option!",
      author: "Wanjiku K., Mombasa",
    },
  ];

  const trustBadges = [
    "No technical skills needed",
    "Works on any phone",
    "Launch in minutes",
  ];

  return (
    <section className="py-10 rounded-2xl  md:py-10 px-4 max-w-7xl mx-auto bg-white">
      {/* Section Title */}
      <div className="text-center mb-10 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-[Poppins] mb-3">
          Why Choose Us?
        </h2>
        <p className="text-black text-base md:text-lg max-w-2xl mx-auto font-medium">
          Everything you need to start and grow your online store in Kenya
        </p>
      </div>

      {/* 3 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>

      {/* Reviews Component */}
      

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 pt-6 border-t border-gray-100">
        {trustBadges.map((badge, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm text-black"
          >
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            <span>{badge}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustSection;