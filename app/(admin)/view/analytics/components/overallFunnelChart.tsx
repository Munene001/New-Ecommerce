// app/admin/analytics/components/overallFunnelChart.tsx
'use client';

interface OverallFunnelChartProps {
  funnel: {
    signup_email: number;
    email_verification_sent: number;
    email_verification_success: number;
  };
}

export default function OverallFunnelChart({ funnel }: OverallFunnelChartProps) {
  const stages = [
    { key: 'signup_email', label: 'Signup Started' },
    { key: 'email_verification_sent', label: 'Verification Sent' },
    { key: 'email_verification_success', label: 'Verification Success' },
  ];

  const total = funnel.signup_email || 1;

  const getPercentage = (value: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  const getDropOff = (currentValue: number, nextValue: number) => {
    if (currentValue === 0) return '0.0';
    const dropPercent = ((currentValue - nextValue) / currentValue) * 100;
    return dropPercent.toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const value = funnel[stage.key as keyof typeof funnel];
          const percentage = getPercentage(value);
          const nextStage = stages[index + 1];
          const nextValue = nextStage ? funnel[nextStage.key as keyof typeof funnel] : null;
          const dropOff = nextValue ? getDropOff(value, nextValue) : null;
          
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-40">
                    {stage.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {value.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({percentage}%)
                  </span>
                </div>
                {dropOff && parseFloat(dropOff) > 0 && (
                  <div className="text-xs text-red-500">
                    ↓ {dropOff}% drop to {nextStage?.label}
                  </div>
                )}
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="bg-magenta-dark h-full rounded-full flex items-center justify-end pr-3 text-white text-xs font-medium transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                >
                  {parseFloat(percentage) > 15 && `${percentage}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Overall Completion Rate: {getPercentage(funnel.email_verification_success)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {funnel.signup_email.toLocaleString()} signups → {funnel.email_verification_success.toLocaleString()} verified
          </p>
        </div>
      </div>
    </div>
  );
}