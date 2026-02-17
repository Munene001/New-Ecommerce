"use client";

import { useState, useEffect } from "react";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import { Category } from "../types";
import { Icon } from "@iconify/react";

interface CategoryComponentProps {
  shopId: number;
  onCategoryCreated: (category: Category) => void;
  onCategoryError?: (errorMessage: string) => void; // Add this
  onCancel: () => void;
}

export default function CategoryComponent({
  shopId,
  onCategoryCreated,
  onCategoryError,
  onCancel
}: CategoryComponentProps) {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear error after 6 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      const errorMsg = "Category name is required";
      setError(errorMsg);
      if (onCategoryError) onCategoryError(errorMsg);
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
        // Check for duplicate category error
        if (res.status === 409 || data.error?.includes("already exists")) {
          throw new Error("Category already exists");
        }
        throw new Error(data.error || "Failed to create category");
      }
      
      onCategoryCreated({
        id: data.category_id,
        name: categoryName.trim()
      });
      
      setCategoryName("");
      
    } catch (err: any) {
      const errorMsg = err.message;
      setError(errorMsg);
      if (onCategoryError) onCategoryError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
     
     
      
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <Input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="New category name"
            className="bg-white border-gray-300 text-gray-900"
          />
        </div>
        <Button type="submit" variant="primary" loading={loading}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}