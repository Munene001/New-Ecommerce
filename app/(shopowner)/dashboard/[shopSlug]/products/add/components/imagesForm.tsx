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
  file: File;
  preview: string;
  isPrimary: boolean;
  id: string;
  status?: "pending" | "uploading" | "success" | "failed";
  serverId?: number;
}

export interface ImagesFormRef {
  uploadImages: (productId: number) => Promise<{
    success: boolean;
    failedCount: number;
    failedIds: string[];
    primarySucceeded: boolean;
  }>;
  clearFailedPrimary: () => void;
  getImages: () => ProductImage[];
  resetImages: () => void;
}

interface ImagesFormProps {
  initialImages?: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onUploadProgress?: (current: number, total: number) => void;
}

const COMPRESSION_TIMEOUT_MS = 12000;

const ImagesForm = forwardRef<ImagesFormRef, ImagesFormProps>(
  ({ 
    initialImages = [], 
    onImagesChange, 
    onError, 
    onSuccess,
    onUploadProgress,
  }, ref) => {
    const [localImages, setLocalImages] = useState<ProductImage[]>(initialImages);
    const [isProcessing, setIsProcessing] = useState(false);

    // ✅ Clean up blob URLs on unmount
    useEffect(() => {
      return () => {
        localImages.forEach((img) => {
          if (img.preview && img.preview.startsWith('blob:')) {
            URL.revokeObjectURL(img.preview);
          }
        });
      };
    }, []);

    useEffect(() => {
      // ✅ Only update if images actually changed
      const currentIds = localImages.map(img => img.id).join(',');
      const newIds = initialImages.map(img => img.id).join(',');
      if (currentIds !== newIds) {
        setLocalImages(initialImages);
      }
    }, [initialImages]);

    useEffect(() => {
      onImagesChange?.(localImages);
    }, [localImages, onImagesChange]);

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
        const newPrimary: ProductImage = {
          file: compressed,
          preview,
          isPrimary: true,
          id: crypto.randomUUID(),
          status: "pending",
        };
        const filtered = localImages.filter((img) => !img.isPrimary);
        setLocalImages([newPrimary, ...filtered]);
        onError?.("");
      } catch (err) {
        onError?.("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const handleAdditionalSelection = async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentAdditionalCount = localImages.filter(
        (img) => !img.isPrimary,
      ).length;
      const remainingSlots = 5 - currentAdditionalCount;
      if (fileArray.length > remainingSlots) {
        onError?.(`You can only add ${remainingSlots} more image(s).`);
        return;
      }

      setIsProcessing(true);
      const newImages: ProductImage[] = [];
      const hasPrimary = localImages.some((img) => img.isPrimary);

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          if (file.size > 8 * 1024 * 1024) {
            onError?.(`${file.name} exceeds 8MB. Skipped.`);
            continue;
          }

          const compressed = await compressFile(file);
          const preview = URL.createObjectURL(compressed);

          const isPrimary =
            !hasPrimary && newImages.length === 0 && localImages.length === 0;

          newImages.push({
            file: compressed,
            preview,
            isPrimary,
            id: crypto.randomUUID(),
            status: "pending",
          });

          if (i < fileArray.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        setLocalImages((prev) => [...prev, ...newImages]);
        onError?.("");
      } catch (err) {
        onError?.("Failed to process some images. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const removeImage = (id: string) => {
      const img = localImages.find((i) => i.id === id);
      if (img?.preview && img.preview.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview);
      }
      setLocalImages((prev) => prev.filter((i) => i.id !== id));
      onError?.("");
    };

    const setAsPrimary = (id: string) => {
      const img = localImages.find((i) => i.id === id);
      if (!img) {
        onError?.("Image not found.");
        return;
      }

      if (img.isPrimary) {
        onError?.("This image is already the primary image.");
        return;
      }

      setLocalImages((prev) =>
        prev.map((i) => ({
          ...i,
          isPrimary: i.id === id,
        })),
      );

      onSuccess?.(
        "⭐ Primary image updated! It will be saved with the product.",
      );
      onError?.("");
    };

    const clearFailedPrimary = () => {
      setLocalImages((prev) => {
        const failedPrimary = prev.find((img) => img.isPrimary && img.status === "failed");
        if (failedPrimary?.preview && failedPrimary.preview.startsWith('blob:')) {
          URL.revokeObjectURL(failedPrimary.preview);
        }

        return prev
          .filter((img) => !(img.isPrimary && img.status === "failed"))
          .map((img) => ({
            ...img,
            status: "pending",
            serverId: undefined,
          }));
      });
    };

    const getImages = () => localImages;

    const resetImages = () => {
      localImages.forEach((img) => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setLocalImages([]);
    };

    const uploadImages = async (productId: number) => {
      const pendingImages = localImages.filter(
        (img) => img.status !== "success",
      );
      
      if (pendingImages.length === 0) {
        return {
          success: true,
          failedCount: 0,
          failedIds: [],
          primarySucceeded: true,
        };
      }

      const newFailedIds: string[] = [];
      let primarySucceeded = false;

      for (let i = 0; i < pendingImages.length; i++) {
        const img = pendingImages[i];
        
        setLocalImages((prev) =>
          prev.map((p) =>
            p.id === img.id ? { ...p, status: "uploading" } : p,
          ),
        );

        onUploadProgress?.(i + 1, pendingImages.length);

        try {
          const formData = new FormData();
          formData.append("image", img.file);
          formData.append("isPrimary", String(img.isPrimary));

          const res = await fetch(
            `/api/shopowner/products/${productId}/images`,
            {
              method: "POST",
              body: formData,
            },
          );

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          setLocalImages((prev) =>
            prev.map((p) =>
              p.id === img.id
                ? { ...p, status: "success", serverId: data.image_id }
                : p,
            ),
          );

          if (img.isPrimary) {
            primarySucceeded = true;
          }
        } catch (err) {
          setLocalImages((prev) =>
            prev.map((p) => (p.id === img.id ? { ...p, status: "failed" } : p)),
          );
          newFailedIds.push(img.id);
        }
      }

      const primary = localImages.find((img) => img.isPrimary);
      if (primary && primary.status === "success") {
        primarySucceeded = true;
      }

      return {
        success: newFailedIds.length === 0,
        failedCount: newFailedIds.length,
        failedIds: newFailedIds,
        primarySucceeded,
      };
    };

    useImperativeHandle(ref, () => ({
      uploadImages,
      clearFailedPrimary,
      getImages,
      resetImages,
    }));

    const primaryImage = localImages.find((img) => img.isPrimary);
    const additionalImages = localImages.filter((img) => !img.isPrimary);
    const hasValidPrimary = primaryImage && primaryImage.status !== "failed";
    const hasFailedImages = localImages.some((img) => img.status === "failed");

    const StatusIcon = ({ status }: { status?: string }) => {
      if (status === "uploading")
        return (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        );
      if (status === "success")
        return <div className="w-4 h-4 bg-green-500 rounded-full shadow-md" />;
      if (status === "failed")
        return <X className="w-4 h-4 text-red-500 bg-white rounded-full" />;
      return null;
    };

    return (
      <div className="md:space-y-6 space-y-8 bg-white md:p-6 rounded-lg">
        <div className="text-xl font-semibold text-black">Product Images</div>

        {hasFailedImages && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Some images failed to upload
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please remove the failed images and re-add them.
              </p>
            </div>
          </div>
        )}

        <InstructionsList
          items={[
            { text: "Maximum 6 images total" },
            { text: "Images are compressed to ~200KB automatically" },
            { text: "HEIC/HEIF images are uploaded in original format" },
            { text: "The first image added becomes the primary image" },
            {
              text: "Click the star icon on any image to make it primary (local only)",
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
            <div className="relative w-40 h-40 border rounded-lg overflow-hidden bg-gray-100">
              {primaryImage.preview && primaryImage.preview.startsWith('blob:') ? (
                <Image
                  src={primaryImage.preview}
                  alt="Primary"
                  fill
                  className="object-cover"
                  onError={() => {
                    // If image fails to load, remove it
                    removeImage(primaryImage.id);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-sm text-gray-400">Invalid image</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => removeImage(primaryImage.id)}
                  className="bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
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
              {primaryImage.status === "failed" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full">
                    Upload Failed
                  </div>
                </div>
              )}
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

        {/* Additional Images */}
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
                {image.preview && image.preview.startsWith('blob:') ? (
                  <Image
                    src={image.preview}
                    alt="Additional"
                    fill
                    className="object-cover"
                    onError={() => {
                      removeImage(image.id);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-sm text-gray-400">Invalid</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {hasValidPrimary && image.status !== "failed" && (
                    <button
                      onClick={() => setAsPrimary(image.id)}
                      className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md hover:bg-yellow-600 transition-colors"
                      title="Make primary (local only)"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
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
                {image.status === "failed" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Failed
                    </div>
                  </div>
                )}
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

ImagesForm.displayName = "ImagesForm";
export default ImagesForm;