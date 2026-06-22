"use client";

import { Check, Sparkles, Zap, Store, Globe, Rocket } from "lucide-react";
import Button from "@/app/components/ui/button";

const tiers = [
  {
    name: "Free Trial",
    price: "0",
    period: "for 30 days",
    yearlyPrice: null,
    yearlySave: null,
    description: "Experience all Basic features risk‑free.",
    features: [
      "Up to 100 products",
      "Basic SEO (meta tags, sitemap, discount codes)",
      "M-Pesa Integration",
      "Email support",
      "Sales reports",
      "Free SSL certificate",
      "CSV product export",
    ],
    cta: "Start 30-Day Trial",
    popular: false,
    icon: <Sparkles className="w-6 h-6" />,
    trial: true,
  },
  {
    name: "Basic",
    price: "999",
    period: "/month",
    yearlyPrice: "9,999",
    yearlySave: "2,000",
    description: "Continue with the same features after trial.",
    features: [
      "Up to 50 products",
      "Basic SEO + discount codes",
      "Mpesa Integration",
      "Bring your own custom domain",
      "Email support",
      "Sales reports",
      "Free SSL certificate",
      "CSV product export",
    ],
    cta: "Choose Basic",
    popular: true,
    icon: <Store className="w-6 h-6" />,
  },
  {
    name: "Pro",
    price: "2,499",
    period: "/month",
    yearlyPrice: "23,999",
    yearlySave: "5,000",
    description: "Full‑service scale with hands‑on support from our team.",
    features: [
      "Unlimited products",
      "Mpesa Integratiion",
      "Free custom domain (we provide it)",
      "Aggressive SEO (rich snippets, advanced sitemaps, search console)",
      "SMS integration (order updates, promo SMS)",
      "Priority 24/7 chat & phone support",
      "Blog writing (we write for you)",
      "Product upload assistance (we help you upload)",
      "Social media auto‑posting – add a product, it posts to your Facebook & Instagram",
    ],
    cta: "Go Pro",
    popular: false,
    icon: <Rocket className="w-6 h-6" />,
  },
];

export default function PricingSection() {
  return (
    <div className="relative py-16 md:py-24 ">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-px w-8 bg-orange-500"></div>
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider mx-3">
              Pricing
            </span>
            <div className="h-px w-8 bg-orange-500"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-white text-lg max-w-2xl mx-auto">
            Zero commission – you keep 100% of your sales. Pay only for the
            tools you need.
          </p>
          <div className="mt-4 inline-block bg-orange-500/10 text-orange-400 px-4 py-2 rounded-full text-sm font-medium">
            30‑day free trial – no credit card required
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 mb-10 md:grid-cols-3 gap-8 lg:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`
                relative rounded-2xl transition-all duration-300 hover:-translate-y-2
                ${
                  tier.popular
                    ? "bg-gradient-to-b from-gray-900 to-black border-2 border-orange-500 shadow-xl shadow-orange-500/10"
                    : "bg-gray-900/80 border border-gray-800 hover:border-orange-500/50"
                }
              `}
            >
              {tier.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="p-6 md:p-8">
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                </div>

                {/* Price - Monthly */}
                <div className="mb-1">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    KES {tier.price}
                  </span>
                  <span className="text-white text-sm ml-1">{tier.period}</span>
                </div>

                {/* Yearly price with savings */}
                {tier.yearlyPrice && tier.yearlySave && (
                  <p className="text-white text-sm mb-4">
                    or KES {tier.yearlyPrice}/year (save KES {tier.yearlySave})
                  </p>
                )}

                <p className="text-gray-300 text-sm my-6">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-white">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full justify-center"
                  onClick={() => {
                    window.location.href =
                      "/auth/shopowner/signup "
                  }}
                >
                  {tier.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note about 0% commission and annual plans */}
        <div className="  text-center">
          <div className="bg-gray-900/50 rounded-2xl p-6 md:p-8 border border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <p className="text-white font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  0% commission – always
                </p>
                <p className="text-white text-sm mt-1">
                  Money goes directly from your customer to you. Pazia Tech
                  never holds or takes a cut.
                </p>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-500" />
                  Annual plans
                </p>
                <p className="text-white text-sm mt-1">
                  Basic: KES 9,999/year • Pro: KES 23,999/year
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ / Contact trigger */}
        <div className="mt-12 text-center">
          <p className="text-white">
            Questions?{" "}
            <a href="/contact#form" className="text-orange-500 hover:underline">
              Talk to our team
            </a>{" "}
            or check the{" "}
            <a href="/contact#faq" className="text-orange-500 hover:underline">
              FAQ
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
