"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import FormField from "@/app/components/ui/formField";
import { Category, Attribute } from "../types";

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
  optionalAttributes,
}: OptionalFormProps) {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleChange = (e: React.ChangeEvent<any> | string | number) => {
    if (typeof e === "string" || typeof e === "number") {
      return;
    }

    // Handle event objects
    if (e && typeof e === "object" && "target" in e) {
      const { name, value, type } = e.target;

      if (name.startsWith("attr.")) {
        const attrName = name.replace("attr.", "");
        setFormData({
          ...formData,
          attributes: {
            ...formData.attributes,
            [attrName]: type === "checkbox" ? e.target.checked : value,
          },
        });
      }
    }
  };

  // Specific handler for dropdown fields - returns a value
  const handleDropdownChange = (name: string) => (value: string | number) => {
    if (name.startsWith("attr.")) {
      const attrName = name.replace("attr.", "");
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [attrName]: value,
        },
      });
    }
  };

  // Wrapper for dropdown to match the expected FormField onChange type
  const createDropdownHandler = (name: string) => {
    const dropdownHandler = handleDropdownChange(name);

    // Return a function that matches the expected signature
    return (e: React.ChangeEvent<any> | string | number) => {
      // If it's a direct value (string or number), pass it directly
      if (typeof e === "string" || typeof e === "number") {
        dropdownHandler(e);
      }
      // If it's an event, extract the value
      else if (e && typeof e === "object" && "target" in e) {
        dropdownHandler(e.target.value);
      }
    };
  };

  // Handler for category dropdown - matches the expected type
  const handleCategoryChange = (
    e: React.ChangeEvent<any> | string | number
  ) => {
    let catId: number | "" = "";

    if (typeof e === "string" || typeof e === "number") {
      catId = e ? Number(e) : "";
    } else if (e && typeof e === "object" && "target" in e) {
      catId = e.target.value ? Number(e.target.value) : "";
    }

    setSelectedCategoryId(catId);

    if (catId && !formData.categoryIds.includes(catId)) {
      setFormData({
        ...formData,
        categoryIds: [...formData.categoryIds, catId],
      });
    }
  };

  const removeCategory = (catId: number) => {
    setFormData({
      ...formData,
      categoryIds: formData.categoryIds.filter((id: number) => id !== catId),
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

  const selectedCategories = categories.filter((cat) =>
    formData.categoryIds.includes(cat.id)
  );

  const availableCategories = categories.filter(
    (cat) => !formData.categoryIds.includes(cat.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Optional Details
        </h2>
      </div>
      <div className="bg-green-50 border border-blue-200 rounded-lg p-4 text-sm text-magenta-dark space-y-1">
        <p>• Fill details that apply.</p>
        <p>
          • Create a category with the button{" "}
          <span className="font-semibold">"Add New Category"</span> at the top,
          before selecting a category below to group your products.
        </p>
        <p>• A product can be in more than one category</p>
      </div>

      {/* Categories Section */}
      <div className="space-y-4">
        {showCategoryForm && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              autoFocus
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        )}

        {/* Category Dropdown */}
        {availableCategories.length > 0 && (
          <FormField
            name="category"
            label="Add Category"
            type="select"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            options={availableCategories}
            placeholder="Select a category to add"
          />
        )}

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selected Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-three text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-sm group hover:bg-gray-200 transition-colors"
                >
                  <span>{cat.name}</span>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="text-white hover:text-gray-700 focus:outline-none"
                    aria-label={`Remove ${cat.name}`}
                  >
                    <Icon icon="mdi:close" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Optional Attributes */}
      {optionalAttributes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {optionalAttributes.map((field) => (
              <div
                key={field.name}
                className={field.type === "textarea" ? "md:col-span-2" : ""}
              >
                <FormField
                  name={`attr.${field.name}`}
                  label={field.label}
                  type={field.type as any}
                  value={formData.attributes[field.name]}
                  onChange={
                    field.type === "select"
                      ? createDropdownHandler(`attr.${field.name}`)
                      : handleChange
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  options={field.options?.map((opt) => ({
                    id: opt,
                    name: opt,
                  }))}
                  rows={3}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
