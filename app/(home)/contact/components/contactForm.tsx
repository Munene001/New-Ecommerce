// File: src/components/ContactForm.tsx
"use client";

import { useState } from "react";
import FormInput from "@/app/components/ui/formInput";
import Button from "@/app/components/ui/button";
import SimpleToast from "@/app/components/ui/simpleToast";
import { User, Mail, Phone, MessageSquare } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setToast({
          type: "success",
          text: "Message sent! We'll get back to you soon.",
        });
        setFormData({ name: "", phone: "", email: "", message: "" });
      } else {
        setToast({
          type: "error",
          text: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      setToast({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      id="contact-form"
    >
      <SimpleToast message={toast} onClose={() => setToast(null)} />

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Send us a Message
          </h2>
          <p className="text-white text-lg">
            Have an inquiry in mind? We&apos;d love to hear from you. Fill out
            the form and we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-10 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Your Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              placeholder="John Doe"
              required
              icon={<User className="w-4 h-4 text-gray-500" />}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              placeholder="+254 712 345 678"
              required
              icon={<Phone className="w-4 h-4 text-gray-500" />}
            />

            <FormInput
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="hello@paziatech.com"
              required
              icon={<Mail className="w-4 h-4 text-gray-500" />}
            />

            <FormInput
              label="Your Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              type="textarea"
              placeholder="Tell us about your project or inquiry..."
              required
              icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
              rows={4}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
