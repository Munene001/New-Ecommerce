import Image from "next/image";

interface StepProps {
  imageSrc: string;
  imageAlt: string;
  headline: string;
  description: string;
  Features: string[];
  stepNumber?: number;
}

export default function Step({
  imageSrc,
  imageAlt,
  headline,
  description,
  Features,
  stepNumber,
}: StepProps) {
  return (
    <div className="flex flex-col">
      {/* Title/Timeline part - ADDED THIS SECTION */}
      {stepNumber && (
        <div className="md:flex hidden flex-col items-center mb-4">
          <div className="p-3 rounded-full bg-three flex items-center justify-center shadow-md">
            <span className="text-black text-xl font-bold font-[Poppins]">
              Step {stepNumber}
            </span>
          </div>
        </div>
      )}
      
      {/* Original Step component - NO CHANGES BELOW */}
      <div
        className="relative group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] bg-white shadow-md hover:shadow-lg"
      >
        {/* Step Number Badge - Mobile Only */}
        {stepNumber && (
          <div className="absolute top-4 left-4 z-10 md:hidden">
            <div className="w-10 h-10 rounded-full bg-three flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">{stepNumber}</span>
            </div>
          </div>
        )}

        {/* Image Container */}
        <div className="relative h-56 w-full overflow-hidden bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="relative h-full w-full">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={stepNumber === 1}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Headline */}
          <h3 className="text-primaryText text-center text-xl font-bold mb-3 font-[Poppins]">
            {headline}
          </h3>

          {/* Description */}
          <p className="text-black text-center text-[16px] leading-relaxed mb-4 flex-1">
            {description}
          </p>

          {/* Divider */}
          <div className="w-12 h-0.5 bg-magenta/30 mb-4 mx-auto"></div>

          {/* Features Section */}
          <div className="space-y-3">
            {/* Features Title */}
            <div className="flex items-center justify-start gap-2">
              <div className="w-5 h-5 rounded-full bg-magenta/10 flex items-center justify-center">
                <span className="text-magenta text-xs font-bold">✓</span>
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Features:
              </span>
            </div>

            {/* Features List */}
            <ul className="space-y-2">
              {Features.map((feature, index) => (
                <li key={index} className="flex text-black items-center">
                  {/* Bullet */}
                  <div className="rounded-full flex mt-0.5 flex-row gap-2">
                    <span className="text-magenta text-xs">•</span>
                    <span className="text-black text-[16px] leading-relaxed text-start">
                      {feature}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}