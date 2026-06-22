"use client";

import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import InputField from "@/app/components/ui/inputField";
import { ProductFormData, ProductVariant, Attribute } from "../types";
import InstructionsList from "@/app/components/ui/instructionList";

interface PricingFormProps {
  formData: ProductFormData;
  setFormData: (
    data: ProductFormData | ((prev: ProductFormData) => ProductFormData),
  ) => void;
  variantAttributes: Attribute[];
  selectedVariantAttrs: string[];
  toggleVariantAttribute: (attrName: string) => void;
  addVariant: () => void;
  removeVariant: (index: number) => void;
  updateVariant: (index: number, field: string, value: any) => void;
  errors: Record<string, string>;
}

export default function PricingForm({
  formData,
  setFormData,
  variantAttributes,
  selectedVariantAttrs,
  toggleVariantAttribute,
  addVariant,
  removeVariant,
  updateVariant,
  errors,
}: PricingFormProps) {
  const isVariable = formData.productType === "variable";
  const hasErrors = Object.keys(errors).length > 0;

  // ✅ Auto-add 2 variants when product becomes variable
  useEffect(() => {
    if (isVariable && formData.variants.length === 0) {
      // Add 2 empty variants
      addVariant();
      addVariant();
    }
  }, [isVariable, formData.variants.length, addVariant]);

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
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNumberChange = (name: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number
  ) => {
    if (typeof e === "object" && "target" in e) {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (typeof e === "string" || typeof e === "number") {
      setFormData((prev) => ({ ...prev, [name]: e }));
    }
  };

  const handleVariantAttributeChange = (
    index: number,
    attrName: string,
    value: string
  ) => {
    const currentAttrs = formData.variants[index].attributes;
    updateVariant(index, "attributes", {
      ...currentAttrs,
      [attrName]: value,
    });
  };

  const handleVariantPriceChange = (index: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number
  ) => {
    const value = typeof e === "object" && "target" in e ? e.target.value : e;
    updateVariant(index, "price", String(value));
  };

  const handleVariantDiscountChange = (index: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number
  ) => {
    const value = typeof e === "object" && "target" in e ? e.target.value : e;
    updateVariant(index, "discountPrice", String(value));
  };

  const handleVariantStockChange = (index: number) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number
  ) => {
    const value = typeof e === "object" && "target" in e ? Number(e.target.value) : Number(e);
    updateVariant(index, "stockQuantity", value);
  };

  const handleSingleAttributeChange = (attrName: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number
  ) => {
    const value = typeof e === "object" && "target" in e ? e.target.value : e;
    setFormData((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attrName]: value,
      },
    }));
  };

  const hasVariantAttrs = variantAttributes.length > 0;
  const isSimple = !isVariable;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Pricing & Inventory</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your product's pricing and variations
        </p>
      </div>

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

      <InstructionsList
        items={[
          {
            text: (
              <>
                Answer the questions below to determine your product type
              </>
            ),
          },
          {
            text: "If all answers are 'No', it's a simple product",
          },
          {
            text: "If any answer is 'Yes', you'll add variations",
          },
        ]}
        variant="green"
      />

      {/* Questions Section */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Icon icon="mdi:question-mark-circle" className="w-5 h-5 text-orange-500" />
          Does this product come in multiple variations?
        </h3>

        {hasVariantAttrs ? (
          variantAttributes.map((attr) => {
            const isSelected = selectedVariantAttrs.includes(attr.name);
            const label = attr.label.replace(/\([^)]*\)/, "").trim();
            
            return (
              <div key={attr.name} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      Does this product come in more than one {label.toLowerCase()}?
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {attr.name === "sizes" && "e.g., S, M, L, XL"}
                      {attr.name === "colors" && "e.g., Red, Blue, Black"}
                      {attr.name === "dosage" && "e.g., 500mg, 250mg, 100mg"}
                      {attr.name === "cover_type" && "e.g., Hardcover, Softcover"}
                      {attr.name === "size" && "e.g., S, M, L"}
                      {attr.name === "color" && "e.g., Red, Blue"}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isSelected) {
                          toggleVariantAttribute(attr.name);
                          setFormData((prev) => ({ ...prev, productType: "variable" }));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-orange-500 text-white"
                          : "bg-white border-2 border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          toggleVariantAttribute(attr.name);
                          if (selectedVariantAttrs.length === 1) {
                            setFormData((prev) => ({ ...prev, productType: "simple", variants: [] }));
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        !isSelected
                          ? "bg-orange-500 text-white"
                          : "bg-white border-2 border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {!isSelected && (
                  <div className="mt-3 ml-0 md:ml-6">
                    <InputField
                      name={`single.${attr.name}`}
                      label={`Single ${label}`}
                      value={formData.attributes[attr.name] as string || ""}
                      onChange={handleSingleAttributeChange(attr.name)}
                      placeholder={`Enter single ${label.toLowerCase()}`}
                      helpText={`This ${label.toLowerCase()} applies to all variants`}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No variant attributes available for this shop type
          </p>
        )}
      </div>

      {/* Simple Product Pricing */}
      {isSimple && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:package" className="w-5 h-5 text-orange-500" />
            <h3 className="text-md font-medium text-gray-800">Simple Product Pricing</h3>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Single variation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField
              name="price"
              label="Price (KES)"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              placeholder="0.00"
              required
              icon="mdi:currency-kes"
            />

            <InputField
              name="discountPrice"
              label="Discount Price (KES)"
              type="number"
              value={formData.discountPrice || ""}
              onChange={handleChange}
              error={errors.discountPrice}
              placeholder="0.00 (optional)"
              icon="mdi:sale"
            />

            <InputField
              name="stockQuantity"
              label="Stock Quantity"
              type="number"
              value={formData.stockQuantity}
              onChange={handleNumberChange("stockQuantity")}
              placeholder="0"
              icon="mdi:package-variant-closed"
            />
          </div>
        </div>
      )}

      {/* Variable Product Variants Grid */}
      {isVariable && (
        <div className="bg-white rounded-xl border-2 border-orange-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:view-grid" className="w-5 h-5 text-orange-500" />
              <h3 className="text-md font-medium text-gray-800">Variations</h3>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                {formData.variants.length} variants
              </span>
            </div>
            {/* ✅ Changed from "Add Variant" to "Add Row" */}
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              Add Row
            </button>
          </div>

          {errors.variants && (
            <p className="text-sm text-red-500">{errors.variants}</p>
          )}

          {formData.variants.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Icon icon="mdi:grid-off" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No variants added yet</p>
              <p className="text-gray-400 text-xs mt-1">Click "Add Row" to create variations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {selectedVariantAttrs.map((attr) => {
                      const label = variantAttributes.find(a => a.name === attr)?.label.replace(/\([^)]*\)/, "").trim() || attr;
                      return (
                        <th key={attr} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {label}
                        </th>
                      );
                    })}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price <span className="text-orange-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.variants.map((variant, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {selectedVariantAttrs.map((attr) => {
                        const errorKey = `variant_${index}_${attr}`;
                        return (
                          <td key={attr} className="px-4 py-2">
                            <InputField
                              name={`variant.${index}.${attr}`}
                              value={variant.attributes[attr] || ""}
                              onChange={(e) => {
                                const val = typeof e === "object" && "target" in e 
                                  ? e.target.value 
                                  : e;
                                handleVariantAttributeChange(index, attr, val as string);
                              }}
                              placeholder={attr}
                              error={errors[errorKey]}
                              className="min-w-[80px]"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-2">
                        <InputField
                          name={`variant.${index}.price`}
                          type="number"
                          value={variant.price}
                          onChange={handleVariantPriceChange(index)}
                          placeholder="0.00"
                          error={errors[`variant_${index}_price`]}
                          className="min-w-[80px]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <InputField
                          name={`variant.${index}.discount`}
                          type="number"
                          value={variant.discountPrice || ""}
                          onChange={handleVariantDiscountChange(index)}
                          placeholder="0.00"
                          error={errors[`variant_${index}_discount`]}
                          className="min-w-[80px]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <InputField
                          name={`variant.${index}.stock`}
                          type="number"
                          value={variant.stockQuantity}
                          onChange={handleVariantStockChange(index)}
                          placeholder="0"
                          className="min-w-[60px]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {formData.variants.length > 0 && (
            <div className="flex gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
              <span>
                Total variants: <span className="font-medium text-gray-700">{formData.variants.length}</span>
              </span>
              <span>
                Price range: <span className="font-medium text-gray-700">
                  KES {Math.min(...formData.variants.map(v => Number(v.price) || 0))} - 
                  KES {Math.max(...formData.variants.map(v => Number(v.price) || 0))}
                </span>
              </span>
              <span>
                Total stock: <span className="font-medium text-gray-700">
                  {formData.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)}
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}