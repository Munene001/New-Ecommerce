"use client";

import { useState } from "react";
import Button from "@/app/components/ui/button";
import FormField from "@/app/components/ui/formField";
import InstructionsList from "@/app/components/ui/instructionList";

interface ColorFormProps {
  secondaryColor: string;
  setSecondaryColor: (value: string) => void;
  onSubmit: (data: { secondary_color: string }) => Promise<boolean>;
  submitting: boolean;
}

export default function ColorForm({
  secondaryColor,
  setSecondaryColor,
  onSubmit,
  submitting,
}: ColorFormProps) {
  const [localColor, setLocalColor] = useState(secondaryColor);
  const [hasChanges, setHasChanges] = useState(false);

  const handleColorChange = (e: React.ChangeEvent<any> | string | number) => {
    if (typeof e === "string" || typeof e === "number") {
      setLocalColor(String(e));
      setHasChanges(true);
      return;
    }
    if (e && typeof e === "object" && "target" in e) {
      setLocalColor(e.target.value);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    const success = await onSubmit({ secondary_color: localColor });
    if (success) {
      setSecondaryColor(localColor);
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Colors</div>
      </div>

      <InstructionsList
        items={[
          { text: "Secondary color is used for buttons, sale badges, and interactive elements" },
          { text: "Choose a color that represents your brand and stands out" },
        ]}
        variant="green"
      />

      <div className="space-y-6">
        <FormField
          name="secondary_color"
          label="Secondary Color"
          type="color"
          value={localColor}
          onChange={handleColorChange}
          placeholder="#f54a00"
        />

        {/* Preview Section - Centered */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-4">Preview:</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: localColor }}
            >
              Button Preview
            </button>
            <span 
              className="px-3 py-1.5 rounded-full text-white text-xs font-medium inline-flex items-center justify-center"
              style={{ backgroundColor: localColor }}
            >
              Sale
            </span>
            <span 
              className="px-3 py-1.5 rounded-full text-white text-xs font-medium inline-flex items-center justify-center"
              style={{ backgroundColor: localColor }}
            >
              New
            </span>
            <span 
              className="px-3 py-1.5 rounded-full text-white text-xs font-medium inline-flex items-center justify-center"
              style={{ backgroundColor: localColor }}
            >
              Discount
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || submitting}
          variant="secondary"
          loading={submitting}
          className="px-6 py-3"
        >
          Save Color
        </Button>
      </div>
    </div>
  );
}