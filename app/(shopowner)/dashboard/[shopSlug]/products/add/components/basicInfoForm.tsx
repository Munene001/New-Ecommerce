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

  // ✅ Separate required and optional attributes (filter out variant attributes)
  const productAttributes = attributeSchema.filter((f) => f.variant !== true);
  const requiredAttributes = productAttributes.filter((f) => f.required);
  const optionalAttributes = productAttributes.filter((f) => !f.required);
  const hasRequiredAttributes = requiredAttributes.length > 0;
  const hasOptionalAttributes = optionalAttributes.length > 0;

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

      {/* ✅ Required Section */}
      <div className="bg-gray-50 rounded-xl border-2 border-gray-300 p-6">
        <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:asterisk-circle" className="w-5 h-5 text-orange-500" />
          Required Information
          <span className="text-sm font-normal text-gray-400">
            (fields marked with <span className="text-orange-500">*</span>)
          </span>
        </h3>

        <div className="space-y-6">
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

          {/* Required Attributes */}
          {hasRequiredAttributes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                      className="border-gray-400 focus:border-orange-500"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Optional Section - includes Description and Optional Attributes */}
      <div className="bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-600 flex items-center gap-2">
            <Icon icon="mdi:tag-outline" className="w-5 h-5 text-gray-400" />
            Optional Information
            <span className="text-sm font-normal text-gray-400">
              (optional fields)
            </span>
          </h3>
          <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
            Optional
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          These fields are not required but help provide more product details
        </p>

        <div className="space-y-6">
          {/* ✅ Description - Now in Optional section */}
          <div className="relative">
            <InputField
              name="description"
              label="Description"
              type="textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your product in detail..."
              rows={4}
              className="border-gray-300 focus:border-orange-400 bg-white/80"
            />
            <span className="absolute top-0 right-0 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded border border-gray-200">
              Optional
            </span>
          </div>

          {/* Optional Attributes */}
          {hasOptionalAttributes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {optionalAttributes.map((field) => {
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
                    <div className="relative">
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
                        placeholder={`Optional - enter ${field.label.toLowerCase()}`}
                        options={field.options?.map((opt) => ({
                          id: opt,
                          name: opt,
                        }))}
                        rows={field.type === "textarea" ? 3 : undefined}
                        className="border-gray-300 focus:border-orange-400 bg-white/80"
                      />
                      <span className="absolute top-0 right-0 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded border border-gray-200">
                        Optional
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadingSchema && (
        <div className="flex items-center justify-center py-8">
          <Icon
            icon="mdi:loading"
            className="animate-spin w-6 h-6 text-orange-500"
          />
          <span className="ml-2 text-gray-500 font-[Poppins]">
            Loading attributes...
          </span>
        </div>
      )}
    </div>
  );
}