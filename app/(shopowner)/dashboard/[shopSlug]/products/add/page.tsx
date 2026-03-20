"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import PrimaryForm from "./components/primaryForm";
import OptionalForm from "./components/optionalForm";
import ImagesForm from "./components/imagesForm";
import CategoryComponent from "./components/categoryComponent";
import ResultModal from "./components/resultModal";
import { useProductForm } from "./hooks/useProductForm";
import Button from "@/app/components/ui/button";
import SimpleToast from "@/app/components/ui/simpleToast";
import { useAuth } from "@/context/authcontext"

export default function AddProductPage() {
  const { token } = useAuth();
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

    handleCategoryCreated,
    handleCategoryError,
    handleNext,
    handlePrevious,
    handleTabClick,
    closeModal,
    addCategory,      // Add this from the hook
    removeCategory,
  } = useProductForm();


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
            onAddCategory={addCategory}        // Add this
            onRemoveCategory={removeCategory} 
          />
        );
      case 2:
        return (
          <ImagesForm
            images={formData.images}
            setImages={(images) => setFormData((prev) => ({ ...prev, images }))}
            onError={(message) => showWarning(message, "error")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative font-[Poppins]">
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
          Add New Product
        </h1>
        <p className=" hidden md:block text-magenta-dark mt-2 font-[Poppins]">
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
              token={token}  
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
                  {index === 0 && (
                    <span className="ml-1 text-red-500 text-xs">*</span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-full h-[10px] bg-gray-400">
              <div
                className="absolute h-[10px]  bg-magenta-dark rounded-full transition-all duration-300"
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
          onClick={handleNext}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg font-[Poppins] text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
              Creating Product...
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
