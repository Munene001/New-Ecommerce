"use client";

import { useState } from "react";
import Button from "@/app/components/ui/button";
import FormField from "@/app/components/ui/formField";
import InstructionsList from "@/app/components/ui/instructionList";
import { ShoppingCart, ShoppingBag, ShoppingBasket } from "lucide-react";

interface HeaderFormProps {
  headerMessage: string;
  setHeaderMessage: (value: string) => void;
  cartIcon: string;
  setCartIcon: (value: string) => void;
  onSubmit: (data: { header_message: string; cart_icon: string }) => Promise<boolean>;
  submitting: boolean;
}

export default function HeaderForm({
  headerMessage,
  setHeaderMessage,
  cartIcon,
  setCartIcon,
  onSubmit,
  submitting,
}: HeaderFormProps) {
  const [localHeaderMessage, setLocalHeaderMessage] = useState(headerMessage);
  const [localCartIcon, setLocalCartIcon] = useState(cartIcon);
  const [hasChanges, setHasChanges] = useState(false);

  const cartIconOptions = [
    { id: "cart", name: "Shopping Cart", icon: ShoppingCart },
    { id: "bag", name: "Shopping Bag", icon: ShoppingBag },
    { id: "basket", name: "Shopping Basket", icon: ShoppingBasket },
  ];

  const handleSave = async () => {
    const success = await onSubmit({
      header_message: localHeaderMessage,
      cart_icon: localCartIcon,
    });
    if (success) {
      setHeaderMessage(localHeaderMessage);
      setCartIcon(localCartIcon);
      setHasChanges(false);
    }
  };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string | number) => {
  if (typeof e === "string" || typeof e === "number") return;
  if (e && typeof e === "object" && "target" in e) {
    const { name, value } = e.target;
    if (name === "header_message") {
      setLocalHeaderMessage(value);
    } else if (name === "cart_icon") {
      setLocalCartIcon(value);
    }
    setHasChanges(true);
  }
};

  const IconComponent = cartIconOptions.find(opt => opt.id === localCartIcon)?.icon || ShoppingCart;

  return (
    <div className="space-y-8 md:space-y-5">
      <div>
        <div className="text-xl font-semibold text-black">Header & Cart</div>
      </div>

      <InstructionsList
        items={[
          { text: "Header message appears in the announcement bar at the top of your shop" },
          { text: "Choose your preferred cart icon style that matches your brand" },
        ]}
        variant="green"
      />

      <div className="space-y-6">
        <FormField
          name="header_message"
          label="Header Message"
          type="textarea"
          value={localHeaderMessage}
          onChange={handleChange}
          placeholder="e.g., Get Deals Upto 50% Off!"
          rows={2}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cart Icon Style
          </label>
          <div className="grid grid-cols-3 gap-4">
            {cartIconOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = localCartIcon === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setLocalCartIcon(option.id);
                    setHasChanges(true);
                  }}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                    isSelected
                      ? "border-black bg-gray-50 ring-2 ring-black/20"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Icon className={`w-8 h-8 ${isSelected ? "text-black" : "text-gray-600"}`} />
                  <span className={`text-sm ${isSelected ? "font-medium text-black" : "text-gray-600"}`}>
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Preview:</p>
          <div className="flex items-center gap-2">
            <IconComponent className="w-6 h-6" style={{ color: "var(--secondary)" }} />
            <span className="text-sm text-gray-500">Your cart icon will look like this</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || submitting}
          variant="secondary"
          loading={submitting}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}