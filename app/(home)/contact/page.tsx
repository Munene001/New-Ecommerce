"use client"
import SimpleFooter from "../components/footer";
import HomeWhatsApp from "../components/homeWhatsapp";
import ContactHeroSection from "./components/contactHero";
import ContactForm from "./components/contactForm";
import FAQSection from "./components/faqSection";
import { useShopOwnerTracking } from "@/lib/hooks/useShopOwnerTracking";
import { useEffect } from "react";


export default function Contact() {
   const { track } = useShopOwnerTracking();
  
    useEffect(() => {
      track("contact");
    }, []);
  return (
    <>
      <div >
        <ContactHeroSection />
       
        <ContactForm />
        <FAQSection/>
      </div>
      <HomeWhatsApp />
      <SimpleFooter />
    </>
  );
}