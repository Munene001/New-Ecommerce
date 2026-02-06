"use client"

import Link from "next/link";
import Button from "../components/ui/button";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";

import Phase2 from "./components/phase2";

export default function Home() {
  const router = useRouter();

  return (
    <div className="text-secondaryText font-[Plus_Jakarta_Sans]">
      <div className="md:grid grid-cols-[60%_40%] mb-4 p-4">
        <div className="flex flex-col">
          <div className="text-[18px] md:text-[22px] w-fit p-2 bg-gray-900/10 border border-white rounded-3xl mb-2">
            Launch an online shop in minutes
          </div>

          <div className="md:text-[65px] text-[45px] leading-[65px] font-[Poppins] text-primaryText mb-5">
            Create a Complete Online Shop With a Click of a Button
          </div>

          <div className="text-[20px] leading-[30px] mb-6">

            Designed for businesses that want to start selling fast. Create a
            ready-to-use online shop, add your products, and accept payments
            instantly using{" "}
            <span className="font-semibold text-three">
              MPesa-powered checkout
            </span>{" "}
            — all from one simple dashboard.
          </div>

          <Button
            onClick={() => router.push("auth/shopowner/signup")} variant="secondary"
            className="font-semibold text-[22px] flex flex-row mt-2 mb-2 gap-2 items-center"
          >
            <span>Start Free Trial</span>
            <MoveRight color="white" size={22} />
          </Button>
        </div>

        <div className="md:flex md:flex-row hidden justify-center gap-4">
          <img
            src="/assets/Home/s-left.webp"
            alt="sample app"
            className="md:h-[70vh] h-[20vh] animate-glide-in"
          />
        </div>
      </div>

      <div className="bg-magentaDark py-8 rounded-3xl md:px-8 px-4 text-center">
        <div className=" text-black px-6 py-2 rounded-full text-sm font-semibold mb-4 tracking-wide">
          SELL ONLINE IN 4 SIMPLE STEPS
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-15 font-[Poppins]">
          From Sign-Up to First Sale in One Seamless Workflow
        </h2>

        <Phase2 />
      </div>
    </div>
  );
}
