"use client";

import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star } from "lucide-react";

interface Review {
  stars: number;
  quote: string;
  author: string;
}

interface ReviewsProps {
  reviews: Review[];
}

const Reviews = ({ reviews }: ReviewsProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (emblaApi) {
      setScrollSnaps(emblaApi.scrollSnapList());
      emblaApi.on("select", () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const scrollTo = (index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  };

  // Helper to render stars with orange accents
  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < count 
            ? "text-orange-500 fill-orange-500" 
            : "text-gray-600 fill-gray-600"
        }`}
      />
    ));
  };

  // Review card content (shared between mobile and desktop) - BLACK CARD HIGH CONTRAST
  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="group rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-800 bg-black shadow-lg">
      {/* Content */}
      <div className="relative z-10">
        {/* Orange accent bar at top */}
        <div className="w-12 h-1 bg-orange-500 rounded-full mx-auto mb-5"></div>
        
        {/* Stars */}
        <div className="flex justify-center gap-1 mb-4">
          {renderStars(review.stars)}
        </div>

        {/* Quote - PURE WHITE, no gray */}
        <p className="text-white text-sm md:text-base italic leading-relaxed mb-4 px-2">
          "{review.quote}"
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-800 mx-auto mb-3"></div>

        {/* Author - Orange for pop */}
        <p className="text-orange-400 text-sm font-medium">— {review.author}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full my-8">
      {/* Mobile Carousel (md and below) */}
      <div className="md:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex ">
            {reviews.map((review, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 ">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation - Orange themed */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`transition-all duration-200 rounded-full ${
                  index === selectedIndex
                    ? "w-2.5 h-2.5 bg-orange-500"
                    : "w-2 h-2 bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Static Grid (md and above) */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        {reviews.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))}
      </div>
    </div>
  );
};

export default Reviews;