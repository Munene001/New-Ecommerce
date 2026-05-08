"use client";

import Button from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  Store, 
  Package, 
  CreditCard,
  Share2, 
  ShoppingBag, 
  ArrowRight,
  CheckCircle 
} from "lucide-react";
import { useState } from "react";

const Phase2 = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Store,
      title: "Create Your Store",
      instructions: [
        "Fill in your contact information(used for your contact section)",
        "Choose your store type: Retail, Pharmacy, Bookshop, or others",
        "Your store is created instantly — no waiting",
      ],
      note: "Contact details = store email & phone for orders",
    },
    {
      icon: Package,
      title: "Add Your Products",
      instructions: [
        "Go to Products → Add New Product",
        "Upload images, set price, write description",
        "Click 'Publish' — product is live immediately",
      ],
      note: "Add as many products as you want",
    },
    {
      icon: CreditCard,
      title: "Configure Payments",
      instructions: [
        "Go to Settings → Payment Configuration",
        "Connect your M-Pesa Paybill/Buygoods number",
        "Activate — customers can pay instantly",
      ],
      note: "Cash on delivery is the default payment if mpesa is not set up",
    },
    {
      icon: Share2,
      title: "Share Your Store",
      instructions: [
        "Copy your store link from Dashboard",
        "Share on WhatsApp, Instagram, or Telegram",
        "You can also share individual product links",
      ],
      note: "Customers can browse and buy without logging in",
    },
    {
      icon: ShoppingBag,
      title: "Receive Orders",
      instructions: [
        "Get instant Email/App notification when order arrives",
        "Go to Orders → Manage to view and update status",
        "Track all orders from one dashboard",
      ],
      note: "No more lost WhatsApp messages",
    },
  ];

  return (
    <section className="py-10 md:py-11 rounded-2xl px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-black font-[Poppins] mb-2">
            Your 5-Step Setup Guide
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Simple, fast, and built for Kenyan businesses.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 md:space-y-4 mb-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex gap-3 md:gap-4"
              onMouseEnter={() => setActiveStep(index)}
            >
              {/* Step Icon */}
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeStep === index
                      ? "bg-orange-500 shadow-md"
                      : "bg-gray-200 group-hover:bg-orange-400"
                  }`}
                >
                  {activeStep === index ? (
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  ) : (
                    <step.icon className="w-4 h-4 md:w-5 md:h-5 text-black" strokeWidth={1.5} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-3 md:pb-4">
                <div
                  className={`rounded-lg p-3 md:p-4 transition-all duration-300 ${
                    activeStep === index
                      ? " shadow-md border-l-2 border-orange-500"
                      : " border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {/* Step Number and Title */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        activeStep === index
                          ? "bg-orange-200 text-orange-800"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      Step {index + 1}
                    </span>
                    <h3 className="text-sm md:text-base font-semibold text-black">
                      {step.title}
                    </h3>
                  </div>

                  {/* Instructions List */}
                  <ul className="space-y-1 mb-1">
                    {step.instructions.map((instruction, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight
                          className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                            activeStep === index ? "text-orange-500" : "text-gray-500"
                          }`}
                        />
                        <span className="text-black text-sm md:text-sm">
                          {instruction}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Note */}
                  {step.note && (
                    <div className="text-xs text-gray-700 mt-2 pt-1 border-t border-gray-200">
                      💡 {step.note}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA at Bottom */}
        <div className="text-center pt-4 border-t border-gray-200">
          <Button
            onClick={() => router.push("auth/shopowner/signup")}
            variant="secondary"
            className="font-semibold text-base md:text-lg px-6 py-2.5 gap-2 group bg-orange-500 hover:bg-orange-600 text-white"
          >
            <span>Start Your Store Now</span>
            
          </Button>
         
        </div>
      </div>
    </section>
  );
};

export default Phase2;