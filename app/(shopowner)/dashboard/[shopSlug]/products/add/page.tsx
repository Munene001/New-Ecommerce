"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import PrimaryForm from "./components/primaryForm";
import OptionalForm from "./components/optionalForm";
import ImagesForm, { ImagesFormRef, ProductImage } from "./components/imagesForm";
import CategoryComponent from "./components/categoryComponent";
import ResultModal from "./components/resultModal";
import { useProductForm } from "./hooks/useProductForm";
import Button from "@/app/components/ui/button";
import SimpleToast from "@/app/components/ui/simpleToast";

export default function AddProductPage() {
  const {
    activeIndex,
    sections,
    formData,
    setFormData,
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    showCategoryForm,
    setShowCategoryForm,
    attributeSchema,
    loadingSchema,
    loading,
    errors,
    shopSlug,
    shopId,
    shopType,
    tabWarning,
    modalState,
    showWarning,
    handleSubmit,
    handleCategoryCreated,
    handleCategoryError,
    handleNext,
    handlePrevious,
    handleTabClick,
    closeModal,
    addCategory,
    removeCategory,
    resetForm,
    setActiveIndex,
  } = useProductForm();

  const imagesRef = useRef<ImagesFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imagesFormKey, setImagesFormKey] = useState(0); // for resetting ImagesForm

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

  const handleSaveProduct = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const productId = await handleSubmit();
      if (!productId) {
        setResultModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: "Failed to create product. Please check your inputs.",
        });
        return;
      }

      const uploadResult = await imagesRef.current?.uploadImages(productId);
      if (uploadResult?.success) {
        // Reset everything
        resetForm();              // clears form data (including images in parent state)
        setImagesFormKey((prev) => prev + 1); // forces ImagesForm to re-mount
        setActiveIndex(0);        // go back to primary tab
        
        setResultModal({
          isOpen: true,
          type: "success",
          title: "Success!",
          message: "Product created and all images uploaded successfully. Form reset.",
        });
      } else {
        setResultModal({
          isOpen: true,
          type: "error",
          title: "Partial Success",
          message: `Product created but ${uploadResult?.failedCount || 0} image(s) failed to upload. You can retry later.`,
        });
      }
    } catch (err) {
      console.error(err);
      setResultModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderComponent = () => {
    switch (activeIndex) {
      case 0:
        return (
          <PrimaryForm
            formData={formData}
            setFormData={setFormData}
            attributeSchema={attributeSchema}
            loadingSchema={loadingSchema}
            errors={errors}
          />
        );
      case 1:
        return (
          <OptionalForm
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            formData={formData}
            setFormData={setFormData}
            optionalAttributes={attributeSchema.filter((f) => !f.required)}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
          />
        );
      case 2:
        return (
          <ImagesForm
            key={imagesFormKey}
            ref={imagesRef}
            initialImages={formData.images as ProductImage[]}
            onImagesChange={(images) =>
              setFormData((prev) => ({ ...prev, images: images as any }))
            }
            onError={(message) => showWarning(message, "error")}
          />
        );
      default:
        return null;
    }
  };

  const onNextOrSave = async () => {
    if (activeIndex === sections.length - 1) {
      await handleSaveProduct();
    } else {
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative font-[Poppins]">
      <ResultModal
        isOpen={resultModal.isOpen}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={() => setResultModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="mb-6">
        <Link
          href={`/dashboard/${shopSlug}/products`}
          className="inline-flex items-center text-gray-700 hover:text-black text-[16px] transition-colors font-[Poppins]"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 mr-2" />
          Back to Products
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black font-[Poppins]">
          Add New Product
        </h1>
        <p className="hidden md:block text-magenta-dark mt-2 font-[Poppins]">
          Shop: <span className="font-medium text-black">{shopSlug}</span> •
          Type:{" "}
          <span className="font-medium text-black">
            {shopType || "Loading..."}
          </span>
        </p>
      </div>

      <div className="mb-8">
        <Button
          onClick={() => setShowCategoryForm(!showCategoryForm)}
          variant="secondary"
          className="flex flex-row items-center justify-center gap-2"
        >
          <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
          {showCategoryForm ? "Cancel" : "Add New Category"}
        </Button>

        {showCategoryForm && shopId && (
          <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <CategoryComponent
              shopId={shopId}
              onCategoryCreated={handleCategoryCreated}
              onCategoryError={handleCategoryError}
              onCancel={() => setShowCategoryForm(false)}
            />
          </div>
        )}
      </div>

      <SimpleToast message={tabWarning} onClose={() => {}} />

      <div className="w-full mb-8">
        <div className="flex">
          <div className="md:w-[75%] w-full">
            <div className="flex justify-between mb-1">
              {sections.map((section, index) => (
                <button
                  key={section}
                  onClick={() => handleTabClick(index)}
                  className={`flex-1 text-center px-2 py-3 text-[18px] md:text-base font-[500] transition-colors font-[Poppins] ${
                    index === activeIndex
                      ? "text-black"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                  style={{ width: `${100 / sections.length}%` }}
                >
                  {section}
                  {index === 0 && (
                    <span className="ml-1 text-red-500 text-xs">*</span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full h-[10px] bg-gray-400">
              <div
                className="absolute h-[10px] bg-magenta-dark rounded-full transition-all duration-300"
                style={{
                  width: `${100 / sections.length}%`,
                  left: `${(100 / sections.length) * activeIndex}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm md:p-6 px-3 py-6">
        {renderComponent()}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={activeIndex === 0}
          className={`px-6 py-3 rounded-lg font-[Poppins] text-sm font-medium transition-colors ${
            activeIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Previous
        </button>

        <button
          onClick={onNextOrSave}
          disabled={loading || isSaving}
          className="px-6 py-3 bg-black text-white rounded-lg font-[Poppins] text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300"
        >
          {loading || isSaving ? (
            <span className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
              {activeIndex === sections.length - 1 ? "Saving..." : "Loading..."}
            </span>
          ) : activeIndex === sections.length - 1 ? (
            "Save Product"
          ) : (
            "Next"
          )}
        </button>
      </div>
    </div>
  );
}