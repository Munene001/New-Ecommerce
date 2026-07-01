"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import BasicInfoForm from "./components/basicInfoForm";
import PricingForm from "./components/pricingForm";
import ImagesForm, {
  ImagesFormRef,
  ProductImage,
} from "./components/imagesForm";
import CategoryComponent from "./components/categoryComponent";
import ReviewStep from "./components/reviewStep";
import ResultModal from "./components/resultModal";
import { useProductForm } from "./hooks/useProductForm";
import Button from "@/app/components/ui/button";
import SimpleToast from "@/app/components/ui/simpleToast";

export default function AddProductPage() {
  const {
    activeIndex,
    setActiveIndex,
    sections,
    formData,
    setFormData,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    showCategoryForm,
    setShowCategoryForm,
    attributeSchema,
    variantAttributes,
    selectedVariantAttrs,
    toggleVariantAttribute,
    loadingSchema,
    loading,
    errors,
    setErrors,
    shopSlug,
    shopId,
    shopType,
    tabWarning,
    modalState,
    showWarning,
    handleSubmit,
    handlePublish,
    handleCategoryCreated,
    handleCategoryError,
    handleNext,
    handlePrevious,
    handleTabClick,
    closeModal,
    addCategory,
    removeCategory,
    resetForm,
    addVariant,
    removeVariant,
    updateVariant,
    canPublish,
    calculateCompletion,
    validateAllSteps,
  } = useProductForm();

  const imagesRef = useRef<ImagesFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imagesFormKey, setImagesFormKey] = useState(0);
  const [isAutoNavigating, setIsAutoNavigating] = useState(false);
  const [hasFailedImages, setHasFailedImages] = useState(false);

  const [toastState, setToastState] = useState<{
    type: "success" | "error";
    text: string;
  }>({
    type: "error",
    text: "",
  });

  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showSuccess = (message: string) => {
    setToastState({ type: "success", text: message });
    setTimeout(() => setToastState({ type: "error", text: "" }), 3000);
  };

  const showError = (message: string) => {
    setToastState({ type: "error", text: message });
    setTimeout(() => setToastState({ type: "error", text: "" }), 3000);
  };

  const completion = calculateCompletion();

  // ✅ Check for failed images without causing re-renders
  useEffect(() => {
    const failed = formData.images.some((img) => img.status === "failed");
    setHasFailedImages(failed);
  }, [formData.images]);

  useEffect(() => {
    if (isAutoNavigating) {
      const formContainer = document.querySelector(
        ".bg-white.rounded-lg.border",
      );
      if (formContainer) {
        setTimeout(() => {
          formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
      setIsAutoNavigating(false);
    }
  }, [activeIndex, isAutoNavigating]);

  // ✅ Stable callback - only updates when images actually change
  const handleImagesChange = useCallback(
    (newImages: ProductImage[]) => {
      setFormData((prev) => {
        // Deep compare by creating a stable key
        const prevKey = prev.images
          .map(
            (img: any) =>
              `${img.id}-${img.status}-${img.isPrimary}-${img.serverId || ""}`,
          )
          .join("|");

        const newKey = newImages
          .map(
            (img) =>
              `${img.id}-${img.status}-${img.isPrimary}-${img.serverId || ""}`,
          )
          .join("|");

        if (prevKey === newKey) return prev;

        return { ...prev, images: newImages as any };
      });
    },
    [setFormData],
  );

  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const result = await handleSubmit();

      if (!result.success || !result.productId) {
        setResultModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message:
            result.error ||
            "Failed to create product. Please check your inputs.",
        });
        setIsSaving(false);
        return;
      }

      const productId = result.productId;
      const uploadResult = await imagesRef.current?.uploadImages(productId);

      if (!uploadResult?.primarySucceeded) {
        try {
          await fetch(`/api/shopowner/products/${productId}`, {
            method: "DELETE",
          });
        } catch (deleteError) {
          console.error(
            "Failed to delete product after primary image failure:",
            deleteError,
          );
        }

        imagesRef.current?.clearFailedPrimary();

        setFormData((prev) => ({
          ...prev,
          images: prev.images.map((img) => ({
            ...img,
            status: "pending",
            serverId: undefined,
          })),
        }));

        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError(
          "Primary image upload failed. Please remove and re-add the primary image.",
        );

        setIsSaving(false);
        return;
      }

      if (uploadResult.failedCount > 0) {
        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError(
          `${uploadResult.failedCount} image(s) failed to upload. Please remove the failed images and re-add them.`,
        );

        setIsSaving(false);
        return;
      }

      imagesRef.current?.resetImages();
      resetForm();
      setImagesFormKey((prev) => prev + 1);
      setActiveIndex(0);

      setResultModal({
        isOpen: true,
        type: "success",
        title: "Success!",
        message: "Product created and all images uploaded successfully.",
      });
    } catch (err) {
      console.error(err);
      setResultModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishProduct = async () => {
    if (isSaving) return;

    const isUploading = formData.images.some(
      (img) => img.status === "uploading",
    );
    if (isUploading) return;

    setIsSaving(true);

    try {
      const result = await handlePublish();

      if (!result.success && result.errorStep !== undefined) {
        setActiveIndex(result.errorStep);
        setIsAutoNavigating(true);
        const errorMessage =
          result.errorSummary ||
          result.error ||
          "Please complete required fields";
        showError(errorMessage);
        setIsSaving(false);
        return;
      }

      if (!result.success || !result.productId) {
        setResultModal({
          isOpen: true,
          type: "error",
          title: "Publish Failed",
          message:
            result.error ||
            "Failed to publish product. Please check your inputs.",
        });
        setIsSaving(false);
        return;
      }

      const productId = result.productId;
      const uploadResult = await imagesRef.current?.uploadImages(productId);

      if (!uploadResult?.primarySucceeded) {
        try {
          await fetch(`/api/shopowner/products/${productId}`, {
            method: "DELETE",
          });
        } catch (deleteError) {
          console.error(
            "Failed to delete product after primary image failure:",
            deleteError,
          );
        }

        imagesRef.current?.clearFailedPrimary();

        setFormData((prev) => ({
          ...prev,
          images: prev.images.map((img) => ({
            ...img,
            status: "pending",
            serverId: undefined,
          })),
        }));

        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError(
          "Primary image upload failed. Please remove and re-add the primary image.",
        );

        setIsSaving(false);
        return;
      }

      if (uploadResult.failedCount > 0) {
        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError(
          `${uploadResult.failedCount} image(s) failed to upload. Please remove the failed images and re-add them.`,
        );

        setIsSaving(false);
        return;
      }

      imagesRef.current?.resetImages();
      resetForm();
      setImagesFormKey((prev) => prev + 1);
      setActiveIndex(0);

      setResultModal({
        isOpen: true,
        type: "success",
        title: "Success!",
        message: "Product published successfully and is now live!",
      });
    } catch (err) {
      console.error(err);
      setResultModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderComponent = () => {
    return (
      <>
        <div style={{ display: activeIndex === 0 ? "block" : "none" }}>
          <BasicInfoForm
            formData={formData}
            setFormData={setFormData}
            attributeSchema={attributeSchema.filter((f) => f.variant !== true)}
            loadingSchema={loadingSchema}
            errors={errors}
          />
        </div>
        <div style={{ display: activeIndex === 1 ? "block" : "none" }}>
          <PricingForm
            formData={formData}
            setFormData={setFormData}
            variantAttributes={variantAttributes}
            selectedVariantAttrs={selectedVariantAttrs}
            toggleVariantAttribute={toggleVariantAttribute}
            addVariant={addVariant}
            removeVariant={removeVariant}
            updateVariant={updateVariant}
            errors={errors}
          />
        </div>
        <div style={{ display: activeIndex === 2 ? "block" : "none" }}>
          <ImagesForm
            key={imagesFormKey}
            ref={imagesRef}
            initialImages={formData.images as ProductImage[]}
            onImagesChange={handleImagesChange}
            onError={showError}
            onSuccess={showSuccess}
          />
        </div>
        <div style={{ display: activeIndex === 3 ? "block" : "none" }}>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Categories
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Group your product into categories for better discoverability
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex flex-wrap gap-2 mb-4">
                {categories
                  .filter((cat) => formData.categoryIds.includes(cat.id))
                  .map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-orange-50 border border-orange-200 text-gray-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm"
                    >
                      <Icon
                        icon="mdi:tag"
                        className="w-3 h-3 text-orange-500"
                      />
                      <span>{cat.name}</span>
                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Icon icon="mdi:close" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>

              {formData.categoryIds.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  No categories selected yet
                </p>
              )}

              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) =>
                      setSelectedCategoryId(Number(e.target.value) || "")
                    }
                    className="w-full px-4 py-3 border rounded-xl transition-all duration-200 font-[Poppins] text-gray-800 placeholder-gray-400 bg-white border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                  >
                    <option value="">Select a category to add</option>
                    {categories
                      .filter((cat) => !formData.categoryIds.includes(cat.id))
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCategoryId) {
                      addCategory(selectedCategoryId as number);
                      setSelectedCategoryId("");
                    }
                  }}
                  disabled={!selectedCategoryId}
                  className="px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 h-[52px]"
                >
                  <Icon icon="mdi:plus" className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            <div>
              <Button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                variant="secondary"
                className="flex flex-row items-center justify-center gap-2 w-full md:w-auto"
              >
                <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
                {showCategoryForm ? "Cancel" : "Create New Category"}
              </Button>

              {showCategoryForm && shopId && (
                <div className="mt-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <CategoryComponent
                    shopId={shopId}
                    onCategoryCreated={handleCategoryCreated}
                    onCategoryError={handleCategoryError}
                    onCancel={() => setShowCategoryForm(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: activeIndex === 4 ? "block" : "none" }}>
          <ReviewStep
            formData={formData}
            completion={completion}
            attributeSchema={attributeSchema}
            onPublish={handlePublishProduct}
            isPublishing={isSaving}
          />
        </div>
      </>
    );
  };

  const handleNextOrSave = () => {
    if (activeIndex === sections.length - 1) {
      handleSaveProduct();
    } else {
      handleNext();
    }
  };

  const handleModalClose = () => {
    setResultModal((prev) => ({ ...prev, isOpen: false }));
  };

  const getErrorStep = (): number | null => {
    if (!errors || Object.keys(errors).length === 0) return null;

    const basicInfoKeys = ["productName", "productSlug", "attr."];
    const pricingKeys = ["price", "discountPrice", "variant_", "variants"];
    const imageKeys = ["images"];

    const errorKeys = Object.keys(errors);

    if (errorKeys.some((key) => basicInfoKeys.some((k) => key.includes(k)))) {
      return 0;
    }
    if (errorKeys.some((key) => pricingKeys.some((k) => key.includes(k)))) {
      return 1;
    }
    if (errorKeys.some((key) => imageKeys.some((k) => key.includes(k)))) {
      return 2;
    }

    return 0;
  };

  const getStepStatus = (index: number) => {
    const stepKeys = ["basicInfo", "pricing", "images", "categories", "review"];
    const step =
      completion.steps[stepKeys[index] as keyof typeof completion.steps];
    const errorStep = getErrorStep();

    const hasErrorsOnThisStep = errorStep === index;

    if (!step) return { status: "incomplete", hasErrors: false };
    if (index === activeIndex) {
      return { status: "active", hasErrors: hasErrorsOnThisStep };
    }
    if (step.completed && !hasErrorsOnThisStep) {
      return { status: "completed", hasErrors: false };
    }
    if (hasErrorsOnThisStep) {
      return { status: "error", hasErrors: true };
    }
    return { status: "incomplete", hasErrors: false };
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Poppins]">
      <ResultModal
        isOpen={resultModal.isOpen}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={handleModalClose}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <Link
            href={`/dashboard/${shopSlug}/products`}
            className="inline-flex items-center text-gray-600 hover:text-black text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-black">
              Add New Product
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Shop: <span className="font-medium text-black">{shopSlug}</span> •
              Type:{" "}
              <span className="font-medium text-black">
                {shopType || "Loading..."}
              </span>
            </p>
          </div>
        </div>

        {hasFailedImages && activeIndex !== 2 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Some images failed to upload
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please go to the Images step, remove the failed images, and
                re-add them.
              </p>
              <button
                onClick={() => setActiveIndex(2)}
                className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline"
              >
                Go to Images
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Setup Progress
            </span>
            <span className="text-sm font-bold text-orange-600">
              {completion.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>
              {completion.completedSteps} of {completion.totalSteps} steps
              complete
            </span>
            {completion.canPublish && !hasFailedImages && (
              <span className="inline-flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Ready to publish
              </span>
            )}
            {hasFailedImages && (
              <span className="inline-flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                Fix image errors
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-black rounded-lg shadow-sm sticky top-6 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
                  Steps
                </h2>
              </div>
              <nav className="p-2 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {sections.map((section, index) => {
                  const { status, hasErrors } = getStepStatus(index);
                  const isActive = index === activeIndex;

                  let icon;
                  if (hasErrors && status !== "active") {
                    icon = <AlertCircle className="w-4 h-4 text-red-400" />;
                  } else if (status === "completed") {
                    icon = <CheckCircle className="w-4 h-4 text-green-400" />;
                  } else if (status === "active") {
                    icon = <Circle className="w-4 h-4 text-orange-400" />;
                  } else {
                    icon = <Circle className="w-4 h-4 text-gray-600" />;
                  }

                  return (
                    <button
                      key={section}
                      onClick={() => handleTabClick(index)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-orange-500/10 text-orange-400"
                          : hasErrors && status !== "active"
                            ? "text-red-400 hover:bg-red-900/10"
                            : status === "completed"
                              ? "text-gray-100 hover:bg-gray-800"
                              : "text-gray-100 hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex-shrink-0">{icon}</span>
                      <span className="flex-1 text-left font-medium">
                        {section}
                        {status === "completed" && (
                          <span className="ml-2 text-green-400">✓</span>
                        )}
                        {hasErrors && status !== "active" && (
                          <span className="ml-2 text-red-400 text-xs">!</span>
                        )}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-6 bg-orange-400 rounded-full flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-800 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Complete</span>
                  <span className="text-white font-medium">
                    {completion.percentage}%
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500 rounded-full"
                    style={{ width: `${completion.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {renderComponent()}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevious}
                disabled={activeIndex === 0}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {activeIndex === sections.length - 1 ? (
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving || hasFailedImages}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    hasFailedImages
                      ? "bg-red-100 text-red-500 cursor-not-allowed"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        className="animate-spin w-4 h-4"
                      />
                      Saving...
                    </>
                  ) : hasFailedImages ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Fix Image Errors
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:content-save" className="w-4 h-4" />
                      Save Draft
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextOrSave}
                  disabled={loading || isSaving}
                  className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 flex items-center gap-2"
                >
                  {loading || isSaving ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        className="animate-spin w-4 h-4"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {toastState.text && (
        <SimpleToast
          message={toastState}
          onClose={() => setToastState({ type: "error", text: "" })}
        />
      )}
    </div>
  );
}
