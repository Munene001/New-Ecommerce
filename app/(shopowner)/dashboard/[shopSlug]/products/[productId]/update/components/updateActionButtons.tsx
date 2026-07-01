"use client";

import { Icon } from "@iconify/react";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

interface UpdateActionButtonsProps {
  activeIndex: number;
  totalSections: number;
  isSaving: boolean;
  loading: boolean;
  hasFailedImages: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
}

export default function UpdateActionButtons({
  activeIndex,
  totalSections,
  isSaving,
  loading,
  hasFailedImages,
  onPrevious,
  onNext,
  onSave,
}: UpdateActionButtonsProps) {
  const isLastStep = activeIndex === totalSections - 1;

  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={onPrevious}
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

      {isLastStep ? (
        <button
          onClick={onSave}
          disabled={isSaving || hasFailedImages}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            hasFailedImages
              ? "bg-red-100 text-red-500 cursor-not-allowed"
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          {isSaving ? (
            <>
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
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
              Update Draft
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={loading || isSaving}
          className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 flex items-center gap-2"
        >
          {loading || isSaving ? (
            <>
              <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />
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
  );
}