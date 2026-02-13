"use client";

import { useState } from "react";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import { Category } from "../types";// Import shared type

interface CategoryComponentProps {
  shopId: number;
  onCategoryCreated: (category: Category) => void;
  onCancel: () => void;
}

export default function CategoryComponent({
  shopId,
  onCategoryCreated,
  onCancel
}: CategoryComponentProps) {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/shopowner/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          categoryName: categoryName.trim()
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }
      
      onCategoryCreated({
        id: data.category_id,
        name: categoryName.trim()
      });
      
      setCategoryName("");
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <div className="flex-1">
        <Input
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="New category name"
          error={error}
          className="bg-white border-gray-300 text-gray-900"
        />
      </div>
      <Button type="submit" variant="primary" loading={loading}>
        Save
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}