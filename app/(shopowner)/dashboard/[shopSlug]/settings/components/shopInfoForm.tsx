"use client";

import FormInput from "@/app/components/ui/formInput";

interface ShopInfoFormData {
  shop_name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  description: string;
}

interface ShopInfoFormProps {
  formData: ShopInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<any>>; // Accept any or full type
}

export default function ShopInfoForm({ formData, setFormData }: ShopInfoFormProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Shop Information</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          name="shop_name"
          label="Shop Name"
          type="text"
          value={formData.shop_name}
          onChange={handleChange}
          placeholder="Enter shop name"
          required
          icon="user"
        />

        <FormInput
          name="contact_email"
          label="Contact Email"
          type="email"
          value={formData.contact_email}
          onChange={handleChange}
          placeholder="shop@example.com"
          icon="mail"
        />

        <FormInput
          name="contact_phone"
          label="Contact Phone"
          type="tel"
          value={formData.contact_phone}
          onChange={handleChange}
          placeholder="254712345678"
          icon="phone"
        />

        <FormInput
          name="whatsapp_number"
          label="WhatsApp Number"
          type="tel"
          value={formData.whatsapp_number}
          onChange={handleChange}
          placeholder="254712345678"
          icon="message"
        />

        <div className="md:col-span-2">
          <FormInput
            name="description"
            label="Shop Description"
            type="textarea"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your shop..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}