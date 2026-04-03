"use client";

import { Icon } from "@iconify/react";
import FormField from "@/app/components/ui/formField";
import { Attribute, ProductFormData } from "../types";
import InstructionsList from "@/app/components/ui/instructionList";

interface PrimaryFormProps {
  formData: ProductFormData;
  setFormData: (
    data: ProductFormData | ((prev: ProductFormData) => ProductFormData),
  ) => void;
  attributeSchema: Attribute[];
  loadingSchema: boolean;
  errors: Record<string, string>;
}

export default function PrimaryForm({
  formData,
  setFormData,
  attributeSchema,
  loadingSchema,
  errors,
}: PrimaryFormProps) {
  // Unified change handler that works with both events and direct values
  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | string
      | number,
  ) => {
    // Handle direct values from dropdown
    if (typeof e === "string" || typeof e === "number") {
      // This shouldn't happen with our current setup since we use handleDropdownChange for selects
      return;
    }

    // Handle event objects
    if (e && typeof e === "object" && "target" in e) {
      const { name, value, type } = e.target;

      if (name.startsWith("attr.")) {
        const attrName = name.replace("attr.", "");
        setFormData((prev) => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            [attrName]:
              type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : value,
          },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  // Specific handler for dropdown fields - returns a value
  const handleDropdownChange = (name: string) => (value: string | number) => {
    if (name.startsWith("attr.")) {
      const attrName = name.replace("attr.", "");
      setFormData((prev) => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [attrName]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Wrapper for dropdown to match the expected FormField onChange type
  const createDropdownHandler = (name: string) => {
    const dropdownHandler = handleDropdownChange(name);

    // Return a function that matches the expected signature
    return (
      e:
        | React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >
        | string
        | number,
    ) => {
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

  // Wrapper for name change to match the expected type
  const handleNameChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | string
      | number,
  ) => {
    if (typeof e === "object" && e !== null && "target" in e) {
      const target = e.target as HTMLInputElement;
      const name = target.value;
      setFormData((prev) => ({
        ...prev,
        productName: name,
        productSlug: name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      }));
    }
  };

  // Wrapper for checkbox change
  const handleInStockChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | string
      | number,
  ) => {
    if (typeof e === "object" && e !== null && "target" in e) {
      setFormData((prev) => ({
        ...prev,
        inStock: (e.target as HTMLInputElement).checked,
      }));
    }
  };

  const requiredAttributes = attributeSchema.filter((f) => f.required);
  const hasRequiredAttributes = requiredAttributes.length > 0;

  // Helper to convert attribute type to FormField type
  const getFormFieldType = (
    type: string,
  ):
    | "text"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "email"
    | "password"
    | "tel"
    | "url"
    | "color" => {
    if (type === "textarea") return "textarea";
    if (type === "select") return "select";
    if (type === "boolean") return "checkbox";
    if (type === "number") return "number";
    return "text";
  };

  return (
    <div className="md:space-y-6 space-y-8 font-[Poppins]">
      <div>
        <div className="text-xl font-semibold text-black mb-1">
          Primary Details
        </div>
      </div>
      <InstructionsList
        items={[
          {
            text: (
              <>
                All <span className="text-red-500">*</span> fields are required
                (only description and discount price are optional)
              </>
            ),
          },
          {
            text: "Discount price becomes the customer-facing price - must be less than regular price",
          },
          { text: "Product name and slug are automatically synced" },
        ]}
        variant="green"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <FormField
          name="productName"
          label="Product Name"
          value={formData.productName}
          onChange={handleNameChange}
          error={errors.productName}
          placeholder="e.g., Panadol Extra"
          required
        />

        {/* Product Slug */}

        <FormField
          name="productSlug"
          label="Product Slug"
          value={formData.productSlug}
          onChange={handleChange}
          error={errors.productSlug}
          placeholder="product-url-slug"
          required
        />

        {/* Price */}
        <div>
          <FormField
            name="price"
            label="Price (KES)"
            type="number"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
            placeholder="0.00"
            required
          />
        </div>

        {/* Discount Price - New field */}
        <div>
          <FormField
            name="discountPrice"
            label="Discount Price (KES)"
            type="number"
            value={formData.discountPrice || ""}
            onChange={handleChange}
            error={errors.discountPrice}
            placeholder="0.00 (optional)"
          />
        </div>

        {/* In Stock */}
        <div className="flex items-end pb-3">
          <FormField
            name="inStock"
            type="checkbox"
            value={formData.inStock}
            onChange={handleInStockChange}
            placeholder="In Stock"
          />
        </div>
      </div>

      {/* Dynamic Attributes */}
      {loadingSchema ? (
        <div className="flex items-center justify-center py-8">
          <Icon
            icon="mdi:loading"
            className="animate-spin w-6 h-6 text-gray-600"
          />
          <span className="ml-2 text-gray-600 font-[Poppins]">
            Loading attributes...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {attributeSchema.length > 0 ? (
            <>
              {/* Required Attributes */}
              {hasRequiredAttributes && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-4">
                    Required Product Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requiredAttributes.map((field) => (
                      <div
                        key={field.name}
                        className={
                          field.type === "textarea" ? "md:col-span-2" : ""
                        }
                      >
                        <FormField
                          name={`attr.${field.name}`}
                          label={field.label}
                          type={getFormFieldType(field.type)}
                          value={
                            formData.attributes[field.name] ??
                            (field.type === "boolean" ? false : "")
                          }
                          onChange={
                            field.type === "select"
                              ? createDropdownHandler(`attr.${field.name}`)
                              : handleChange
                          }
                          error={errors[`attr.${field.name}`]}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          options={field.options?.map((opt) => ({
                            id: opt,
                            name: opt,
                          }))}
                          rows={4}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-6">
                <FormField
                  name="description"
                  label="Description"
                  type="textarea"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description..."
                  rows={4}
                />
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No attributes configured for this shop type
            </p>
          )}
        </div>
      )}
    </div>
  );
}
