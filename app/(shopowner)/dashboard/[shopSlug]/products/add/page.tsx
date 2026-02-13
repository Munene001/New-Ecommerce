"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import PrimaryForm from "./components/primaryForm";
import OptionalForm from "./components/optionalForm";
import ImagesForm from "./components/imagesForm";
import CategoryComponent from "./components/categoryComponent";
import { useProductForm } from "./hooks/useProductForm";

export default function AddProductPage() {
  const {
    // State
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
    submitError,
    showSuccess,
    shopSlug,
    shopId,
    shopType,
    
    // Handlers
    handleCategoryCreated,
    handleNext,
    handlePrevious,
    handleTabClick,
  } = useProductForm();

  // Render active tab component
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
            optionalAttributes={attributeSchema.filter(f => !f.required)}
          />
        );
      case 2:
        return (
          <ImagesForm
            images={formData.images}
            setImages={(images) => setFormData(prev => ({ ...prev, images }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-[Poppins]">
      {/* Back Link */}
      <div className="mb-6">
        <Link 
          href={`/dashboard/${shopSlug}/products`}
          className="inline-flex items-center text-gray-700 hover:text-black transition-colors font-[Poppins]"
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 mr-2" />
          Back to Products
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-black font-[Poppins]">Add New Product</h1>
        <p className="text-gray-600 mt-2 font-[Poppins]">
          Shop: <span className="font-medium text-black">{shopSlug}</span> • Type: <span className="font-medium text-black">{shopType || "Loading..."}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">Complete all required fields in Primary Details before proceeding.</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 text-sm flex items-center gap-2">
            <Icon icon="mdi:check-circle" className="w-5 h-5" />
            Product created successfully! The form has been cleared for your next entry.
          </p>
        </div>
      )}

      {/* Add Category Button and Form */}
      <div className="mb-8">
        <button
          onClick={() => setShowCategoryForm(!showCategoryForm)}
          className="flex items-center gap-2 text-gray-700 hover:text-black font-[Poppins] text-sm mb-4"
        >
          <Icon icon="mdi:plus-circle-outline" className="w-5 h-5" />
          {showCategoryForm ? "Cancel" : "Add New Category"}
        </button>

        {showCategoryForm && shopId && (
          <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <CategoryComponent
              shopId={shopId}
              onCategoryCreated={handleCategoryCreated}
              onCancel={() => setShowCategoryForm(false)}
            />
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="w-full mb-8">
        <div className="flex">
          <div className="w-[75%]">
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
                  {index === 0 && <span className="ml-1 text-red-500 text-xs">*</span>}
                </button>
              ))}
            </div>

            {/* Bar container */}
            <div className="relative w-full h-[2px] bg-gray-200">
              <div
                className="absolute h-[2px] bg-black rounded-full transition-all duration-300"
                style={{
                  width: `${100 / sections.length}%`,
                  left: `${(100 / sections.length) * activeIndex}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="w-[25%] flex items-end">
            <div className="w-full h-[2px] bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {renderComponent()}
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{submitError}</p>
        </div>
      )}

      {/* Navigation Buttons */}
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
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg font-[Poppins] text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
              Creating Product...
            </span>
          ) : (
            activeIndex === sections.length - 1 ? "Save Product" : "Next"
          )}
        </button>
      </div>
    </div>
  );
}