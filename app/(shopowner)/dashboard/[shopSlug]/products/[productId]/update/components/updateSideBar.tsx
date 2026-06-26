"use client";

import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface StepStatus {
  status: 'active' | 'completed' | 'error' | 'incomplete';
  hasErrors: boolean;
}

interface UpdateSidebarProps {
  sections: string[];
  activeIndex: number;
  stepStatuses: StepStatus[];
  percentage: number;
  completedSteps: number;
  totalSteps: number;
  canPublish: boolean;
  hasFailedImages: boolean;
  onTabClick: (index: number) => void;
}

export default function UpdateSidebar({
  sections,
  activeIndex,
  stepStatuses,
  percentage,
  completedSteps,
  totalSteps,
  canPublish,
  hasFailedImages,
  onTabClick,
}: UpdateSidebarProps) {
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-black rounded-lg shadow-sm sticky top-6 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Steps</h2>
        </div>
        <nav className="p-2 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sections.map((section, index) => {
            const { status, hasErrors } = stepStatuses[index] || { status: 'incomplete' as const, hasErrors: false };
            const isActive = index === activeIndex;

            let icon;
            if (hasErrors && status !== 'active') {
              icon = <AlertCircle className="w-4 h-4 text-red-400" />;
            } else if (status === 'completed') {
              icon = <CheckCircle className="w-4 h-4 text-green-400" />;
            } else if (status === 'active') {
              icon = <Circle className="w-4 h-4 text-orange-400" />;
            } else {
              icon = <Circle className="w-4 h-4 text-gray-600" />;
            }

            return (
              <button
                key={section}
                onClick={() => onTabClick(index)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-400'
                    : hasErrors && status !== 'active'
                    ? 'text-red-400 hover:bg-red-900/10'
                    : status === 'completed'
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-500 hover:bg-gray-800'
                }`}
              >
                <span className="flex-shrink-0">{icon}</span>
                <span className="flex-1 text-left font-medium">
                  {section}
                  {status === 'completed' && (
                    <span className="ml-2 text-green-400">✓</span>
                  )}
                  {hasErrors && status !== 'active' && (
                    <span className="ml-2 text-red-400 text-xs">!</span>
                  )}
                </span>
                {isActive && (
                  <span className="w-1.5 h-6 bg-orange-400 rounded-full flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Complete</span>
            <span className="text-white font-medium">{percentage}%</span>
          </div>
          <div className="w-full h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-gray-400">{completedSteps} of {totalSteps} steps complete</span>
            {canPublish && !hasFailedImages && (
              <span className="inline-flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Ready to publish
              </span>
            )}
            {hasFailedImages && (
              <span className="inline-flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                Fix image errors
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}