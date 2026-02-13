"use client";

import Input from "@/app/components/ui/input";
import { Icon } from "@iconify/react";
import { Attribute } from "../types"; // Import shared type

interface PrimaryFormProps {
  formData: any;
  setFormData: (data: any) => void;
  attributeSchema: Attribute[];
  loadingSchema: boolean;
  errors: Record<string, string>;
}

export default function PrimaryForm({
  formData,
  setFormData,
  attributeSchema,
  loadingSchema,
  errors
}: PrimaryFormProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith("attr.")) {
      const attrName = name.replace("attr.", "");
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [attrName]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Auto-generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      productName: name,
      productSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    });
  };

  console.log("Rendering attributes:", attributeSchema); // Debug log

  return (
    <div className="space-y-6 font-[Poppins]">
      <div>
        <h2 className="text-xl font-semibold text-black mb-1">Primary Details</h2>
        <p className="text-sm text-gray-600">All fields marked * are required</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleNameChange}
            placeholder="e.g., Panadol Extra"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
          />
          {errors.productName && (
            <p className="mt-1 text-sm text-red-500">{errors.productName}</p>
          )}
        </div>

        {/* Product Slug */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="productSlug"
            value={formData.productSlug}
            onChange={handleChange}
            placeholder="product-url-slug"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
          />
          {errors.productSlug && (
            <p className="mt-1 text-sm text-red-500">{errors.productSlug}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (KES) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price}</p>
          )}
        </div>

        {/* In Stock */}
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 text-gray-700 font-[Poppins]">
            <input
              type="checkbox"
              name="inStock"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
            />
            <span className="text-sm font-medium">In Stock</span>
          </label>
        </div>
      </div>

      {/* Dynamic Attributes */}
      {loadingSchema ? (
        <div className="flex items-center justify-center py-8">
          <Icon icon="mdi:loading" className="animate-spin w-6 h-6 text-gray-600" />
          <span className="ml-2 text-gray-600 font-[Poppins]">Loading attributes...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {attributeSchema.length > 0 ? (
            <>
              {/* Required Attributes */}
              {attributeSchema.filter(f => f.required).length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-4">Required Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {attributeSchema.filter(f => f.required).map((field) => (
                      <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label} <span className="text-red-500">*</span>
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            name={`attr.${field.name}`}
                            value={formData.attributes[field.name] || ''}
                            onChange={handleChange}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            name={`attr.${field.name}`}
                            value={formData.attributes[field.name] || ''}
                            onChange={handleChange}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            name={`attr.${field.name}`}
                            value={formData.attributes[field.name] || ''}
                            onChange={handleChange}
                            rows={4}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
                          />
                        )}

                        {field.type === 'boolean' && (
                          <div className="flex items-center">
                            <label className="flex items-center gap-3 text-gray-700 font-[Poppins]">
                              <input
                                type="checkbox"
                                name={`attr.${field.name}`}
                                checked={formData.attributes[field.name] || false}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    attributes: {
                                      ...formData.attributes,
                                      [field.name]: e.target.checked
                                    }
                                  });
                                }}
                                className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                              />
                              <span className="text-sm">Yes</span>
                            </label>
                          </div>
                        )}

                        {field.type === 'select' && field.options && (
                          <select
                            name={`attr.${field.name}`}
                            value={formData.attributes[field.name] || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black bg-white"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description - Always at the end */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter product description..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-[Poppins] text-black"
                />
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">No attributes configured for this shop type</p>
          )}
        </div>
      )}
    </div>
  );
}