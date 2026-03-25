"use client";

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";
import InstructionsList from "@/app/components/ui/instructionList";

interface BannerUploaderProps {
  shopSlug: string;
  onUploadSuccess: (banners: any[]) => void;
  onCancel: () => void;
  showWarning: (message: string, type: "success" | "error") => void;
}

export default function BannerUploader({
  shopSlug,
  onUploadSuccess,
  onCancel,
  showWarning,
}: BannerUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      
      setSelectedFiles(files);
      setPreviews(newPreviews);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showWarning("Please select at least one image", "error");
      return;
    }

    setUploading(true);
    const uploadedBanners: any[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("shopSlug", shopSlug);
      formData.append("image", file);

      try {
        const res = await fetch("/api/shopowner/banners", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        uploadedBanners.push(data);
      } catch (error: any) {
        showWarning(`Failed to upload ${file.name}: ${error.message}`, "error");
      }
    }

    if (uploadedBanners.length > 0) {
      onUploadSuccess(uploadedBanners);
      setSelectedFiles([]);
      previews.forEach(preview => URL.revokeObjectURL(preview));
      setPreviews([]);
    }

    setUploading(false);
  };

  const handleCancelUpload = () => {
    previews.forEach(preview => URL.revokeObjectURL(preview));
    setSelectedFiles([]);
    setPreviews([]);
    onCancel();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="font-medium text-black">Upload Banners</h3>
      
      <InstructionsList
        items={[
          { text: "Select multiple images at once" },
          { text: "Max 5MB per image. Recommended width: 1200px" },
          { text: "Banners will be inactive by default. Activate them to configure links" },
        ]}
        variant="green"
      />

      {/* File Input */}
      <div>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Icon icon="mdi:cloud-upload" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Click to select images</p>
          <p className="text-xs text-gray-400">You can select multiple images at once</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Images ({previews.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-[9/9] bg-gray-100 rounded-lg overflow-hidden group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {(selectedFiles[index].size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <Button variant="secondary" onClick={handleCancelUpload}>
          Cancel
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleUpload} 
          disabled={uploading} 
          loading={uploading}
        >
          Upload {selectedFiles.length} Banner(s)
        </Button>
      </div>
    </div>
  );
}