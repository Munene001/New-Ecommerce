// app/(dashboard)/[shopSlug]/reports/components/ReportProductsTable.tsx
"use client";

import type { ReportData } from "../hooks/useReports";

interface Props {
  data: ReportData | null;
  loading: boolean;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function ReportProductsTable({ data, loading }: Props) {
  if (loading) return <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return null;

  const products = data.topProducts ?? [];
  const variants = data.topVariants ?? [];

  const variantByProduct = new Map<string, { variant_name: string; quantity_sold: number }>();
  variants.forEach((v) => {
    if (!variantByProduct.has(v.product_name)) {
      variantByProduct.set(v.product_name, {
        variant_name: v.variant_name,
        quantity_sold: v.quantity_sold,
      });
    }
  });

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-black mb-1">Top products</h2>
      <p className="text-sm text-gray-600 mb-4">
        The five best-selling products by units, with each product's top-selling variant.
      </p>

      {products.length === 0 ? (
        <p className="text-sm text-gray-500">No paid product sales in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-gray-700">
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 font-medium">Top variant</th>
                <th className="py-2 pr-3 font-medium text-right">Units</th>
                <th className="py-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const v = variantByProduct.get(p.product_name);
                return (
                  <tr key={p.product_name} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-3 text-black">{p.product_name}</td>
                    <td className="py-2 pr-3 text-gray-700">
                      {v ? `${v.variant_name} (${v.quantity_sold})` : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right text-black">{p.quantity_sold}</td>
                    <td className="py-2 text-right text-black">{formatCurrency(p.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}