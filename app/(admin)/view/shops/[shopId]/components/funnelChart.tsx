// app/admin/shops/[shopId]/analytics/components/funnelChart.tsx
'use client';

interface FunnelChartProps {
  data: {
    shop_view: number;
    product_view: number;
    add_to_cart: number;
    checkout_page_view: number;
    order_placed: number;
    payment_success: number;
  };
  viewMode: 'sessions' | 'ip';
}

export default function FunnelChart({ data, viewMode }: FunnelChartProps) {
  const stages = [
    { key: 'add_to_cart', label: 'Add to Cart' },
    { key: 'checkout_page_view', label: 'Checkout Started' },
    { key: 'order_placed', label: 'Order Placed' },
    { key: 'payment_success', label: 'Payment Success' },
  ];

  const total = data.add_to_cart || 1;

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
      {/* Analytics Cards at the top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Shop Views</p>
          <p className="text-2xl font-bold text-gray-800">{data.shop_view.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total visits to your shop</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Product Views</p>
          <p className="text-2xl font-bold text-gray-800">{data.product_view.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Products browsed by customers</p>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500 text-center">
        {viewMode === 'sessions' ? 'Showing data per visit' : 'Showing data per unique person'}
      </div>
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const value = data[stage.key as keyof typeof data];
          const percentage = getPercentage(value);
          const nextStage = stages[index + 1];
          const nextValue = nextStage ? data[nextStage.key as keyof typeof data] : null;
          const showDropOff = nextValue !== null;
          const dropOff = showDropOff ? getDropOff(value, nextValue) : null;
          
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-36">
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
            Cart to Purchase: {getPercentage(data.payment_success)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {data.add_to_cart.toLocaleString()} carts → {data.payment_success.toLocaleString()} purchases
          </p>
        </div>
      </div>
    </div>
  );
}