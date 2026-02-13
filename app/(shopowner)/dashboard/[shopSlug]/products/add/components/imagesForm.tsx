"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { ProductImage } from "../types";// Import shared type

interface ImagesFormProps {
  images: ProductImage[];
  setImages: (images: ProductImage[]) => void;
}

export default function ImagesForm({ images, setImages }: ImagesFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  const handlePrimaryImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      
      // Remove any existing primary image
      const filteredImages = images.filter(img => !img.isPrimary);
      
      setImages([
        { file, preview, isPrimary: true },
        ...filteredImages
      ]);
    }
  };

  const handleAdditionalImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: ProductImage[] = [];
      const remainingSlots = 6 - images.length;
      
      for (let i = 0; i < Math.min(e.target.files.length, remainingSlots); i++) {
        const file = e.target.files[i];
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
  };

  const setAsPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setImages(newImages);
  };

  const primaryImage = images.find(img => img.isPrimary);
  const additionalImages = images.filter(img => !img.isPrimary);

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg">
      <h2 className="text-lg font-semibold text-gray-800">Product Images</h2>
      <p className="text-sm text-gray-500">Maximum 6 images total</p>

      {/* Primary Image */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Primary Image <span className="text-red-500">*</span>
        </label>
        
        {primaryImage ? (
          <div className="relative w-48 h-48 border rounded-lg overflow-hidden group">
            <Image
              src={primaryImage.preview}
              alt="Primary"
              fill
              className="object-cover"
            />
            <button
              onClick={() => removeImage(images.indexOf(primaryImage))}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon icon="mdi:close" className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              Primary
            </div>
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
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
            >
              <Icon icon="mdi:cloud-upload" className="text-3xl text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-600">Click to upload primary image</span>
            </button>
          </div>
        )}
      </div>

      {/* Additional Images */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
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
              <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group">
                <Image
                  src={image.preview}
                  alt={`Additional ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setAsPrimary(originalIndex)}
                    className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700"
                    title="Make primary"
                  >
                    <Icon icon="mdi:star" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeImage(originalIndex)}
                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                    title="Remove"
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {additionalImages.length < 5 && (
            <button
              onClick={() => additionalInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              <Icon icon="mdi:plus" className="w-8 h-8" />
              <span className="text-xs mt-1">Add More</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}