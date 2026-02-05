"use client";

import React from "react";
import { X } from "lucide-react";
import Button from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info" 
}: ModalProps) {
  if (!isOpen) return null;

 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-three`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="mb-6 text-white">{message}</p>
        
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}