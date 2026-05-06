"use client";

import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group relative rounded-2xl p-6 bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg transition-all duration-300 hover:bg-gray-900">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex gap-5 items-start">
        {/* Icon Container */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300">
            <Icon className="w-7 h-7 text-orange-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-100 text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;