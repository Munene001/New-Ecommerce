"use client";

import { useState } from "react";
import FreeDropDown from "@/app/components/ui/freeDropDown";
import { Icon } from "@iconify/react";
import { Category, Attribute } from "../types"; // Import shared types

interface OptionalFormProps {
  categories: Category[];
  selectedCategoryId: number | "";
  setSelectedCategoryId: (id: number | "") => void;
  formData: any;
  setFormData: (data: any) => void;
  optionalAttributes: Attribute[];
}

export default function OptionalForm({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  formData,
  setFormData,
  optionalAttributes
}: OptionalFormProps) {
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

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
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const catId = value ? Number(value) : "";
    setSelectedCategoryId(catId);
    
    if (catId && !formData.categoryIds.includes(catId)) {
      setFormData({
        ...formData,
        categoryIds: [...formData.categoryIds, catId]
      });
    }
  };

  const removeCategory = (catId: number) => {
    setFormData({
      ...formData,
      categoryIds: formData.categoryIds.filter((id: number) => id !== catId)
    });
    if (selectedCategoryId === catId) {
      setSelectedCategoryId("");
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    // API call would go here
    console.log("Create category:", newCategoryName);
    setNewCategoryName("");
    setShowCategoryForm(false);
  };

  const selectedCategories = categories.filter(cat => 
    formData.categoryIds.includes(cat.id)
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg">
      <h2 className="text-lg font-semibold text-gray-800">Optional Details</h2>
      <p className="text-sm text-gray-500">You can skip this section</p>

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-gray-700">Categories</h3>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Icon icon="mdi:plus" className="w-4 h-4" />
            {showCategoryForm ? "Cancel" : "New Category"}
          </button>
        </div>

        {/* Inline Category Creation Form */}
        {showCategoryForm && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        )}

        {/* Category Dropdown */}
        <FreeDropDown
          name="category"
          value={selectedCategoryId}
          onChange={handleCategoryChange}
          options={categories.filter(cat => !formData.categoryIds.includes(cat.id))}
          placeholder="Select a category"
          className="bg-white"
        />

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
              >
                <span>{cat.name}</span>
                <button
                  onClick={() => removeCategory(cat.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional Attributes */}
      {optionalAttributes.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-md font-medium text-gray-700">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalAttributes.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    name={`attr.${field.name}`}
                    value={formData.attributes[field.name] || ''}
                    onChange={handleChange}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                )}
                
                {field.type === 'number' && (
                  <input
                    type="number"
                    name={`attr.${field.name}`}
                    value={formData.attributes[field.name] || ''}
                    onChange={handleChange}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    name={`attr.${field.name}`}
                    value={formData.attributes[field.name] || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                )}
                
                {field.type === 'select' && field.options && (
                  <select
                    name={`attr.${field.name}`}
                    value={formData.attributes[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                
                {field.type === 'boolean' && (
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 text-gray-700">
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
                        className="w-4 h-4 text-black border-gray-300 rounded"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}