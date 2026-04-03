"use client";

import FormField from "@/app/components/ui/formField";
import InstructionsList from "@/app/components/ui/instructionList";

interface ShopInfoFormData {
  shop_name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  description: string;
}

interface ShopInfoFormProps {
  formData: ShopInfoFormData;
  setFormData: (data: ShopInfoFormData | ((prev: ShopInfoFormData) => ShopInfoFormData)) => void;
  errors: Record<string, string>;
}

export default function ShopInfoForm({ formData, setFormData, errors }: ShopInfoFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => {
    if (typeof e === "string" || typeof e === "number") return;
    if (e && typeof e === "object" && "target" in e) {
      const { name, value } = e.target;
      setFormData((prev: ShopInfoFormData) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Shop Information</div>
      </div>
      
      <InstructionsList
        items={[
          { text: "Your shop name appears in the header and search results" },
          { text: "Contact details are displayed to customers on your shop page" },
          { text: "WhatsApp number enables customers to message you directly" },
        ]}
        variant="green"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          name="shop_name"
          label="Shop Name"
          type="text"
          value={formData.shop_name}
          onChange={handleChange}
          placeholder="Enter shop name"
          required
          error={errors.shop_name}
        />
        
        <FormField
          name="contact_email"
          label="Contact Email"
          type="email"
          value={formData.contact_email}
          onChange={handleChange}
          placeholder="shop@example.com"
          error={errors.contact_email}
        />
        
        <FormField
          name="contact_phone"
          label="Contact Phone"
          type="tel"
          value={formData.contact_phone}
          onChange={handleChange}
          placeholder="254712345678"
          error={errors.contact_phone}
        />
        
        <FormField
          name="whatsapp_number"
          label="WhatsApp Number"
          type="tel"
          value={formData.whatsapp_number}
          onChange={handleChange}
          placeholder="254712345678"
          error={errors.whatsapp_number}
        />
        
        <div className="md:col-span-2">
          <FormField
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