"use client";

import FormField from "@/app/components/ui/formField";
import InstructionsList from "@/app/components/ui/instructionList";

interface LocationFormProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: Record<string, string>;
}

export default function LocationForm({ formData, setFormData, errors }: LocationFormProps) {
  const handleChange = (e: React.ChangeEvent<any> | string | number) => {
    if (typeof e === "string" || typeof e === "number") return;
    if (e && typeof e === "object" && "target" in e) {
      const { name, value } = e.target;
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Location</div>
      </div>
      
      <InstructionsList
        items={[
          { text: "Your shop location helps customers find you" },
          { text: "Town/City and address are displayed on your shop page" },
        ]}
        variant="green"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          name="business_town"
          label="Town/City"
          type="text"
          value={formData.business_town}
          onChange={handleChange}
          placeholder="e.g., Nairobi"
          error={errors.business_town}
        />
        
        <div className="md:col-span-2">
          <FormField
            name="business_address"
            label="Address"
            type="text"
            value={formData.business_address}
            onChange={handleChange}
            placeholder="Street name, building, floor"
            error={errors.business_address}
          />
        </div>
      </div>
    </div>
  );
}