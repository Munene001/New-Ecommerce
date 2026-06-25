// app/(shopowner)/dashboard/[shopSlug]/products/update/components/updateImagesForm.tsx
"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  Star,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import InstructionsList from "@/app/components/ui/instructionList";

export interface ProductImage {
  id: string;
  file?: File;
  preview: string;
  isPrimary: boolean;
  status?: "existing" | "new" | "deleted" | "uploading" | "success" | "failed";
  serverId?: number;
  image_path?: string;
}

export interface UpdateImagesFormRef {
  saveImages: (productId: number) => Promise<{
    success: boolean;
    failedCount: number;
    failedIds: string[];
    primarySucceeded: boolean;
  }>;
  getImages: () => ProductImage[];
  resetImages: () => void;
  loadImages: () => Promise<void>;
}

interface UpdateImagesFormProps {
  productId: number;
  onImagesChange?: (images: ProductImage[]) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onUploadProgress?: (current: number, total: number) => void;
}

const COMPRESSION_TIMEOUT_MS = 12000;

const UpdateImagesForm = forwardRef<UpdateImagesFormRef, UpdateImagesFormProps>(
  ({ 
    productId,
    onImagesChange, 
    onError, 
    onSuccess,
    onUploadProgress,
  }, ref) => {
    const [localImages, setLocalImages] = useState<ProductImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadImages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/shopowner/products/${productId}/images/primary?mode=all`);
        if (!res.ok) throw new Error('Failed to load images');
        
        const data = await res.json();
        
        const serverImages: ProductImage[] = data.map((img: any) => ({
          id: `server-${img.image_id}`,
          serverId: img.image_id,
          preview: `/api/shopowner/products/${productId}/images/primary?imageId=${img.image_id}&w=200`,
          isPrimary: img.is_primary === 1,
          status: "existing" as const,
          image_path: img.image_path,
        }));
        
        setLocalImages(serverImages);
        onImagesChange?.(serverImages);
      } catch (error) {
        console.error('Failed to load images:', error);
        onError?.('Failed to load existing images');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      loadImages();
    }, [productId]);

    const compressFile = async (file: File): Promise<File> => {
      if (file.size < 200 * 1024) return file;

      const type = file.type.toLowerCase();
      if (
        type === "image/heic" ||
        type === "image/heif" ||
        type.includes("heic") ||
        type.includes("heif")
      ) {
        return file;
      }

      const compressionOptions = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
        initialQuality: 0.6,
      };

      try {
        const compressed = await Promise.race([
          imageCompression(file, compressionOptions),
          new Promise<File>((_, reject) =>
            setTimeout(
              () => reject(new Error("Compression timeout")),
              COMPRESSION_TIMEOUT_MS,
            ),
          ),
        ]);
        return compressed;
      } catch (err) {
        return file;
      }
    };

    const handlePrimarySelection = async (file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        onError?.("Image exceeds 8MB. Please choose a smaller one.");
        return;
      }

      setIsProcessing(true);
      try {
        const compressed = await compressFile(file);
        const preview = URL.createObjectURL(compressed);
        
        const filtered = localImages.map(img => ({ ...img, isPrimary: false }));
        
        const newPrimary: ProductImage = {
          id: `new-${Date.now()}`,
          file: compressed,
          preview,
          isPrimary: true,
          status: "new",
        };
        
        const updatedImages: ProductImage[] = [newPrimary, ...filtered];
        setLocalImages(updatedImages);
        onImagesChange?.(updatedImages);
        onSuccess?.("Primary image set successfully!");
      } catch (err) {
        onError?.("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const handleAdditionalSelection = async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentAdditionalCount = localImages.filter(
        (img) => !img.isPrimary && img.status !== "deleted"
      ).length;
      const remainingSlots = 5 - currentAdditionalCount;
      
      if (fileArray.length > remainingSlots) {
        onError?.(`You can only add ${remainingSlots} more image(s).`);
        return;
      }

      setIsProcessing(true);
      const newImages: ProductImage[] = [];

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          if (file.size > 8 * 1024 * 1024) {
            onError?.(`${file.name} exceeds 8MB. Skipped.`);
            continue;
          }

          const compressed = await compressFile(file);
          const preview = URL.createObjectURL(compressed);

          newImages.push({
            id: `new-${Date.now()}-${i}`,
            file: compressed,
            preview,
            isPrimary: false,
            status: "new",
          });
        }

        const updatedImages: ProductImage[] = [...localImages, ...newImages];
        setLocalImages(updatedImages);
        onImagesChange?.(updatedImages);
        onSuccess?.(`${newImages.length} image(s) added successfully!`);
      } catch (err) {
        onError?.("Failed to process some images. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const removeImage = (id: string) => {
      const img = localImages.find((i) => i.id === id);
      if (!img) return;
      
      let updatedImages: ProductImage[];
      
      if (img.status === "new" && img.preview) {
        URL.revokeObjectURL(img.preview);
        updatedImages = localImages.filter((i) => i.id !== id);
      } else if (img.status === "existing") {
        updatedImages = localImages.map((i): ProductImage =>
          i.id === id 
            ? { ...i, status: "deleted" as const } 
            : i
        );
      } else {
        return;
      }
      
      setLocalImages(updatedImages);
      onImagesChange?.(updatedImages);
    };

    const setAsPrimary = (id: string) => {
      const img = localImages.find((i) => i.id === id);
      if (!img || img.status === "deleted") {
        onError?.("Image not found.");
        return;
      }

      const updatedImages: ProductImage[] = localImages.map((i): ProductImage => ({
        ...i,
        isPrimary: i.id === id,
      }));
      
      setLocalImages(updatedImages);
      onImagesChange?.(updatedImages);
      onSuccess?.("Primary image updated!");
    };

    const getImages = () => localImages;

    const resetImages = () => {
      localImages.forEach((img) => {
        if (img.status === "new" && img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setLocalImages([]);
      onImagesChange?.([]);
    };

    const saveImages = async (productIdNum: number) => {
      const imagesToProcess = localImages.filter(
        (img) => img.status === "new" || img.status === "failed"
      );
      
      const imagesToDelete = localImages.filter(
        (img) => img.status === "deleted" && img.serverId
      );    
      
      for (const img of imagesToDelete) {
        try {
          await fetch(
            `/api/shopowner/products/${productIdNum}/images?imageId=${img.serverId}`,
            { method: "DELETE" }
          );
        } catch (error) {
          console.error('Failed to delete image:', error);
        }
      }

      const existingPrimary = localImages.find(
        (img) => img.status === "existing" && img.isPrimary
      );
      
      if (existingPrimary?.serverId) {
        try {
          await fetch(
            `/api/shopowner/products/${productIdNum}/images/primary`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageId: existingPrimary.serverId }),
            }
          );
        } catch (error) {
          console.error('Failed to set primary:', error);
        }
      }

      const newImages = imagesToProcess.filter((img) => img.status === "new" || img.status === "failed");
      const failedIds: string[] = [];
      let primarySucceeded = false;

      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        
        setLocalImages((prev) =>
          prev.map((p) =>
            p.id === img.id ? { ...p, status: "uploading" as const } : p,
          )
        );

        onUploadProgress?.(i + 1, newImages.length);

        try {
          const formData = new FormData();
          if (img.file) {
            formData.append("image", img.file);
          }
          formData.append("isPrimary", String(img.isPrimary));

          const res = await fetch(
            `/api/shopowner/products/${productIdNum}/images`,
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          const updatedImages = localImages.map((p): ProductImage =>
            p.id === img.id
              ? { ...p, status: "success" as const, serverId: data.image_id }
              : p
          );
          setLocalImages(updatedImages);
          onImagesChange?.(updatedImages);

          if (img.isPrimary) {
            primarySucceeded = true;
          }
        } catch (err) {
          const updatedImages = localImages.map((p): ProductImage =>
            p.id === img.id ? { ...p, status: "failed" as const } : p
          );
          setLocalImages(updatedImages);
          onImagesChange?.(updatedImages);
          failedIds.push(img.id);
        }
      }

      const primary = localImages.find((img) => img.isPrimary);
      if (primary && (primary.status === "success" || primary.status === "existing")) {
        primarySucceeded = true;
      }

      return {
        success: failedIds.length === 0,
        failedCount: failedIds.length,
        failedIds,
        primarySucceeded,
      };
    };

    useImperativeHandle(ref, () => ({
      saveImages,
      getImages,
      resetImages,
      loadImages,
    }));

    const visibleImages = localImages.filter((img) => img.status !== "deleted");
    const primaryImage = visibleImages.find((img) => img.isPrimary);
    const additionalImages = visibleImages.filter((img) => !img.isPrimary);

    const StatusIcon = ({ status }: { status?: string }) => {
      if (status === "uploading")
        return (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        );
      if (status === "success")
        return <div className="w-4 h-4 bg-green-500 rounded-full shadow-md" />;
      if (status === "failed")
        return <X className="w-4 h-4 text-red-500 bg-white rounded-full" />;
      if (status === "existing")
        return <div className="w-4 h-4 bg-blue-500 rounded-full shadow-md" />;
      return null;
    };

    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="ml-2 text-gray-600">Loading images...</span>
        </div>
      );
    }

    return (
      <div className="md:space-y-6 space-y-8 bg-white md:p-6 rounded-lg">
        <div className="text-xl font-semibold text-black">Product Images</div>

        <InstructionsList
          items={[
            { text: "Maximum 6 images total" },
            { text: "Images are compressed to ~200KB automatically" },
            { text: "HEIC/HEIF images are uploaded in original format" },
            { text: "Click the star icon on any image to make it primary" },
            { text: "Remove an image to delete it (saved on update)" },
          ]}
          variant="green"
        />

        <div className="space-y-2">
          <label className="block md:text-sm text-[16px] font-medium text-gray-700">
            Primary Image <span className="text-red-500">*</span>
          </label>

          {primaryImage ? (
            <div className="relative w-40 h-40 border rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={primaryImage.preview}
                alt="Primary"
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => removeImage(primaryImage.id)}
                  className="bg-red-500 text-white p-1.5 rounded-full shadow-md"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 bg-magenta-dark text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Primary
              </div>
              <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-0.5">
                <StatusIcon status={primaryImage.status} />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  if (e.target.files?.[0])
                    handlePrimarySelection(e.target.files[0]);
                  e.target.value = "";
                }}
                className="hidden"
                id="primary-camera"
                disabled={isProcessing}
              />
              <label
                htmlFor="primary-camera"
                className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer flex flex-col items-center ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-600" />
                )}
                <span className="text-xs text-black mt-1">
                  {isProcessing ? "Processing..." : "Take Photo"}
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0])
                    handlePrimarySelection(e.target.files[0]);
                  e.target.value = "";
                }}
                className="hidden"
                id="primary-gallery"
                disabled={isProcessing}
              />
              <label
                htmlFor="primary-gallery"
                className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer flex flex-col items-center ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-xs text-black mt-1">
                  {isProcessing ? "Processing..." : "Gallery"}
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block md:text-sm text-[16px] font-medium text-gray-700">
            Additional Images ({additionalImages.length}/5)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                <Loader2 className="w-10 h-10 text-magenta-dark animate-spin" />
                <p className="text-sm font-medium text-gray-700 mt-2">
                  Processing images...
                </p>
                <p className="text-xs text-gray-500">
                  Please wait while we compress your images
                </p>
              </div>
            )}

            {additionalImages.map((image) => (
              <div
                key={image.id}
                className="relative aspect-square border rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={image.preview}
                  alt="Additional"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => setAsPrimary(image.id)}
                    className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md hover:bg-yellow-600 transition-colors"
                    title="Make primary"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeImage(image.id)}
                    className="bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-0.5">
                  <StatusIcon status={image.status} />
                </div>
              </div>
            ))}

            {additionalImages.length < 5 && !isProcessing && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple={false}
                  onChange={(e) => {
                    if (e.target.files)
                      handleAdditionalSelection(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                  id="additional-camera"
                />
                <label
                  htmlFor="additional-camera"
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-600" />
                  <span className="text-xs text-black mt-1">Camera</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files)
                      handleAdditionalSelection(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                  id="additional-gallery"
                />
                <label
                  htmlFor="additional-gallery"
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                  <span className="text-xs text-black mt-1">Gallery</span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
);

UpdateImagesForm.displayName = "UpdateImagesForm";
export default UpdateImagesForm;