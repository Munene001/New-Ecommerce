// File: app/contact/page.tsx
import SimpleFooter from "../components/footer";
import HomeWhatsApp from "../components/homeWhatsapp";
import ContactHeroSection from "./components/contactHero";
import ContactForm from "./components/contactForm";
import FAQSection from "./components/faqSection";


export default function Contact() {
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