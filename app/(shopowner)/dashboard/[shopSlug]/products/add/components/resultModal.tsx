"use client";

import { Icon } from "@iconify/react";
import Button from "@/app/components/ui/button";

interface ResultModalProps {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
}

export default function ResultModal({ 
  isOpen, 
  type, 
  title, 
  message, 
  onClose 
}: ResultModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          {type === 'success' ? (
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Icon icon="mdi:check-circle" className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-600" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end">
          <Button 
            onClick={onClose}
            variant={type === 'success' ? 'secondary' : 'secondary'}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}