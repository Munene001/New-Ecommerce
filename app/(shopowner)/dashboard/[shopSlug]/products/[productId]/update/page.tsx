"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import BasicInfoForm from "../../add/components/basicInfoForm";
import PricingForm from "../../add/components/pricingForm";
import UpdateImagesForm from "./components/updateImageForm";
import { UpdateImagesFormRef } from "./components/updateImageForm";
import { ProductImage } from "../../add/types";
import CategoryComponent from "../../add/components/categoryComponent";
import ReviewStep from "../../add/components/reviewStep";
import ResultModal from "../../add/components/resultModal";
import UpdateSidebar from "./components/updateSideBar";
import UpdateActionButtons from "./components/updateActionButtons";
import { useProductUpdate } from "./hooks/useProductUpdate";
import Button from "@/app/components/ui/button";
import SimpleToast from "@/app/components/ui/simpleToast";

export default function UpdateProductPage() {
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
    isLoadingProduct,
    productId,
    calculateCompletion,
    markImagesLoaded,
  } = useProductUpdate();

  const imagesRef = useRef<UpdateImagesFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoNavigating, setIsAutoNavigating] = useState(false);
  const [hasFailedImages, setHasFailedImages] = useState(false);
  const prevImagesRef = useRef<ProductImage[]>(formData.images as ProductImage[]);

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

  useEffect(() => {
    if (prevImagesRef.current !== formData.images) {
      const failed = formData.images.some((img: ProductImage) => img.status === "failed");
      setHasFailedImages(failed);
      prevImagesRef.current = formData.images as ProductImage[];
    }
  }, [formData.images]);

  useEffect(() => {
    if (isAutoNavigating) {
      const formContainer = document.querySelector('.bg-white.rounded-lg.border');
      if (formContainer) {
        setTimeout(() => {
          formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
      setIsAutoNavigating(false);
    }
  }, [activeIndex, isAutoNavigating]);

  // ✅ SIMPLIFIED: No complex comparison - just update the state
  const handleImagesChange = useCallback((newImages: ProductImage[]) => {
    console.log('📸 Parent received images:', newImages.length);
    console.log('📸 Parent received images data:', JSON.stringify(newImages.map(i => ({ id: i.id, isPrimary: i.isPrimary, status: i.status }))));
    markImagesLoaded();
    setFormData((prev) => {
      console.log('📸 Previous images in state:', prev.images.length);
      return {
        ...prev,
        images: newImages
      };
    });
  }, [setFormData, markImagesLoaded]);

  // ✅ Memoize props to prevent unnecessary re-renders
  const imagesFormProps = useMemo(() => ({
    productId: parseInt(productId, 10),
    onImagesChange: handleImagesChange,
    onError: showError,
    onSuccess: showSuccess,
  }), [productId, handleImagesChange, showError, showSuccess]);

  const handleSaveProduct = async () => {
    console.log('💾 handleSaveProduct called');
    if (isSaving) {
      console.log('💾 Already saving, skipping...');
      return;
    }
    setIsSaving(true);

    try {
      console.log('💾 Calling handleSubmit with draft...');
      const result = await handleSubmit('draft');
      console.log('💾 handleSubmit result:', result);

      if (!result.success || !result.productId) {
        console.error('💾 Product update failed:', result.error);
        setResultModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: result.error || "Failed to update product. Please check your inputs.",
        });
        setIsSaving(false);
        return;
      }

      console.log('💾 Product updated successfully, productId:', result.productId);

      const productIdNum = parseInt(productId, 10);
      console.log('💾 Saving images for product:', productIdNum);
      const uploadResult = await imagesRef.current?.saveImages(productIdNum);
      console.log('💾 Image upload result:', uploadResult);

      if (!uploadResult?.primarySucceeded) {
        console.error('💾 Primary image upload failed');
        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError("Primary image upload failed. Please remove and re-add the primary image.");
        setIsSaving(false);
        return;
      }

      if (uploadResult.failedCount > 0) {
        console.warn('💾 Some images failed to upload:', uploadResult.failedCount);
        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError(`${uploadResult.failedCount} image(s) failed to upload. Please remove the failed images and re-add them.`);
        setIsSaving(false);
        return;
      }

      console.log('💾 All images uploaded successfully');
      
      // ✅ Only show toast for success - no modal
      showSuccess("✅ Product updated successfully!");
      
      // ✅ Reset the form state to clear any pending changes
      // resetForm();
      
    } catch (err) {
      console.error('💾 Error in handleSaveProduct:', err);
      setResultModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishProduct = async () => {
    console.log('📤 handlePublishProduct called');
    if (isSaving) {
      console.log('📤 Already saving, skipping...');
      return;
    }
    setIsSaving(true);

    try {
      console.log('📤 Calling handlePublish...');
      const result = await handlePublish();
      console.log('📤 handlePublish result:', result);

      if (!result.success && result.errorStep !== undefined) {
        console.warn('📤 Validation failed, navigating to step:', result.errorStep);
        setActiveIndex(result.errorStep);
        setIsAutoNavigating(true);
        const errorMessage = result.errorSummary || result.error || "Please complete required fields";
        showError(errorMessage);
        setIsSaving(false);
        return;
      }

      if (!result.success || !result.productId) {
        console.error('📤 Publish failed:', result.error);
        setResultModal({
          isOpen: true,
          type: "error",
          title: "Publish Failed",
          message: result.error || "Failed to publish product. Please check your inputs.",
        });
        setIsSaving(false);
        return;
      }

      console.log('📤 Product published successfully, productId:', result.productId);

      const productIdNum = parseInt(productId, 10);
      console.log('📤 Saving images for product:', productIdNum);
      const uploadResult = await imagesRef.current?.saveImages(productIdNum);
      console.log('📤 Image upload result:', uploadResult);

      if (!uploadResult?.primarySucceeded) {
        console.error('📤 Primary image upload failed');
        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError("Primary image upload failed. Please remove and re-add the primary image.");
        setIsSaving(false);
        return;
      }

      if (uploadResult.failedCount > 0) {
        console.warn('📤 Some images failed to upload:', uploadResult.failedCount);
        setActiveIndex(2);
        setIsAutoNavigating(true);
        showError(`${uploadResult.failedCount} image(s) failed to upload. Please remove the failed images and re-add them.`);
        setIsSaving(false);
        return;
      }

      console.log('📤 All images uploaded successfully');
      
      // ✅ Only show toast for success - no modal
      showSuccess("✅ Product published successfully and is now live!");
      
      // ✅ Reset the form state to clear any pending changes
      // resetForm();
      
    } catch (err) {
      console.error('📤 Error in handlePublishProduct:', err);
      setResultModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStepStatuses = () => {
    return sections.map((_, index) => {
      const stepKeys = ['basicInfo', 'pricing', 'images', 'categories', 'review'];
      const step = completion.steps[stepKeys[index] as keyof typeof completion.steps];
      const hasErrors = index === activeIndex && Object.keys(errors).length > 0;
      
      if (index === activeIndex) {
        return { status: 'active' as const, hasErrors };
      }
      if (step?.completed && !hasErrors) {
        return { status: 'completed' as const, hasErrors: false };
      }
      if (hasErrors) {
        return { status: 'error' as const, hasErrors: true };
      }
      return { status: 'incomplete' as const, hasErrors: false };
    });
  };

  const renderComponent = () => {
    if (isLoadingProduct) {
      return (
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded animate-pulse mt-4"></div>
        </div>
      );
    }

    return (
      <>
        <div style={{ display: activeIndex === 0 ? 'block' : 'none' }}>
          <BasicInfoForm
            formData={formData}
            setFormData={setFormData}
            attributeSchema={attributeSchema.filter((f: any) => f.variant !== true)}
            loadingSchema={loadingSchema}
            errors={errors}
          />
        </div>
        <div style={{ display: activeIndex === 1 ? 'block' : 'none' }}>
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
        <div style={{ display: activeIndex === 2 ? 'block' : 'none' }}>
          <UpdateImagesForm
            key="images-form"
            ref={imagesRef}
            {...imagesFormProps}
          />
        </div>
        <div style={{ display: activeIndex === 3 ? 'block' : 'none' }}>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
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
                      <Icon icon="mdi:tag" className="w-3 h-3 text-orange-500" />
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
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value) || "")}
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
        <div style={{ display: activeIndex === 4 ? 'block' : 'none' }}>
          <ReviewStep
            formData={formData}
            completion={completion}
            attributeSchema={attributeSchema}
            onPublish={handlePublishProduct}
            isPublishing={isSaving}
             isUpdate={true}
          />
        </div>
      </>
    );
  };

  // ✅ Close modal handler - only used for errors now
  const handleModalClose = () => {
    setResultModal((prev) => ({ ...prev, isOpen: false }));
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
            <h1 className="text-2xl font-semibold text-black">Update Product</h1>
            <p className="text-sm text-gray-500 mt-1">
              Shop: <span className="font-medium text-black">{shopSlug}</span> •
              Type: <span className="font-medium text-black">{shopType || "Loading..."}</span>
            </p>
          </div>
        </div>

        {/* ✅ Progress Bar */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
            <span className="text-sm font-bold text-orange-600">{completion.percentage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{completion.completedSteps} of {completion.totalSteps} steps complete</span>
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

        {hasFailedImages && activeIndex !== 2 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Some images failed to upload
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please go to the Images step, remove the failed images, and re-add them.
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

        <div className="flex flex-col lg:flex-row gap-6">
          <UpdateSidebar
            sections={sections}
            activeIndex={activeIndex}
            stepStatuses={getStepStatuses()}
            percentage={completion.percentage}
            completedSteps={completion.completedSteps}
            totalSteps={completion.totalSteps}
            canPublish={completion.canPublish}
            hasFailedImages={hasFailedImages}
            onTabClick={handleTabClick}
          />

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {renderComponent()}
            </div>

            <UpdateActionButtons
              activeIndex={activeIndex}
              totalSections={sections.length}
              isSaving={isSaving}
              loading={loading}
              hasFailedImages={hasFailedImages}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSave={handleSaveProduct}
            />
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