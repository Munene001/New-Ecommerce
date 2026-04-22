// app/(dashboard)/[shopSlug]/analytics/components/AnalyticsClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import SimpleToast from "@/app/components/ui/simpleToast";
import AnalyticsCards from "./analyticsCards";
import AnalyticsCharts from "./analyticsCharts";
import { useAnalytics } from "../hooks/useAnalytics";

interface AnalyticsClientProps {
  shopId: number;
  shopSlug: string;
}

const sections = ["Sales", "Analytics"];

export default function AnalyticsClient({
  shopId,
  shopSlug,
}: AnalyticsClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const messageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, loading, error, refreshAnalytics } = useAnalytics(
    shopId.toString(),
  );

  // Determine active tab based on current path
  const activeIndex = pathname?.includes("/analytics") ? 1 : 0;

  const handleTabClick = (index: number) => {
    if (index === 0) {
      router.push(`/dashboard/${shopSlug}/sales`);
    } else {
      router.push(`/dashboard/${shopSlug}/analytics`);
    }
  };

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setMessage(null);
      }, 5000);

      if (messageRef.current) {
        messageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message]);

  // Show error message if fetch fails
  useEffect(() => {
    if (error) {
      setMessage({ type: "error", text: error });
    }
  }, [error]);

  return (
    <div className="md:p-4 px-2 py-6 font-[Poppins] relative">
      {/* Navigation Toggle Bar */}
      <div className="md:w-[75%] w-full mb-6">
        <div className="flex justify-between mb-1">
          {sections.map((section, index) => (
            <button
              key={section}
              onClick={() => handleTabClick(index)}
              className={`flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] transition-colors font-[Poppins] ${
                index === activeIndex
                  ? "text-black"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              style={{ width: `${100 / sections.length}%` }}
            >
              {section}
            </button>
          ))}
        </div>

        <div className="relative w-full h-2 bg-gray-200 rounded-full">
          <div
            className="absolute h-2 bg-magenta-dark rounded-full transition-all duration-300"
            style={{
              width: `${100 / sections.length}%`,
              left: `${(100 / sections.length) * activeIndex}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Analytics Cards */}
      <AnalyticsCards summary={data?.summary} loading={loading} />

      <div className="text-three font-bold mb-4">Analytics Dashboard</div>

      <SimpleToast message={message} onClose={() => setMessage(null)} />

      {/* Analytics Charts */}
      <AnalyticsCharts
        topProducts={data?.topProducts || []}
        bestSeller={data?.bestSeller || null}
        paymentSplit={data?.paymentSplit}
        hourlyDistribution={data?.hourlyDistribution || []}
        ordersByCity={data?.ordersByCity || []}
        loading={loading}
      />
    </div>
  );
}
