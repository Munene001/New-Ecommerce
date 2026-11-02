// app/(dashboard)/[shopSlug]/reports/hooks/useReports.ts
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useShop } from "@/app/(shopowner)/shopownerContext";

export type PeriodPreset = "month" | "last3" | "last6" | "last12" | "all" | "custom";

export interface AvailableMonth { ym: string; orders: number; revenue: number }

export interface HeroUnit {
  type: "variant" | "product";
  name: string;
  parent_product: string;
  variant_id: number | null;
  product_id: number;
  quantity_sold: number;
  revenue: number;
}

export interface HeroProduct {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  revenue: number;
  top_variant: { variant_id: number; variant_name: string; quantity_sold: number } | null;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalPaidOrders: number;
  averageOrderValue: number;
  totalAllOrders: number;
  collectionRate: number;
  avgItemsPerOrder: number;
  returningCustomersRate: number;
  weekendVsWeekday: { weekend: number; weekday: number; weekend_percentage: number; weekday_percentage: number };
}

export interface ReportData {
  heroUnit: HeroUnit | null;
  heroProduct: HeroProduct | null;
  summary: AnalyticsSummary;
  topProducts: Array<{ product_name: string; quantity_sold: number; revenue: number }>;
  bestSeller: { product_name: string; revenue: number };
  paymentSplit: { mpesa: number; cod: number; mpesa_percentage: number; cod_percentage: number };
  hourlyDistribution: Array<{ hour: number; order_count: number }>;
  ordersByCity: Array<{ city: string; order_count: number; revenue: number }>;
  topVariants: Array<{ variant_id: number; variant_name: string; product_name: string; quantity_sold: number; revenue: number }>;
  sourceSplit: { online: { orders: number; revenue: number }; pos: { orders: number; revenue: number } };
  monthlySeries: Array<{ ym: string; orders: number; revenue: number }>;
  appliedFilters: { date_from: string | null; date_to: string | null; source: "online" | "pos" | null };
}

export interface ResolvedRange { date_from: string | null; date_to: string | null }

export interface PreviousTotals {
  revenue: number;
  paidOrders: number;
  /** e.g. "the previous month", "the previous 3 months" — used in prose */
  label: string;
}

// ---------- date helpers ----------
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function firstDayOfMonth(year: number, monthIdx: number): string {
  return toIsoDate(new Date(year, monthIdx, 1));
}
function lastDayOfMonth(year: number, monthIdx: number): string {
  return toIsoDate(new Date(year, monthIdx + 1, 0));
}

export function resolveRange(preset: PeriodPreset, selectedYm: string): ResolvedRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "month":
      return { date_from: firstDayOfMonth(y, m), date_to: lastDayOfMonth(y, m) };
    case "last3": {
      const start = new Date(y, m - 2, 1);
      return { date_from: firstDayOfMonth(start.getFullYear(), start.getMonth()), date_to: lastDayOfMonth(y, m) };
    }
    case "last6": {
      const start = new Date(y, m - 5, 1);
      return { date_from: firstDayOfMonth(start.getFullYear(), start.getMonth()), date_to: lastDayOfMonth(y, m) };
    }
    case "last12": {
      const start = new Date(y, m - 11, 1);
      return { date_from: firstDayOfMonth(start.getFullYear(), start.getMonth()), date_to: lastDayOfMonth(y, m) };
    }
    case "all":
      return { date_from: null, date_to: null };
    case "custom": {
      if (!selectedYm || !/^\d{4}-\d{2}$/.test(selectedYm)) {
        return { date_from: firstDayOfMonth(y, m), date_to: lastDayOfMonth(y, m) };
      }
      const [yy, mm] = selectedYm.split("-").map(Number);
      return { date_from: firstDayOfMonth(yy, mm - 1), date_to: lastDayOfMonth(yy, mm - 1) };
    }
    default:
      return { date_from: null, date_to: null };
  }
}

/** Given the current range, return the previous comparable range + human label. */
export function previousRange(preset: PeriodPreset, selectedYm: string): { range: ResolvedRange; label: string } | null {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "month": {
      const prevStart = new Date(y, m - 1, 1);
      return {
        range: { date_from: firstDayOfMonth(prevStart.getFullYear(), prevStart.getMonth()), date_to: lastDayOfMonth(prevStart.getFullYear(), prevStart.getMonth()) },
        label: "the previous month",
      };
    }
    case "last3": {
      const s = new Date(y, m - 5, 1);
      const e = new Date(y, m - 3, 0);
      return {
        range: { date_from: firstDayOfMonth(s.getFullYear(), s.getMonth()), date_to: toIsoDate(e) },
        label: "the previous 3 months",
      };
    }
    case "last6": {
      const s = new Date(y, m - 11, 1);
      const e = new Date(y, m - 6, 0);
      return {
        range: { date_from: firstDayOfMonth(s.getFullYear(), s.getMonth()), date_to: toIsoDate(e) },
        label: "the previous 6 months",
      };
    }
    case "last12": {
      const s = new Date(y, m - 23, 1);
      const e = new Date(y, m - 12, 0);
      return {
        range: { date_from: firstDayOfMonth(s.getFullYear(), s.getMonth()), date_to: toIsoDate(e) },
        label: "the previous 12 months",
      };
    }
    case "custom": {
      if (!selectedYm || !/^\d{4}-\d{2}$/.test(selectedYm)) return null;
      const [yy, mm] = selectedYm.split("-").map(Number);
      const prev = new Date(yy, mm - 2, 1);
      return {
        range: { date_from: firstDayOfMonth(prev.getFullYear(), prev.getMonth()), date_to: lastDayOfMonth(prev.getFullYear(), prev.getMonth()) },
        label: "the previous month",
      };
    }
    case "all":
      return null;
    default:
      return null;
  }
}

/** True when the current range spans more than one calendar month. */
export function spansMoreThanOneMonth(range: ResolvedRange): boolean {
  if (!range.date_from || !range.date_to) return true; // all-time counts as multi-month
  const from = new Date(range.date_from);
  const to = new Date(range.date_to);
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) > 0;
}

// ---------- the hook ----------
interface UseReportsReturn {
  preset: PeriodPreset;
  setPreset: (p: PeriodPreset) => void;
  selectedYm: string;
  setSelectedYm: (ym: string) => void;
  range: ResolvedRange;
  isMultiMonth: boolean;

  data: ReportData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  previousTotals: PreviousTotals | null;
  previousLoading: boolean;

  availableMonths: AvailableMonth[];
  monthsLoading: boolean;
  monthsError: string | null;

  shopId: number | null;
  shopSlug: string | null;
}

export function useReports(): UseReportsReturn {
  const { shopSlug, shopId } = useShop();

  const [preset, setPresetState] = useState<PeriodPreset>("month");
  const [selectedYm, setSelectedYmState] = useState<string>("");
  const [range, setRange] = useState<ResolvedRange>(() => resolveRange("month", ""));

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previousTotals, setPreviousTotals] = useState<PreviousTotals | null>(null);
  const [previousLoading, setPreviousLoading] = useState(false);

  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [monthsLoading, setMonthsLoading] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);

  const initialMonthsFetchDone = useRef(false);

  useEffect(() => {
    setRange(resolveRange(preset, selectedYm));
  }, [preset, selectedYm]);

  const setPreset = useCallback((p: PeriodPreset) => setPresetState(p), []);
  const setSelectedYm = useCallback((ym: string) => {
    setSelectedYmState(ym);
    setPresetState("custom");
  }, []);

  const isMultiMonth = spansMoreThanOneMonth(range);

  // ----- available months -----
  const fetchAvailableMonths = useCallback(async () => {
    if (!shopId) return;
    setMonthsLoading(true);
    setMonthsError(null);
    try {
      const res = await fetch(`/api/shopowner/analytics?shop_id=${shopId}&mode=periods`);
      if (!res.ok) throw new Error("Failed to load available months");
      const json = await res.json();
      if (json.success && Array.isArray(json.periods)) setAvailableMonths(json.periods);
      else throw new Error(json.error || "Failed to load available months");
    } catch (err) {
      setMonthsError(err instanceof Error ? err.message : "Failed to load available months");
    } finally {
      setMonthsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (initialMonthsFetchDone.current || !shopId) return;
    initialMonthsFetchDone.current = true;
    fetchAvailableMonths();
  }, [fetchAvailableMonths, shopId]);

  // ----- current report -----
  const fetchReport = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ shop_id: String(shopId) });
      if (range.date_from) params.append("date_from", range.date_from);
      if (range.date_to) params.append("date_to", range.date_to);
      const res = await fetch(`/api/shopowner/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load report");
      const json = await res.json();
      if (json.success && json.data) setData(json.data as ReportData);
      else throw new Error(json.error || "Failed to load report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [shopId, range.date_from, range.date_to]);

  useEffect(() => {
    if (!shopId) return;
    fetchReport();
  }, [fetchReport, shopId]);

  // ----- previous period comparison -----
  const fetchPrevious = useCallback(async () => {
    if (!shopId) return;
    const prev = previousRange(preset, selectedYm);
    if (!prev) { setPreviousTotals(null); return; }
    setPreviousLoading(true);
    try {
      const params = new URLSearchParams({ shop_id: String(shopId) });
      if (prev.range.date_from) params.append("date_from", prev.range.date_from);
      if (prev.range.date_to) params.append("date_to", prev.range.date_to);
      const res = await fetch(`/api/shopowner/analytics?${params.toString()}`);
      if (!res.ok) { setPreviousTotals(null); return; }
      const json = await res.json();
      if (json.success && json.data?.summary) {
        setPreviousTotals({
          revenue: json.data.summary.totalRevenue ?? 0,
          paidOrders: json.data.summary.totalPaidOrders ?? 0,
          label: prev.label,
        });
      } else {
        setPreviousTotals(null);
      }
    } catch {
      setPreviousTotals(null);
    } finally {
      setPreviousLoading(false);
    }
  }, [shopId, preset, selectedYm]);

  useEffect(() => {
    if (!shopId) return;
    fetchPrevious();
  }, [fetchPrevious, shopId]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchReport(), fetchPrevious()]);
  }, [fetchReport, fetchPrevious]);

  return {
    preset, setPreset,
    selectedYm, setSelectedYm,
    range, isMultiMonth,
    data, loading, error, refresh,
    previousTotals, previousLoading,
    availableMonths, monthsLoading, monthsError,
    shopId: shopId ?? null,
    shopSlug: shopSlug ?? null,
  };
}