// File: src/components/FAQSection.tsx
"use client";

import { useState } from "react";
import {
  ChevronDown,
  Store,
  Users,
  Truck,
  ShoppingBag,
  MessageCircle,
  Wallet,
  Layout,
  CreditCard,
  Gift,
  HelpCircle,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question:
      "What makes Pazia Tech different from other e-commerce platforms?",
    answer:
      "Unlike marketplaces where your products compete alongside others, Pazia Tech gives you your own dedicated store. No competitor ads, no mixed products - just your brand, your customers, your sales. You own everything.",
    icon: <Store className="w-5 h-5 text-orange-500" />,
  },
  {
    question: "Can I use Pazia Tech for multiple businesses?",
    answer:
      "Yes! Manage multiple stores under one account. Each store has its own branding, products, and customers. Perfect for running different business ventures from a single dashboard.",
    icon: <Users className="w-5 h-5 text-orange-500" />,
  },

  {
    question:
      "Do my products appear mixed with products from other businesses?",
    answer:
      "Never. Pazia Tech gives you a standalone store. Your products appear only on YOUR site. No cross-selling, no competitor products, no marketplace noise - just your business.",
    icon: <ShoppingBag className="w-5 h-5 text-orange-500" />,
  },
  {
    question: "Who handles delivery - Pazia Tech or the business owner?",
    answer:
      "You do! You organize delivery directly with your customers. Pazia Tech focuses on providing you with the best store platform. You're free to use any delivery method that works for your business.",
    icon: <Truck className="w-5 h-5 text-orange-500" />,
  },
  {
    question: "Can I withdraw my earnings immediately?",
    answer:
      "Yes! Money goes directly from your customer to YOU. Pazia Tech never holds your funds. No intermediary, no waiting periods, no withdrawal limits. Your money, your control.",
    icon: <Wallet className="w-5 h-5 text-orange-500" />,
  },
 {
  question: "What is your pricing model? Do you have a free trial?",
  answer:
    "We offer a 30-day free trial so you can experience Pazia Tech risk‑free. After your trial, our Basic plan is KES 999/month and Pro plan is KES 2,499/month. Zero commissions – you keep 100% of your sales. [View pricing →](/pricing)",
  icon: <Gift className="w-5 h-5 text-orange-500" />,
},
  {
    question: "What payment methods do you support?",
    answer:
      "Currently we support M-Pesa for seamless payments in Kenya. More payment methods (Card, PayPal, Bank Transfers) are coming soon. We're committed to making payments easier for you and your customers.",
    icon: <CreditCard className="w-5 h-5 text-orange-500" />,
  },
  {
    question: "Do I need technical skills to set up my store?",
    answer:
      "Not at all! Your store is ready immediately upon sign up. No drag-and-drop builders or coding required. Simply customize your colors, store name, messages, and logo - that's it. We keep it dead simple.",
    icon: <Layout className="w-5 h-5 text-orange-500" />,
  },
  {
    question: "What if I need help or support?",
    answer:
      "We're here for you! Our support team is available to help with any questions. Plus, we provide documentation and guides to help you make the most of your Pazia Tech store.",
    icon: <MessageCircle className="w-5 h-5 text-orange-500" />,
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faq" className="bg-white  py-12 md:py-14 rounded-2xl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-px w-8 bg-orange-500"></div>
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider mx-3">
              FAQ
            </span>
            <div className="h-px w-8 bg-orange-500"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-900 text-lg max-w-2xl mx-auto">
           Most asked questions about Pazia Tech.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-200 transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left bg-white hover:bg-orange-50/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-black text-sm md:text-base">
                    {item.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-orange-500 transition-transform duration-300 flex-shrink-0 ml-4 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <div className="px-5 pb-5 md:px-6 md:pb-6 pt-0">
                  <div className="pl-11 md:pl-14">
                    <p className="text-gray-900 text-sm md:text-base leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Trigger */}
        <div className="mt-12 text-center">
          <div className="bg-orange-50 rounded-2xl p-6 md:p-8 border border-orange-100">
            <div className="flex flex-col items-center gap-4">
              <MessageCircle className="w-12 h-12 text-orange-500" />
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-black mb-2">
                  Still have questions?
                </h3>
                <p className="text-gray-700 mb-4">
                  We're here to help you get started with Pazia Tech
                </p>
                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-300 hover:scale-105"
                >
                  Contact Our Team
                  <HelpCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
