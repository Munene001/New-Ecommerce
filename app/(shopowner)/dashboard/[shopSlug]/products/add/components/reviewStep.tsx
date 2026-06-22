"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import { ProductFormData, Attribute } from "../types";
import { Loader2 } from "lucide-react";

interface ReviewStepProps {
  formData: ProductFormData;
  completion: {
    percentage: number;
    completedSteps: number;
    totalSteps: number;
    steps: {
      basicInfo: { completed: boolean; items: string[] };
      pricing: { completed: boolean; items: string[] };
      images: { completed: boolean; items: string[] };
      categories: { completed: boolean; items: string[] };
      review: { completed: boolean; items: string[] };
    };
    canPublish: boolean;
  };
  attributeSchema: Attribute[];
  onPublish: () => void;
  isPublishing: boolean;
}

export default function ReviewStep({
  formData,
  completion,
  attributeSchema,
  onPublish,
  isPublishing,
}: ReviewStepProps) {
  const primaryImage = formData.images.find((img) => img.isPrimary);
  const additionalImages = formData.images.filter((img) => !img.isPrimary);

  // ✅ Derived state from formData - NO local upload state
  const totalImages = formData.images.length;
  const uploadedImages = formData.images.filter(img => img.status === "success").length;
  const failedImages = formData.images.filter(img => img.status === "failed");
  const isUploading = formData.images.some(img => img.status === "uploading");

  const getStepIcon = (completed: boolean) => {
    return completed ? (
      <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-500 flex-shrink-0" />
    ) : (
      <Icon icon="mdi:alert-circle" className="w-5 h-5 text-orange-400 flex-shrink-0" />
    );
  };

  const getStepStatusColor = (completed: boolean) => {
    return completed ? "text-green-700" : "text-orange-600";
  };

  // ✅ Simple - just call the parent handler, no local state
  const handlePublish = () => {
    onPublish();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review & Publish</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your product details before publishing
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-xl p-4 border-2 ${
          completion.canPublish
            ? "bg-green-50 border-green-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {completion.canPublish ? (
            <Icon icon="mdi:check-circle" className="w-6 h-6 text-green-500" />
          ) : (
            <Icon icon="mdi:alert" className="w-6 h-6 text-orange-500" />
          )}
          <div>
            <p
              className={`font-medium ${
                completion.canPublish ? "text-green-700" : "text-orange-700"
              }`}
            >
              {completion.canPublish
                ? "✅ Product is ready to publish!"
                : "⚠️ Some items need attention before publishing"}
            </p>
            <p className="text-sm text-gray-500">
              {completion.canPublish
                ? "All required fields are complete. Click 'Publish' to make it live."
                : `${completion.completedSteps} of ${completion.totalSteps} steps complete (${completion.percentage}%)`}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            {getStepIcon(completion.steps.basicInfo.completed)}
            <span
              className={`font-medium ${getStepStatusColor(
                completion.steps.basicInfo.completed
              )}`}
            >
              Basic Information
            </span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            {completion.steps.basicInfo.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <Icon icon="mdi:check" className="w-3 h-3 text-green-500" />
                {item}
              </li>
            ))}
            {completion.steps.basicInfo.items.length === 0 && (
              <li className="text-gray-400 italic">No fields filled</li>
            )}
          </ul>
        </div>

        {/* Step 2: Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            {getStepIcon(completion.steps.pricing.completed)}
            <span
              className={`font-medium ${getStepStatusColor(
                completion.steps.pricing.completed
              )}`}
            >
              Pricing & Inventory
            </span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            {completion.steps.pricing.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <Icon icon="mdi:check" className="w-3 h-3 text-green-500" />
                {item}
              </li>
            ))}
            {completion.steps.pricing.items.length === 0 && (
              <li className="text-gray-400 italic">No pricing set</li>
            )}
          </ul>
        </div>

        {/* Step 3: Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            {getStepIcon(completion.steps.images.completed)}
            <span
              className={`font-medium ${getStepStatusColor(
                completion.steps.images.completed
              )}`}
            >
              Images
            </span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            {completion.steps.images.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <Icon icon="mdi:check" className="w-3 h-3 text-green-500" />
                {item}
              </li>
            ))}
            {completion.steps.images.items.length === 0 && (
              <li className="text-gray-400 italic">No images uploaded</li>
            )}
          </ul>
        </div>

        {/* Step 4: Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            {getStepIcon(completion.steps.categories.completed)}
            <span
              className={`font-medium ${getStepStatusColor(
                completion.steps.categories.completed
              )}`}
            >
              Categories
            </span>
          </div>
          <ul className="space-y-1 text-sm text-gray-600">
            {completion.steps.categories.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <Icon icon="mdi:check" className="w-3 h-3 text-green-500" />
                {item}
              </li>
            ))}
            {completion.steps.categories.items.length === 0 && (
              <li className="text-gray-400 italic">No categories selected</li>
            )}
          </ul>
        </div>
      </div>

      {/* Product Summary */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Icon icon="mdi:clipboard-text" className="w-4 h-4 text-orange-500" />
          Product Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name</span>
            <p className="font-medium text-gray-800">
              {formData.productName || "Not set"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Slug</span>
            <p className="font-medium text-gray-800">
              {formData.productSlug || "Not set"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Type</span>
            <p className="font-medium text-gray-800 capitalize">
              {formData.productType || "Not set"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Status</span>
            <p className="font-medium text-gray-800 capitalize">
              {formData.status || "draft"}
            </p>
          </div>

          {formData.productType === "simple" ? (
            <>
              <div>
                <span className="text-gray-400">Price</span>
                <p className="font-medium text-gray-800">
                  {formData.price ? `KES ${formData.price}` : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Discount</span>
                <p className="font-medium text-gray-800">
                  {formData.discountPrice ? `KES ${formData.discountPrice}` : "None"}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Stock</span>
                <p className="font-medium text-gray-800">
                  {formData.stockQuantity ?? "Not set"}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-400">Variants</span>
                <p className="font-medium text-gray-800">
                  {formData.variants.length} variations
                </p>
              </div>
              <div>
                <span className="text-gray-400">Price Range</span>
                <p className="font-medium text-gray-800">
                  {formData.variants.length > 0 ? (
                    `KES ${Math.min(...formData.variants.map(v => Number(v.price) || 0))} - KES ${Math.max(...formData.variants.map(v => Number(v.price) || 0))}`
                  ) : (
                    "No variants"
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Total Stock</span>
                <p className="font-medium text-gray-800">
                  {formData.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Varying Attributes</span>
                <p className="font-medium text-gray-800">
                  {formData.variants.length > 0 && formData.variants[0].attributes
                    ? Object.keys(formData.variants[0].attributes).join(", ") || "None"
                    : "None"}
                </p>
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <span className="text-gray-400">Description</span>
            <p className="font-medium text-gray-800">
              {formData.description || "No description"}
            </p>
          </div>

          <div className="md:col-span-2">
            <span className="text-gray-400">Attributes</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(formData.attributes)
                .filter(([_, value]) => value && value.toString().trim() !== "")
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              {Object.entries(formData.attributes).filter(([_, value]) => value && value.toString().trim() !== "")
                .length === 0 && (
                <span className="text-gray-400 text-sm">No attributes set</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Images Display with Upload Progress - derived from formData */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Icon icon="mdi:image" className="w-4 h-4 text-orange-500" />
          Product Images ({formData.images.length})
        </h3>

        {/* ✅ Upload progress derived from image statuses */}
        {isUploading && (
          <div className="space-y-2 bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Uploading Images
              </span>
              <span className="text-sm text-gray-500">
                {uploadedImages} of {totalImages}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-orange-500 h-full transition-all duration-300 ease-in-out"
                style={{ width: `${totalImages > 0 ? (uploadedImages / totalImages) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {uploadedImages === totalImages 
                ? "Finalizing upload..." 
                : `Uploading image ${uploadedImages + 1} of ${totalImages}`}
            </p>
          </div>
        )}

        {formData.images.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No images uploaded</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Primary Image */}
            {primaryImage && (
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-orange-400">
                <Image
                  src={primaryImage.preview}
                  alt="Primary"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 text-white text-xs text-center py-1 font-medium">
                  Primary
                </div>
                {primaryImage.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {primaryImage.status === "failed" && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                    <Icon icon="mdi:alert" className="w-6 h-6 text-white" />
                  </div>
                )}
                {primaryImage.status === "success" && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <Icon icon="mdi:check" className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            )}

            {/* Additional Images */}
            {additionalImages.map((img, index) => (
              <div
                key={img.id || index}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <Image
                  src={img.preview}
                  alt={`Product ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {img.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {img.status === "failed" && (
                  <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                    <Icon icon="mdi:alert" className="w-6 h-6 text-white" />
                  </div>
                )}
                {img.status === "success" && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <Icon icon="mdi:check" className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* Empty slots */}
            {formData.images.length === 0 && (
              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Icon icon="mdi:image-off" className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Upload Summary - derived from image statuses */}
        {!isUploading && (
          <div className="space-y-2">
            {failedImages.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">
                    {failedImages.length} image(s) failed to upload
                  </span>
                </div>
                <button 
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  onClick={() => {
                    // Retry logic would go here
                  }}
                >
                  Retry All
                </button>
              </div>
            )}
            
            {totalImages > 0 && 
             totalImages === uploadedImages && 
             failedImages.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">
                  All images uploaded successfully!
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Publish Button - State controlled by parent via props */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              {isUploading ? (
                "📤 Uploading images..."
              ) : completion.canPublish ? (
                "🎉 All set! Your product is ready to go live."
              ) : (
                "📝 Complete all required fields to publish"
              )}
            </p>
            <p className="text-sm text-gray-400">
              {isUploading ? (
                `Please wait while we upload your images (${uploadedImages}/${totalImages})`
              ) : completion.canPublish ? (
                "Click publish to make this product visible to customers."
              ) : (
                `${completion.completedSteps} of ${completion.totalSteps} steps complete`
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!completion.canPublish || isPublishing || isUploading}
            className={`px-8 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              completion.canPublish && !isPublishing && !isUploading
                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Uploading {uploadedImages}/{totalImages}
              </>
            ) : isPublishing ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Icon icon="mdi:rocket-launch" className="w-4 h-4" />
                Publish Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}