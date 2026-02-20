"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { ProductImage } from "../types";
import InstructionsList from "@/app/components/ui/instructionList";

interface ImagesFormProps {
  images: ProductImage[];
  setImages: (images: ProductImage[]) => void;
  onError?: (message: string) => void; // Add this to show errors
}

export default function ImagesForm({
  images,
  setImages,
  onError,
}: ImagesFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `Image "${file.name}" exceeds 5MB limit. Please choose a smaller file.`;
      setLocalError(errorMsg);
      if (onError) onError(errorMsg);

      // Clear error after 5 seconds
      setTimeout(() => setLocalError(null), 5000);
      return false;
    }
    return true;
  };

  const handlePrimaryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size
      if (!validateFileSize(file)) {
        e.target.value = ""; // Clear the input
        return;
      }

      const preview = URL.createObjectURL(file);

      // Remove any existing primary image
      const filteredImages = images.filter((img) => !img.isPrimary);

      setImages([{ file, preview, isPrimary: true }, ...filteredImages]);
    }
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);

    if (e.target.files) {
      const newImages: ProductImage[] = [];
      const remainingSlots = 6 - images.length;
      const files = Array.from(e.target.files);

      // Check total slots first
      if (files.length > remainingSlots) {
        const errorMsg = `You can only add ${remainingSlots} more image${
          remainingSlots !== 1 ? "s" : ""
        }.`;
        setLocalError(errorMsg);
        if (onError) onError(errorMsg);
        setTimeout(() => setLocalError(null), 5000);
        e.target.value = "";
        return;
      }

      // Validate each file size
      const invalidFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map((f) => `"${f.name}"`).join(", ");
        const errorMsg = `${
          invalidFiles.length > 1 ? "Files" : "File"
        } ${fileNames} exceed${
          invalidFiles.length === 1 ? "s" : ""
        } 5MB limit.`;
        setLocalError(errorMsg);
        if (onError) onError(errorMsg);
        setTimeout(() => setLocalError(null), 5000);
        e.target.value = "";
        return;
      }

      // Process valid files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview, isPrimary: false });
      }

      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
    setLocalError(null); // Clear any errors when removing
  };

  const setAsPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(newImages);
  };

  const primaryImage = images.find((img) => img.isPrimary);
  const additionalImages = images.filter((img) => !img.isPrimary);

  return (
    <div className="md:space-y-6 space-y-8 bg-white  md:p-6 rounded-lg">
      <div className="text-xl font-semibold text-black">Product Images</div>

      <InstructionsList
        items={[
          { text: "Maximum 6 images total" },
          {
            text: (
              <>
                No image should exceed{" "}
                <span className="font-semibold">5MB</span>
              </>
            ),
          },
          {
            text: "Primary image is the default image and will be presented to the customer as the main image.",
          },
          {
            text: "Clicking the star icon on an image makes it the primary image",
          },
        ]}
        variant="green"
      />

      {/* Primary Image */}
      <div className="space-y-2">
        <label className="block md:text-sm text-[16px] font-medium text-gray-700">
          Primary Image <span className="text-red-500">*</span>
        </label>

        {primaryImage ? (
          <div className="relative w-40 h-40 border rounded-lg overflow-hidden group">
            <Image
              src={primaryImage.preview}
              alt="Primary"
              fill
              className="object-cover"
            />
            <button
              onClick={() => removeImage(images.indexOf(primaryImage))}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Remove primary image"
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-magenta-dark text-white text-xs px-2 py-1 rounded">
              Primary
            </div>
            {/* File size indicator */}
            {primaryImage.file && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {(primaryImage.file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePrimaryImage}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors group"
            >
              <Icon
                icon="mdi:cloud-upload"
                className="text-3xl text-gray-400 mx-auto mb-2 group-hover:text-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-blue-500">
                Click to upload primary image
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Additional Images */}
      <div className="space-y-2">
        <label className="block md:text-sm text-[16px] font-medium text-gray-700">
          Additional Images ({additionalImages.length}/5)
        </label>

        <input
          ref={additionalInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdditionalImages}
          className="hidden"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {additionalImages.map((image, idx) => {
            const originalIndex = images.indexOf(image);
            return (
              <div
                key={idx}
                className="relative aspect-square border rounded-lg overflow-hidden group "
              >
                <Image
                  src={image.preview}
                  alt={`Additional ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setAsPrimary(originalIndex)}
                    className="bg-yellow-500 text-white p-1.5 rounded-full hover:bg-yellow-600 transition-colors"
                    title="Make primary"
                  >
                    <Icon icon="mdi:star" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeImage(originalIndex)}
                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                    title="Remove"
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                  </button>
                </div>
                {/* File size indicator on hover */}
                {image.file && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {(image.file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}
              </div>
            );
          })}

          {additionalImages.length < 5 && (
            <button
              onClick={() => additionalInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors group"
            >
              <Icon
                icon="mdi:plus"
                className="w-8 h-8 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs mt-1">Add More</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
