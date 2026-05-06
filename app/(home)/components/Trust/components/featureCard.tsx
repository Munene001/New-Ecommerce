"use client";

import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div 
      className="group rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-300 bg-white shadow-lg"
    >
      {/* Content */}
      <div className="relative z-10">
        {/* Icon Circle */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition">
            <Icon className="w-7 h-7 text-orange-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-black mb-3 font-[Poppins]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-black text-sm font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;