"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Camera, Image as ImageIcon, Star, Trash2, X, RefreshCw } from "lucide-react";
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
  uploadImages: (productId: number) => Promise<{ success: boolean; failedCount: number }>;
}

interface ImagesFormProps {
  initialImages?: ProductImage[];        // for edit mode
  onImagesChange?: (images: ProductImage[]) => void;
  onError?: (message: string) => void;
}

const ImagesForm = forwardRef<ImagesFormRef, ImagesFormProps>(
  ({ initialImages = [], onImagesChange, onError }, ref) => {
    const [localImages, setLocalImages] = useState<ProductImage[]>(initialImages);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [showRetryModal, setShowRetryModal] = useState(false);
    const [failedImageIds, setFailedImageIds] = useState<string[]>([]);

    // Notify parent of changes (only on user actions)
    useEffect(() => {
      onImagesChange?.(localImages);
    }, [localImages, onImagesChange]);

    // Compression options
    const compressionOptions = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      initialQuality: 0.7,
    };

    const compressFile = async (file: File): Promise<File> => {
      try {
        return await imageCompression(file, compressionOptions);
      } catch (err) {
        console.error("Compression failed, using original", err);
        return file;
      }
    };

    const handlePrimarySelection = async (file: File) => {
      if (file.size > 8 * 1024 * 1024) {
        onError?.("Image exceeds 8MB. Please choose a smaller one.");
        return;
      }
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
    };

    const handleAdditionalSelection = async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentAdditionalCount = localImages.filter((img) => !img.isPrimary).length;
      const remainingSlots = 5 - currentAdditionalCount;
      if (fileArray.length > remainingSlots) {
        onError?.(`You can only add ${remainingSlots} more image(s).`);
        return;
      }
      const newImages: ProductImage[] = [];
      for (const file of fileArray) {
        if (file.size > 8 * 1024 * 1024) {
          onError?.(`${file.name} exceeds 8MB. Skipped.`);
          continue;
        }
        const compressed = await compressFile(file);
        const preview = URL.createObjectURL(compressed);
        newImages.push({
          file: compressed,
          preview,
          isPrimary: false,
          id: crypto.randomUUID(),
          status: "pending",
        });
      }
      setLocalImages([...localImages, ...newImages]);
    };

    const removeImage = (id: string) => {
      const img = localImages.find((i) => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      setLocalImages(localImages.filter((i) => i.id !== id));
      onError?.("");
    };

    const setAsPrimary = (id: string) => {
      setLocalImages(
        localImages.map((img) => ({
          ...img,
          isPrimary: img.id === id,
        }))
      );
    };

    // Exposed method for parent to call after product creation
    const uploadImages = async (productId: number) => {
      const pendingImages = localImages.filter((img) => img.status !== "success");
      if (pendingImages.length === 0) {
        return { success: true, failedCount: 0 };
      }

      setIsUploading(true);
      setFailedImageIds([]);
      const newFailedIds: string[] = [];

      for (let i = 0; i < pendingImages.length; i++) {
        const img = pendingImages[i];
        setLocalImages((prev) =>
          prev.map((p) => (p.id === img.id ? { ...p, status: "uploading" } : p))
        );
        setUploadProgress({ current: i + 1, total: pendingImages.length });

        try {
          const formData = new FormData();
          formData.append("image", img.file);
          formData.append("isPrimary", String(img.isPrimary));

          const res = await fetch(`/api/shopowner/products/${productId}/images`, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          setLocalImages((prev) =>
            prev.map((p) =>
              p.id === img.id
                ? { ...p, status: "success", serverId: data.image_id }
                : p
            )
          );
        } catch (err) {
          console.error(`Failed to upload ${img.id}`, err);
          setLocalImages((prev) =>
            prev.map((p) => (p.id === img.id ? { ...p, status: "failed" } : p))
          );
          newFailedIds.push(img.id);
        }
      }

      setUploadProgress({ current: 0, total: 0 });
      setIsUploading(false);

      if (newFailedIds.length > 0) {
        setFailedImageIds(newFailedIds);
        setShowRetryModal(true);
        return { success: false, failedCount: newFailedIds.length };
      }
      return { success: true, failedCount: 0 };
    };

    useImperativeHandle(ref, () => ({ uploadImages }));

    const primaryImage = localImages.find((img) => img.isPrimary);
    const additionalImages = localImages.filter((img) => !img.isPrimary);

    const StatusIcon = ({ status }: { status?: string }) => {
      if (status === "uploading")
        return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
      if (status === "success")
        return <div className="w-4 h-4 bg-green-500 rounded-full shadow-md" />;
      if (status === "failed")
        return <X className="w-4 h-4 text-red-500 bg-white rounded-full" />;
      return null;
    };

    return (
      <div className="md:space-y-6 space-y-8 bg-white md:p-6 rounded-lg">
        <div className="text-xl font-semibold text-black">Product Images</div>

        <InstructionsList
          items={[
            { text: "Maximum 6 images total" },
            { text: "Images are automatically resized to 1000px and compressed to ~150KB" },
            { text: "Max file size: 8MB (compressed before upload)" },
            { text: "Primary image is the default image." },
            { text: "Click the star icon on any image to make it primary" },
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
              <Image src={primaryImage.preview} alt="Primary" fill className="object-cover" />
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
                onChange={(e) => { if (e.target.files?.[0]) handlePrimarySelection(e.target.files[0]); e.target.value = ""; }}
                className="hidden"
                id="primary-camera"
              />
              <label htmlFor="primary-camera"  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer flex flex-col items-center">
                <Camera className="w-8 h-8 text-gray-600" />
                <span className="text-xs text-black mt-1">Take Photo</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { if (e.target.files?.[0]) handlePrimarySelection(e.target.files[0]); e.target.value = ""; }}
                className="hidden"
                id="primary-gallery"
              />
              <label htmlFor="primary-gallery" className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer flex flex-col items-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-black mt-1">Gallery</span>
              </label>
            </div>
          )}
        </div>

        {/* Additional Images */}
        <div className="space-y-2">
          <label className="block md:text-sm text-[16px] font-medium text-gray-700">
            Additional Images ({additionalImages.length}/5)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {additionalImages.map((image) => (
              <div key={image.id} className="relative aspect-square border rounded-lg overflow-hidden bg-gray-100">
                <Image src={image.preview} alt="Additional" fill className="object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button onClick={() => setAsPrimary(image.id)} className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md">
                    <Star className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeImage(image.id)} className="bg-red-500 text-white p-1.5 rounded-full shadow-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-0.5">
                  <StatusIcon status={image.status} />
                </div>
              </div>
            ))}
            {additionalImages.length < 5 && !isUploading && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple={false}
                  onChange={(e) => { if (e.target.files) handleAdditionalSelection(e.target.files); e.target.value = ""; }}
                  className="hidden"
                  id="additional-camera"
                />
                <label htmlFor="additional-camera" className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-600" />
                  <span className="text-xs text-black mt-1">Camera</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => { if (e.target.files) handleAdditionalSelection(e.target.files); e.target.value = ""; }}
                  className="hidden"
                  id="additional-gallery"
                />
                <label htmlFor="additional-gallery" className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer">
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                  <span className="text-xs text-black mt-1">Gallery</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Progress bar – only shown during upload (triggered by parent) */}
        {isUploading && (
          <div className="space-y-1 mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-magenta-dark h-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Uploading images {uploadProgress.current} of {uploadProgress.total}
            </p>
          </div>
        )}

        {/* Simple modal to inform about failed uploads */}
        {showRetryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Upload Incomplete</h3>
              <p className="text-gray-600 mb-4">
                {failedImageIds.length} image(s) failed to upload. Please save the product again to retry.
              </p>
              <div className="flex justify-end">
                <button onClick={() => setShowRetryModal(false)} className="px-4 py-2 bg-magenta-dark text-white rounded-lg">
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ImagesForm.displayName = "ImagesForm";

export default ImagesForm;