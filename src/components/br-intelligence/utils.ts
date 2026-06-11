/**
 * Utility functions for BR Intelligence view.
 */

import { toLocalISODate, todayLocalISO } from "@/lib/utils";

export type RangeKey = "7" | "14" | "30" | "custom";

export function rangeFor(
  k: RangeKey,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const today = todayLocalISO();
  if (k === "custom" && customFrom && customTo) {
    // Cap the end date to today to prevent fetching future data
    const cappedTo = customTo > today ? today : customTo;
    // Ensure from <= to
    const cappedFrom = customFrom > cappedTo ? cappedTo : customFrom;
    return { from: cappedFrom, to: cappedTo };
  }
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (Number(k) - 1));
  return {
    from: toLocalISODate(from),
    to: toLocalISODate(to),
  };
}

export function statusTone(s: string): string {
  if (s === "Outstanding") return "text-emerald-600 bg-emerald-50";
  if (s === "On Target") return "text-sky-600 bg-sky-50";
  if (s === "Needs Attention") return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

export type Severity = "critical" | "high" | "medium" | "low";

export function insightTone(s: Severity): string {
  if (s === "critical") return "text-rose-600 bg-rose-50 border-rose-200";
  if (s === "high") return "text-amber-600 bg-amber-50 border-amber-200";
  if (s === "medium") return "text-sky-600 bg-sky-50 border-sky-200";
  return "text-emerald-600 bg-emerald-50 border-emerald-200";
}

/**
 * Normalizes the service name from various API response formats.
 */
export function normalizeService(s: unknown): string {
  if (typeof s === "string") return s;
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    return String(o.name_en ?? o.name_ar ?? o.name ?? o.id ?? "");
  }
  return String(s);
}
