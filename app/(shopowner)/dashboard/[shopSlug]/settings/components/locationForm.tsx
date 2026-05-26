"use client";
import FormInput from "@/app/components/ui/formInput";

interface LocationFormData {
  business_town: string;
  business_address: string;
}

interface LocationFormProps {
  formData: LocationFormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>; 
}

export default function LocationForm({ formData, setFormData }: LocationFormProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Location</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          name="business_town"
          label="Town/City"
          type="text"
          value={formData.business_town}
          onChange={handleChange}
          placeholder="e.g., Nairobi"
          icon="mapPin"
        />

        <div className="md:col-span-2">
          <FormInput
            name="business_address"
            label="Address"
            type="text"
            value={formData.business_address}
            onChange={handleChange}
            placeholder="Street name, building, floor"
            icon="home"
          />
        </div>
      </div>
    </div>
  );
}