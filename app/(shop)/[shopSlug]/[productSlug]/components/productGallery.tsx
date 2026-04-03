"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import Image from "next/image";

interface ImageType {
  id: number;
  path: string;
  is_primary: boolean;
}

interface Props {
  productId: number;
  images: ImageType[];
  secondaryColor: string;
}

export default function ProductGallery({
  productId,
  images,
  secondaryColor,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageId, setModalImageId] = useState<number | null>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const imageUrl = useCallback(
    (imageId: number, width = 800, quality = 80) =>
      `/api/shopowner/products/${productId}/images/primary?imageId=${imageId}&w=${width}&q=${quality}`,
    [productId],
  );

  // Preload images - using native browser Image constructor
  useEffect(() => {
    images.forEach((img) => {
      const thumb = new window.Image();
      thumb.src = imageUrl(img.id, 200);
      const large = new window.Image();
      large.src = imageUrl(img.id, 800);
    });
  }, [images, imageUrl]);

  // Check if current image is already loaded (cached)
  useEffect(() => {
    const currentImageId = images[currentIndex]?.id;
    if (!currentImageId) return;

    // If already marked as loaded, do nothing
    if (loadedImages.has(currentImageId)) return;

    // Use a ref to check if the image is already complete
    const checkImageLoaded = () => {
      if (mainImageRef.current?.complete && !loadedImages.has(currentImageId)) {
        setLoadedImages((prev) => new Set(prev).add(currentImageId));
      }
    };

    // Check immediately
    checkImageLoaded();

    // Also set up load event listener
    const img = mainImageRef.current;
    if (img && !img.complete) {
      const handleLoad = () => {
        setLoadedImages((prev) => new Set(prev).add(currentImageId));
      };
      img.addEventListener("load", handleLoad);
      return () => img.removeEventListener("load", handleLoad);
    }
  }, [currentIndex, images, loadedImages, imageUrl]);

  const handleImageLoad = useCallback((imageId: number) => {
    setLoadedImages((prev) => new Set(prev).add(imageId));
  }, []);

  const openModal = useCallback((imageId: number) => {
    setModalImageId(imageId);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalImageId(null);
    document.body.style.overflow = "";
  }, []);

  // Handle ESC key for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeModal]);

  // Clean up body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (images.length === 0) {
    return (
      <div className="bg-gray-100 w-full aspect-square flex items-center justify-center text-gray-400 min-h-[300px]">
        No images available
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 min-w-[250px]">
        {/* Thumbnails */}
        <div className="flex justify-center md:justify-start md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-visible">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              onMouseEnter={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-18 h-18 border rounded-md overflow-hidden transition-all ${
                idx === currentIndex
                  ? "ring-1 ring-offset-1"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              style={
                idx === currentIndex
                  ? {
                      borderColor: secondaryColor,
                      boxShadow: `0 0 0 1px ${secondaryColor}`,
                    }
                  : { borderColor: undefined }
              }
            >
              <Image
                src={imageUrl(img.id, 200)}
                alt=""
                className="w-full h-full object-cover"
                width={200}
                height={200}
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = "/placeholder.jpg";
                }}
              />
            </button>
          ))}
        </div>

        {/* Main image container */}
        <div
          className="relative flex-1 aspect-square bg-gray-100 p-3 rounded-lg overflow-hidden order-1 md:order-2 min-h-[400px] max-h-[420px] md:min-h-[450px] md:max-h-[480px] cursor-zoom-in"
          onClick={() => openModal(currentImage.id)}
        >
          {!loadedImages.has(currentImage.id) && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <Image
            ref={mainImageRef}
            src={imageUrl(currentImage.id, 800)}
            alt=""
            className="w-full h-full object-contain relative z-10"
            width={800}
            height={800}
            onLoad={() => handleImageLoad(currentImage.id)}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = "/placeholder.jpg";
              handleImageLoad(currentImage.id);
            }}
          />
        </div>
      </div>

      {/* Modal/Lightbox */}
      {isModalOpen && modalImageId && (
        <div
          className="fixed inset-0 z-50 flex lg:items-center py-5 lg:py-0 justify-center bg-black bg-opacity-80"
          onClick={closeModal}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl(modalImageId, 1200)}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
              width={1200}
              height={1200}
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <X />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
