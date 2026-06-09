"use client";

import { useEffect, useRef, useState } from "react";
import Button from "../components/ui/button";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";
import TrustSection from "./components/Trust/page";
import FeaturesSection from "./components/Features/page";
import SimpleFooter from "./components/footer";
import HomeWhatsApp from "./components/homeWhatsapp";
import { useShopOwnerTracking } from "@/lib/hooks/useShopOwnerTracking";

import Phase2 from "./components/phase2";
import Image, { StaticImageData } from "next/image";

// Props interface for AnimatedImage component
interface AnimatedImageProps {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  width: number;
  height: number;
}

// Animated Image Component
const AnimatedImage = ({
  src,
  alt,
  className = "",
  width,
  height,
}: AnimatedImageProps) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Stop observing once animated
        }
      },
      { threshold: 0.2, rootMargin: "50px" }, // Trigger when 20% visible or 50px before
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imageRef} className={isVisible ? "slide-in-right" : "opacity-0"}>
      <Image
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const { track } = useShopOwnerTracking();

  useEffect(() => {
    track("home");
  }, []);

  return (
    <div className="text-secondaryText font-[Plus_Jakarta_Sans]">
      <div className="md:grid grid-cols-[60%_40%] md:h-auto h-fit mb-4 p-4">
        <div className="flex flex-col gap-4 md:gap-0 justify-between">
          <div className="text-[18px] md:text-[22px] w-fit p-2 bg-gray-900/10 border text-primary-text border-white rounded-3xl mb-2">
            Share products with a simple link
          </div>

          <div className="md:text-[65px] text-[45px] leading-[55px] md:leading-[65px] font-[Poppins] text-primary-text mb-5 flex flex-col">
            <span>Sell online without</span>
            <span>Endless DMs</span>
          </div>

          <div className="text-[20px] md:block leading-[30px] mb-6 text-primary-text">
            PaziaTech helps Kenyan businesses share a simple shop link where
            customers can browse items, check details, and make buying decisions
            without endless {" "}
            <span className="font-semibold text-three">
              Back-and-forth conversations.
            </span>{" "}
          </div>

          <Button
            onClick={() => router.push("auth/shopowner/signup")}
            variant="secondary"
            className="font-semibold text-[22px] flex flex-row mt-2 mb-2 gap-2 items-center"
          >
            <span>Start Selling Now</span>
            <MoveRight color="white" size={22} />
          </Button>

          {/* Mobile Image - Animates when scrolled into view */}
          <div className="md:hidden mt-6 w-full justify-center gap-4">
            <AnimatedImage
              src="/images/home/lefter.webp"
              alt="sample app"
              className="w-full object-contain h-[40vh]"
              width={1200}
              height={800}
            />
          </div>
        </div>

        {/* Desktop Image - Animates on page load since it's visible */}
        <div className="md:flex md:flex-row hidden w-full justify-center gap-4">
          <AnimatedImage
            src="/images/home/lefter.webp"
            alt="sample app"
            className="w-full object-contain h-[70vh]"
            width={1200}
            height={800}
          />
        </div>
      </div>
      <TrustSection />

      <FeaturesSection />

      <Phase2 />

      <SimpleFooter />
      <HomeWhatsApp />
    </div>
  );
}
