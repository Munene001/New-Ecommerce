"use client";

import { useState, useEffect } from "react";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import { Category } from "../types";

interface CategoryComponentProps {
  shopId: number;
  onCategoryCreated: (category: Category) => void;
  onCategoryError?: (errorMessage: string) => void;
  onCancel: () => void;
  // ❌ Remove token prop - no longer needed
}

export default function CategoryComponent({
  shopId,
  onCategoryCreated,
  onCategoryError,
  onCancel,
  // ❌ Remove token from props
}: CategoryComponentProps) {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      const errorMsg = "Category name is required";
      setError(errorMsg);
      onCategoryError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/shopowner/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ❌ Remove Authorization header - cookies are sent automatically
        },
        body: JSON.stringify({
          shopId,
          categoryName: categoryName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error?.includes("already exists")) {
          throw new Error("Category already exists");
        }
        throw new Error(data.error || "Failed to create category");
      }

      onCategoryCreated({
        id: data.category_id,
        name: categoryName.trim(),
      });
      setCategoryName("");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create category";
      setError(errorMsg);
      onCategoryError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-2 items-start">
        <div className="md:flex-1">
          <Input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="New category name"
            className="bg-white border-gray-300 !text-black placeholder-gray-600"
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