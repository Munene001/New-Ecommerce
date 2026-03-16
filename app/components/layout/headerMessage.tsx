"use client";

interface HeaderMessageProps {
  message: string;
  secondaryColor: string;
}

export default function HeaderMessage({ message, secondaryColor }: HeaderMessageProps) {
  return (
    <div
      className="text-center text-[15px] h-[50px] font-bold font-[Inter] text-white flex items-center justify-center gap-2 rounded-b-sm"
      style={{ backgroundColor: secondaryColor }}
    >
      <span>✨</span>
      <span>{message || "Get Deals Upto 50% Off"}</span>
    </div>
  );
}