"use client";

import { Hammer, CheckCircle } from "lucide-react";

interface StkPushTabProps {
  isActive: boolean;
}

export default function StkPushTab({ isActive }: StkPushTabProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      {isActive && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 justify-center">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">This is currently your ACTIVE payment method</span>
        </div>
      )}
      
      <Hammer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">STK Push Coming Soon</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Automatic payment prompts on customer phones will be available soon.
        This will allow customers to pay by simply entering their PIN when prompted.
      </p>
      <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block mx-auto">
        <p className="text-sm text-gray-600 font-medium mb-2">Features coming:</p>
        <ul className="text-sm text-gray-500 text-left space-y-1">
          <li>• Paybill STK integration</li>
          <li>• Till STK integration</li>
          <li>• Real-time payment confirmation</li>
          <li>• Automatic transaction verification</li>
        </ul>
      </div>
    </div>
  );
}