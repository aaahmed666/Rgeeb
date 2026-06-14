import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type ReportTab =
  | "customers"
  | "suppliers"
  | "sales"
  | "purchases"
  | "inventory"
  | "financials";

export interface ReportFilters {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
}

export interface ReportMetric {
  label: string;
  value: string | number;
  trend?: number;
  hint?: string;
}

export interface ReportRow {
  [key: string]: string | number;
}

export interface ReportPayload {
  metrics: ReportMetric[];
  columns: { key: string; label: string }[];
  rows: ReportRow[];
}

/**
 * Fetch a business-reports tab from the backend.
 *
 * Contract (covered by __tests__/services/reportsService.test.ts):
 *  - Always calls GET /customer/reports/statistics with
 *    { date_from, date_to, type } query params.
 *  - Normalizes the payload, defaulting any missing array to [].
 *  - Returns `null` when the payload has neither metrics nor rows so the page
 *    can render its empty state.
 *  - PROPAGATES errors to the caller (no silent fallback) so StatisticsView
 *    can show its error banner + Retry action.
 */
export async function fetchReport(
  tab: ReportTab,
  filters: ReportFilters,
): Promise<ReportPayload | null> {
  const data = await apiFetch<Partial<ReportPayload>>(
    endpoints.reports.statistics,
    { query: { date_from: filters.dateFrom, date_to: filters.dateTo, type: tab } },
  );
  if (data && (data.metrics || data.rows)) {
    return {
      metrics: data.metrics ?? [],
      columns: data.columns ?? [],
      rows: data.rows ?? [],
    };
  }
  return null;
}
