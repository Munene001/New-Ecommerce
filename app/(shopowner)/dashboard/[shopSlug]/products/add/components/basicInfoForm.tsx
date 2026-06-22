"use client";

import { Icon } from "@iconify/react";
import InputField from "@/app/components/ui/inputField";
import { Attribute, ProductFormData } from "../types";
import InstructionsList from "@/app/components/ui/instructionList";

interface BasicInfoFormProps {
  formData: ProductFormData;
  setFormData: (
    data: ProductFormData | ((prev: ProductFormData) => ProductFormData),
  ) => void;
  attributeSchema: Attribute[];
  loadingSchema: boolean;
  errors: Record<string, string>;
}

export default function BasicInfoForm({
  formData,
  setFormData,
  attributeSchema,
  loadingSchema,
  errors,
}: BasicInfoFormProps) {
  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | string
      | number,
  ) => {
    if (typeof e === "string" || typeof e === "number") {
      return;
    }

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

  const createDropdownHandler = (name: string) => {
    const dropdownHandler = handleDropdownChange(name);

    return (
      e:
        | React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >
        | string
        | number,
    ) => {
      if (typeof e === "string" || typeof e === "number") {
        dropdownHandler(e);
      } else if (e && typeof e === "object" && "target" in e) {
        dropdownHandler(e.target.value);
      }
    };
  };

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

  const requiredAttributes = attributeSchema.filter((f) => f.required);
  const hasRequiredAttributes = requiredAttributes.length > 0;

  // ✅ Check if there are any errors for this step
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter the core details about your product
        </p>
      </div>

      {/* ✅ Error Banner - shows when auto-navigated with errors */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">
              Please fix the following errors:
            </p>
            <ul className="text-sm text-red-600 mt-1 space-y-0.5">
              {Object.entries(errors).map(([key, message]) => (
                <li key={key}>• {message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Instructions */}
      <InstructionsList
        items={[
          {
            text: (
              <>
                <span className="text-orange-500">*</span> fields are required
              </>
            ),
          },
          {
            text: "Product slug is auto-generated from the name",
          },
          {
            text: "All product attributes will be saved with the product",
          },
        ]}
        variant="green"
      />

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <InputField
          name="productName"
          label="Product Name"
          value={formData.productName}
          onChange={handleNameChange}
          error={errors.productName}
          placeholder="e.g., Summer T-Shirt"
          required
          icon="mdi:package-variant"
        />

        {/* Product Slug */}
        <InputField
          name="productSlug"
          label="Product Slug"
          value={formData.productSlug}
          onChange={handleChange}
          error={errors.productSlug}
          placeholder="summer-t-shirt"
          required
          icon="mdi:link"
          helpText="URL-friendly version of the product name"
        />
      </div>

      {/* Description */}
      <InputField
        name="description"
        label="Description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Describe your product in detail..."
        rows={4}
        helpText="Optional - helps customers understand your product"
      />

      {/* Dynamic Attributes */}
      {loadingSchema ? (
        <div className="flex items-center justify-center py-8">
          <Icon
            icon="mdi:loading"
            className="animate-spin w-6 h-6 text-orange-500"
          />
          <span className="ml-2 text-gray-500 font-[Poppins]">
            Loading attributes...
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {attributeSchema.length > 0 ? (
            <>
              {hasRequiredAttributes && (
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <Icon icon="mdi:tag-outline" className="w-5 h-5 text-orange-500" />
                    Product Attributes
                    <span className="text-sm font-normal text-gray-400">
                      ({requiredAttributes.length} required)
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requiredAttributes.map((field) => {
                      const isSelect = field.type === "select";
                      const isTextarea = field.type === "textarea";
                      const isCheckbox = field.type === "boolean";
                      const value = formData.attributes[field.name] ?? (isCheckbox ? false : "");
                      const errorKey = `attr.${field.name}`;

                      return (
                        <div
                          key={field.name}
                          className={isTextarea ? "md:col-span-2" : ""}
                        >
                          <InputField
                            name={`attr.${field.name}`}
                            label={field.label}
                            type={getFormFieldType(field.type)}
                            value={value}
                            onChange={
                              field.type === "select"
                                ? createDropdownHandler(`attr.${field.name}`)
                                : handleChange
                            }
                            error={errors[errorKey]}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            options={field.options?.map((opt) => ({
                              id: opt,
                              name: opt,
                            }))}
                            rows={field.type === "textarea" ? 3 : undefined}
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Icon icon="mdi:info-outline" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No attributes configured for this shop type</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}