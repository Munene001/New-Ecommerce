// File: src/components/ContactHeroSection.tsx
"use client";

import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";

const contactDetails = [
  {
    icon: <Phone className="w-5 h-5 text-orange-500" />,
    title: "Phone",
    value: "+254 715067768",
    href: "tel:+254715067768",
    detail: "Mon-Sat from 9am to 8pm",
  },
  {
    icon: <Mail className="w-5 h-5 text-orange-500" />,
    title: "Email",
    value: "info@paziatech.com",
    detail: "We'll respond within 24h",
  },
  {
    icon: <MapPin className="w-5 h-5 text-orange-500" />,
    title: "Location",
    value: "51 Lenana Rd, Nairobi",

    detail: "Kenya",
  },
  {
    icon: <Clock className="w-5 h-5 text-orange-500" />,
    title: "Working Hours",
    value: "Mon - Sat",

    detail: "9:00 AM - 8:00 PM",
  },
];

export default function ContactHeroSection() {
  return (
    <>
      <div className=" py-10 md:py-12 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side - Hero Text */}
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center">
                <div className="h-px w-8 bg-orange-500"></div>
                <span className="text-orange-500 font-semibold text-sm uppercase tracking-wider ml-3">
                  Get in Touch
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Let&apos;s Talk
                <span className="text-orange-500 block">& Build Together</span>
              </h1>

              <p className="text-base md:text-lg text-gray-300 max-w-lg">
                Have a vision for your eCommerce store ? Let’s make it happen.
                Whether you're ready to start a project or simply exploring
                ideas, our team at Pazia Tech is here to help
              </p>

              <div className="flex flex-wrap gap-4 pt-2 md:pt-4">
                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-300 hover:scale-105"
                >
                  Get in Touch
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Side - Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 lg:mt-0">
              {contactDetails.map((detail, index) => (
                <a
                  key={index}
                  href={detail.href}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-4 md:p-5 border border-gray-200 hover:border-orange-500 hover:scale-105"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      {detail.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-xs md:text-sm uppercase tracking-wide">
                        {detail.title}
                      </h3>
                      <p className="text-black font-medium text-sm md:text-base mt-1">
                        {detail.value}
                      </p>
                      <p className="text-gray-700 text-xs mt-1">
                        {detail.detail}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b-2 rounded-xl  border-white/40"></div>
      </div>
    </>
  );
}
