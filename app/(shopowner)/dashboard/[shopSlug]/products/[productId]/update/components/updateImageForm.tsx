"use client";

import { useState, useEffect, useImperativeHandle, forwardRef, useRef, useCallback } from "react";
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
import { ProductImage } from "../../../add/types";

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
  initialImages?: ProductImage[];
  onImagesChange?: (images: ProductImage[]) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onUploadProgress?: (current: number, total: number) => void;
}

const COMPRESSION_TIMEOUT_MS = 12000;

const UpdateImagesForm = forwardRef<UpdateImagesFormRef, UpdateImagesFormProps>(
  ({ 
    productId,
    initialImages = [], 
    onImagesChange, 
    onError, 
    onSuccess,
    onUploadProgress,
  }, ref) => {
    const [localImages, setLocalImages] = useState<ProductImage[]>(initialImages);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const hasLoadedRef = useRef(false);
    const loadingAttemptedRef = useRef(false);
    const isMountedRef = useRef(true);

    // ✅ Clean up blob URLs on unmount
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
        localImages.forEach((img) => {
          if (img.preview && img.preview.startsWith('blob:')) {
            URL.revokeObjectURL(img.preview);
          }
        });
      };
    }, []);

    // ✅ Helper to safely get image ID as string
    const getImageId = (img: ProductImage): string => {
      return img.id !== undefined && img.id !== null ? String(img.id) : `img-${Math.random().toString(36).substr(2, 9)}`;
    };

    // ✅ Only use initialImages as initial state - don't sync after
    useEffect(() => {
      if (initialImages.length > 0 && !hasLoadedRef.current) {
        console.log('📸 initialImages changed, setting localImages:', initialImages.length);
        setLocalImages(initialImages);
      }
    }, [initialImages]);

    // ✅ Notify parent about changes (both initial and user-initiated)
    const notifyParent = useCallback((images: ProductImage[]) => {
      console.log('📸 notifyParent called with:', images.length);
      console.log('📸 onImagesChange exists?', !!onImagesChange);
      if (onImagesChange) {
        onImagesChange(images);
        console.log('📸 onImagesChange called successfully');
      } else {
        console.warn('⚠️ onImagesChange is undefined!');
      }
    }, [onImagesChange]);

    const loadImages = async () => {
      if (hasLoadedRef.current || loadingAttemptedRef.current) {
        console.log('📸 loadImages skipped - already loaded or attempted');
        setIsLoading(false);
        return;
      }

      loadingAttemptedRef.current = true;
      setIsLoading(true);

      try {
        console.log('📸 Fetching images for product:', productId);
        const res = await fetch(`/api/shopowner/products/${productId}/images/primary?mode=all`);
        if (!res.ok) throw new Error('Failed to load images');

        const data = await res.json();
        console.log('📸 API returned images:', data.length);

        const serverImages: ProductImage[] = data.map((img: any) => ({
          id: `server-${img.image_id}`,
          serverId: img.image_id,
          preview: `/api/shopowner/products/${productId}/images/primary?imageId=${img.image_id}&w=200`,
          isPrimary: img.is_primary === 1,
          status: "success",
        }));

        console.log('📸 Processed server images:', serverImages.length);

        setLocalImages(serverImages);
        hasLoadedRef.current = true;
        
        console.log('📸 Notifying parent with images:', serverImages.length);
        if (onImagesChange) {
          onImagesChange(serverImages);
          console.log('📸 Parent notified successfully');
        } else {
          console.warn('⚠️ onImagesChange is undefined!');
        }
        
      } catch (error) {
        console.error('Failed to load images:', error);
        onError?.('Failed to load existing images');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
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
        
        // ✅ Find the old primary image
        const oldPrimary = localImages.find(img => img.isPrimary);
        
        // ✅ Mark old primary for deletion if it exists and has a serverId
        let updatedImages = localImages.map(img => {
          if (img.isPrimary && img.serverId) {
            return { ...img, isPrimary: false, status: "deleted" as const };
          }
          return { ...img, isPrimary: false };
        });
        
        // ✅ Remove old primary if it was a pending image (not uploaded yet)
        if (oldPrimary && oldPrimary.status === "pending") {
          updatedImages = updatedImages.filter(img => img.id !== oldPrimary.id);
        }
        
        const newPrimary: ProductImage = {
          file: compressed,
          preview,
          isPrimary: true,
          id: `new-${Date.now()}`,
          status: "pending",
        };
        
        setLocalImages([newPrimary, ...updatedImages]);
        notifyParent([newPrimary, ...updatedImages]);
        onError?.("");
      } catch (err) {
        onError?.("Failed to process image. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const handleAdditionalSelection = async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      
      // ✅ Count only visible images (not deleted or failed)
      const visibleImages = localImages.filter(
        (img) => img.status !== "deleted" && img.status !== "failed"
      );
      const currentAdditionalCount = visibleImages.filter(
        (img) => !img.isPrimary
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

          const isPrimary = !hasPrimary && newImages.length === 0 && 
            !localImages.some(img => img.isPrimary);

          newImages.push({
            file: compressed,
            preview,
            isPrimary,
            id: `new-${Date.now()}-${i}`,
            status: "pending",
          });

          if (i < fileArray.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        // ✅ Remove failed images before adding new ones (clean state)
        const cleanedImages = localImages.filter(img => img.status !== "failed");
        const updatedImages = [...cleanedImages, ...newImages];
        setLocalImages(updatedImages);
        notifyParent(updatedImages);
        onError?.("");
      } catch (err) {
        onError?.("Failed to process some images. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const removeImage = (id: string) => {
      const img = localImages.find((i) => getImageId(i) === id);
      if (!img) return;

      // ✅ Clean up blob URL if it's a new image
      if (img.preview && img.preview.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview);
      }

      let updatedImages: ProductImage[];

      // ✅ If it's an existing image from server, mark as deleted
      if (img.serverId && (img.status === "success" || img.status === "failed")) {
        updatedImages = localImages.map((i) =>
          getImageId(i) === id ? { ...i, status: "deleted" as const } : i
        );
      } else {
        // If it's a new image (pending), just remove it
        updatedImages = localImages.filter((i) => getImageId(i) !== id);
      }
      
      setLocalImages(updatedImages);
      notifyParent(updatedImages);
      onError?.("");
    };

    const setAsPrimary = (id: string) => {
      const img = localImages.find((i) => getImageId(i) === id);
      if (!img) {
        onError?.("Image not found.");
        return;
      }

      if (img.isPrimary) {
        onError?.("This image is already the primary image.");
        return;
      }

      const updatedImages = localImages.map((i) => ({
        ...i,
        isPrimary: getImageId(i) === id,
      }));
      
      setLocalImages(updatedImages);
      notifyParent(updatedImages);
      onSuccess?.("⭐ Primary image updated! It will be saved with the product.");
      onError?.("");
    };

    const getImages = () => localImages;

    const resetImages = () => {
      localImages.forEach((img) => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setLocalImages([]);
      onImagesChange?.([]);
      hasLoadedRef.current = false;
      loadingAttemptedRef.current = false;
    };

   const saveImages = async (productIdNum: number) => {
  console.log('📸 saveImages called for product:', productIdNum);
  console.log('📸 Current localImages:', localImages.map(i => ({ 
    id: i.id, 
    status: i.status, 
    isPrimary: i.isPrimary, 
    serverId: i.serverId 
  })));

  // ✅ Find images marked for deletion
  const imagesToDelete = localImages.filter(
    (img) => img.status === "deleted" && img.serverId
  );
  
  console.log('📸 Images to delete:', imagesToDelete.length);

  // ✅ Delete marked images
  for (const img of imagesToDelete) {
    console.log('📸 Deleting image:', img.serverId);
    try {
      const res = await fetch(
        `/api/shopowner/products/${productIdNum}/images?imageId=${img.serverId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        console.error('❌ Failed to delete image:', img.serverId);
      } else {
        console.log('✅ Image deleted:', img.serverId);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  // ✅ Upload new images (pending)
  const imagesToUpload = localImages.filter(
    (img) => img.status === "pending"
  );

  console.log('📸 Images to upload:', imagesToUpload.length);

  const existingCount = localImages.filter(img => img.status === "success" && img.serverId).length;
  const pendingCount = imagesToUpload.length;
  const totalAfterUpload = existingCount + pendingCount;
  
  console.log('📸 Existing images:', existingCount);
  console.log('📸 Pending images:', pendingCount);
  console.log('📸 Total after upload:', totalAfterUpload);

  if (imagesToUpload.length === 0 && imagesToDelete.length === 0) {
    console.log('📸 No images to upload or delete');
    // ✅ Even if no uploads, we might need to update primary
    // (if user changed primary from one existing to another)
    const primaryImage = localImages.find((img) => img.isPrimary);
    if (primaryImage?.serverId) {
      console.log('📸 Checking if primary needs updating (no new uploads)');
      // We'll handle this in the PATCH section below
    }
    // Continue to PATCH section
  }

  if (totalAfterUpload > 6) {
    console.error('❌ Would exceed 6 image limit');
    onError?.(`Cannot add ${pendingCount} images. Maximum 6 images per product.`);
    return {
      success: false,
      failedCount: pendingCount,
      failedIds: imagesToUpload.map(img => getImageId(img)),
      primarySucceeded: false,
    };
  }

  const failedIds: string[] = [];
  let newPrimaryServerId: number | undefined;

  // ✅ Upload pending images
  for (let i = 0; i < imagesToUpload.length; i++) {
    const img = imagesToUpload[i];
    const imgId = getImageId(img);
    
    console.log('📸 Uploading image:', imgId, 'isPrimary:', img.isPrimary);
    
    setLocalImages((prev) =>
      prev.map((p) =>
        getImageId(p) === imgId ? { ...p, status: "uploading" } : p,
      )
    );

    onUploadProgress?.(i + 1, imagesToUpload.length);

    try {
      const formData = new FormData();
      formData.append("image", img.file!);
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

      console.log('✅ Image uploaded successfully:', data.image_id);

      // ✅ Update local state with the new serverId
      setLocalImages((prev) =>
        prev.map((p) =>
          getImageId(p) === imgId
            ? { ...p, status: "success", serverId: data.image_id }
            : p,
        )
      );

      // ✅ Store the image ID if it's the primary
      if (img.isPrimary) {
        newPrimaryServerId = data.image_id;
        console.log('📸 New primary image uploaded with ID:', newPrimaryServerId);
      }
    } catch (err) {
      console.error('❌ Upload failed for image:', imgId, err);
      setLocalImages((prev) =>
        prev.map((p) => (getImageId(p) === imgId ? { ...p, status: "failed" } : p))
      );
      failedIds.push(imgId);
      onError?.(`Failed to upload ${img.isPrimary ? 'primary' : 'additional'} image.`);
    }
  }

  // ✅ AFTER all uploads complete, get the updated localImages
  const updatedLocalImages = localImages;
  
  // ✅ Find the primary image - could be newly uploaded OR existing
  const primaryImage = updatedLocalImages.find((img) => img.isPrimary);
  
  // ✅ Determine the serverId to use for PATCH
  // Priority: 
  // 1. If primary image was just uploaded, use newPrimaryServerId
  // 2. If primary image already existed, use its serverId
  // 3. If primary image is a pending upload that failed, skip
  let primaryServerId = primaryImage?.serverId || newPrimaryServerId;
  
  console.log('📸 Primary image found:', primaryImage?.id, 'serverId:', primaryServerId, 'status:', primaryImage?.status);
  
  // ✅ Call PATCH to set the primary image
  if (primaryServerId) {
    console.log('📸 Calling PATCH to set primary image:', primaryServerId);
    try {
      const res = await fetch(
        `/api/shopowner/products/${productIdNum}/images/primary`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: primaryServerId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error('❌ Failed to set primary:', data);
        onError?.(data.error || 'Failed to set primary image');
      } else {
        console.log('✅ Primary image set successfully:', data);
        onSuccess?.('Primary image updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error setting primary:', error);
      onError?.('Failed to set primary image');
    }
  } else {
    console.log('📸 No primary image found with serverId');
    // ✅ Check if there's a primary that was already set (shouldn't happen, but just in case)
    const existingPrimary = updatedLocalImages.find(
      (img) => img.isPrimary && (img.status === "success")
    );
    if (existingPrimary) {
      console.log('📸 Existing primary found (no PATCH needed):', existingPrimary.id);
    } else {
      console.warn('⚠️ No primary image found!');
      onError?.('No primary image set');
    }
  }

  const isSuccess = failedIds.length === 0;
  console.log('📸 saveImages complete. Success:', isSuccess, 'Primary set:', !!primaryServerId);
  
  return {
    success: isSuccess,
    failedCount: failedIds.length,
    failedIds,
    primarySucceeded: !!primaryServerId,
  };
};

    useImperativeHandle(ref, () => ({
      saveImages,
      getImages,
      resetImages,
      loadImages,
    }));

    // ✅ Filter out deleted images from display
    const visibleImages = localImages.filter(img => img.status !== "deleted");
    const primaryImage = visibleImages.find((img) => img.isPrimary);
    const additionalImages = visibleImages.filter((img) => !img.isPrimary);
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
      if (status === "pending")
        return <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-md" />;
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

        {hasFailedImages && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Some images failed to upload
              </p>
              <p className="text-sm text-red-600 mt-1">
                Click the remove button (trash icon) on failed images to delete them, then re-upload a new image.
              </p>
            </div>
          </div>
        )}

        <InstructionsList
          items={[
            { text: "Maximum 6 images total" },
            { text: "Images are compressed to ~200KB automatically" },
            { text: "HEIC/HEIF images are uploaded in original format" },
            { text: "Click the star icon on any image to make it primary" },
            { text: "Remove a failed image and re-upload a fresh one" },
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
              {primaryImage.preview && (
                <Image
                  src={primaryImage.preview}
                  alt="Primary"
                  fill
                  className="object-cover"
                  unoptimized={true}
                  onError={() => {
                    if (primaryImage.preview.startsWith('blob:')) {
                      removeImage(getImageId(primaryImage));
                    }
                  }}
                />
              )}
              <div className="absolute top-2 right-2 flex gap-1 z-10">
                <button
                  onClick={() => removeImage(getImageId(primaryImage))}
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
                  <span className="text-white text-xs px-3 py-1 rounded-full bg-red-500">
                    Upload Failed - Click trash to remove
                  </span>
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
            Additional Images ({additionalImages.filter(img => img.status !== "failed").length}/5)
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

            {additionalImages.map((image) => {
              const imageId = getImageId(image);
              const isFailed = image.status === "failed";
              return (
                <div
                  key={imageId}
                  className="relative aspect-square border rounded-lg overflow-hidden bg-gray-100"
                >
                  {image.preview && (
                    <Image
                      src={image.preview}
                      alt="Additional"
                      fill
                      className="object-cover"
                      unoptimized={true}
                      onError={() => {
                        if (image.preview.startsWith('blob:')) {
                          removeImage(imageId);
                        }
                      }}
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    {!isFailed && hasValidPrimary && image.status !== "failed" && (
                      <button
                        onClick={() => setAsPrimary(imageId)}
                        className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md hover:bg-yellow-600 transition-colors"
                        title="Make primary"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(imageId)}
                      className="bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-0.5">
                    <StatusIcon status={image.status} />
                  </div>
                  {isFailed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-white text-xs px-3 py-1 rounded-full bg-red-500">
                        Failed - Click trash to remove
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {additionalImages.filter(img => img.status !== "failed").length < 5 && !isProcessing && (
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