// app/(dashboard)/[shopSlug]/reports/components/ReportHighlights.tsx
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

export default function ReportHighlights({ data, loading }: Props) {
  if (loading) return <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return null;

  const { heroUnit, heroProduct, bestSeller } = data;

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-black mb-3">Product highlights</h2>

      {!heroUnit && !heroProduct ? (
        <p className="text-sm text-gray-500">No paid product sales in this period.</p>
      ) : (
        <div className="space-y-3 text-sm text-gray-800 leading-relaxed">
          {heroUnit && (
            <p>
              <span className="font-medium">Most bought item:</span>{" "}
              {heroUnit.type === "variant" ? (
                <>
                  <span className="font-medium">{heroUnit.name}</span> (a variant of{" "}
                  {heroUnit.parent_product})
                </>
              ) : (
                <span className="font-medium">{heroUnit.name}</span>
              )}{" "}
              — {heroUnit.quantity_sold} units sold for{" "}
              {formatCurrency(heroUnit.revenue)}.
            </p>
          )}

          {heroProduct && (
            <p>
              <span className="font-medium">Top product overall:</span>{" "}
              {heroProduct.product_name} — {heroProduct.quantity_sold} units across all variants,{" "}
              {formatCurrency(heroProduct.revenue)}.
              {heroProduct.top_variant && (
                <>
                  {" "}Its best variant was{" "}
                  <span className="font-medium">{heroProduct.top_variant.variant_name}</span> with{" "}
                  {heroProduct.top_variant.quantity_sold} units.
                </>
              )}
            </p>
          )}

          {bestSeller && bestSeller.product_name !== "No products sold yet" && (
            <p>
              <span className="font-medium">Best seller by revenue:</span>{" "}
              {bestSeller.product_name} — {formatCurrency(bestSeller.revenue)}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}