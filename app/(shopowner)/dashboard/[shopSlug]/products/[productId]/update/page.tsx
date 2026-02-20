"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import PrimaryForm from "../../add/components/primaryForm";
import OptionalForm from "../../add/components/optionalForm";
import ResultModal from "../../add/components/resultModal";
import CategoryComponent from "../../add/components/categoryComponent";
import Button from "@/app/components/ui/button";
import { useProductUpdate } from "./hooks/useProductUpdate";
import SimpleToast from "@/app/components/ui/simpleToast";


export default function UpdateProductPage() {
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
    warningRef,
    showWarning,
    isLoadingProduct,

    handleCategoryCreated,
    handleCategoryError,
    handleNext,
    handlePrevious,
    handleTabClick,
    closeModal,
    addCategory,
    removeCategory,
  } = useProductUpdate();

  const renderComponent = () => {
    if (isLoadingProduct) {
      return (
        <div className="space-y-4">
         
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className=" gap-6">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded animate-pulse mt-4"></div>
        </div>
      );
    }

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
            onAddCategory={addCategory}        // Add this
            onRemoveCategory={removeCategory}  
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className=" relative min-h-screen bg-gray-50 p-6 font-[Poppins]">
      <ResultModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={closeModal}
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
          Update Product
        </h1>
        <p className=" hidden md:block text-magenta-dark mt-2 font-[Poppins]">
          Shop: <span className="font-medium text-black">{shopSlug}</span> •
          Type:{" "}
          <span className="font-medium text-black">
            {shopType || "Loading..."}
          </span>
        </p>
        <p className="text-black mt-2 font-[Poppins]">
            To update the images you will have to delete this product and create a new one
        
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
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  style={{ width: `${100 / sections.length}%` }}
                >
                  {section}
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

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm md:p-6 py-6 px-3">
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
          onClick={handleNext}
          disabled={loading || isLoadingProduct}
          className="px-6 py-3 bg-black text-white rounded-lg font-[Poppins] text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
              Updating Product...
            </span>
          ) : activeIndex === sections.length - 1 ? (
            "Update Product"
          ) : (
            "Next"
          )}
        </button>
      </div>
    </div>
  );
}