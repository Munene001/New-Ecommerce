"use client"


import Button from "../components/ui/button";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";

import Phase2 from "./components/phase2";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  return (
    <div className="text-secondaryText font-[Plus_Jakarta_Sans]">
      <div className="md:grid grid-cols-[60%_40%] md:h-auto h-fit   mb-4 p-4">
        <div className="flex flex-col gap-4 md:gap-0 justify-between">
          <div className="text-[18px] md:text-[22px] w-fit p-2 bg-gray-900/10 border text-primary-text border-white rounded-3xl mb-2">
          Add products, Accept payments
          </div>

          <div className="md:text-[65px] text-[45px] leading-[55px] md:leading-[65px] font-[Poppins] text-primary-text mb-5 flex flex-col">
            
             <span>Launch your online </span> <span>  Store in minutes </span>
          </div>

          <div className="text-[20px] md:block leading-[30px] mb-6 text-primary-text">

         Sell products, accept M-Pesa payments, and manage everything from one simple dashboard. Built for Kenyan businesses that want to start fast and scale.
            
           {" "} <span className="font-semibold text-three">
              MPesa-powered checkout
            </span>{" "}
            
          </div>

          <Button
            onClick={() => router.push("auth/shopowner/signup")} variant="secondary"
            className="font-semibold text-[22px] flex flex-row mt-2 mb-2 gap-2 items-center"
          >
            <span>Start Selling Now</span>
            <MoveRight color="white" size={22} />
          </Button>
        </div>

        <div className="md:flex md:flex-row hidden w-full justify-center gap-4">
          <Image
            src="/images/home/left.png"
            alt="sample app"
            className="  w-full object-contain h-[70vh]"
            width={1200}   // ← use actual image dimensions or larger
  height={800}
            
          />
        </div>
      </div>

      <div className="bg-gray-200 bg-[] py-8 rounded-3xl md:px-8 px-4    text-center">
        <div className=" text-orange-500 px-6 py-2 rounded-full text-sm font-semibold mb-4 tracking-wide">
          SELL ONLINE IN 4 SIMPLE STEPS
        </div>

        <h2 className="text-4xl md:px-[15vw] md:text-5xl font-bold text-black mb-15 font-[Poppins]">
          From Sign-Up to First Sale in One Seamless Workflow
        </h2>

        <Phase2 />
      </div>
    </div>
  );
}
