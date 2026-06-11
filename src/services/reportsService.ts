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


export async function fetchReport(
  tab: ReportTab,
  filters: ReportFilters,
): Promise<ReportPayload | null> {
  // NOTE: errors intentionally propagate to the caller so the page can show
  // its error banner + Retry action instead of silently rendering empty state.
  try {
    const data = await apiFetch<Partial<ReportPayload>>(
      endpoints.reports.statistics,
      { query: { date_from: filters.dateFrom, date_to: filters.dateTo, type: tab } },
    );
    if (data && (data.metrics || data.rows)) {
      return {
        metrics: data.metrics ?? [],
        columns: data.columns ?? [],
        rows:    data.rows    ?? [],
      };
    }
  } catch {
    // fall through to the legacy Fatoorah indices API below
  }
  // Legacy production data source (ported from old project's fatoorah-charts
  // store, which fetched https://indices.fatoorah.ai/api/v1/reports/{tab}).
  return fetchFatoorahReport(tab, filters);
}

/* ------------------------------------------------------------------ */
/* Legacy Fatoorah indices API (https://indices.fatoorah.ai)            */
/* Ported from old src/store/apps/fatoorah-charts — the old Overview    */
/* page rendered chart payloads from these six endpoints.               */
/* ------------------------------------------------------------------ */

const FATOORAH_BASE = "https://indices.fatoorah.ai";

const FATOORAH_PATHS: Record<ReportTab, string> = {
  customers:  "/api/v1/reports/customer",
  suppliers:  "/api/v1/reports/supplier",
  sales:      "/api/v1/reports/sales",
  purchases:  "/api/v1/reports/purchase",
  inventory:  "/api/v1/reports/inventory",
  financials: "/api/v1/reports/financial-ratios",
};

interface FatoorahChartReport {
  metadata?: {
    title?: string;
    chart_type?: string;
    x_axis?: { name?: string; title?: string };
    series?: { name?: string; title?: string }[];
  };
  data?: Record<string, unknown>[];
}

export async function fetchFatoorahReport(
  tab: ReportTab,
  filters: ReportFilters,
): Promise<ReportPayload | null> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const url = new URL(`${FATOORAH_BASE}${FATOORAH_PATHS[tab]}`);
  // Legacy API used from_date/to_date param names
  url.searchParams.set("from_date", filters.dateFrom);
  url.searchParams.set("to_date", filters.dateTo);

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Fatoorah reports request failed (${res.status})`);
  const body = (await res.json()) as Record<string, unknown>;

  // Response is a map of chartKey -> { metadata, data } plus scalar fields.
  const charts = Object.entries(body).filter(
    (e): e is [string, FatoorahChartReport] =>
      typeof e[1] === "object" &&
      e[1] !== null &&
      Array.isArray((e[1] as FatoorahChartReport).data),
  );
  if (charts.length === 0) return null;

  // Build a tabular payload: the first/largest chart becomes the table,
  // each chart's latest series values become summary metrics.
  const metrics: ReportMetric[] = [];
  for (const [, chart] of charts) {
    const rows = chart.data ?? [];
    const last = rows[rows.length - 1];
    if (!last) continue;
    for (const series of chart.metadata?.series ?? []) {
      const key = series.name;
      if (!key || last[key] == null) continue;
      metrics.push({
        label: series.title || chart.metadata?.title || key,
        value: last[key] as string | number,
        hint: chart.metadata?.title,
      });
      if (metrics.length >= 8) break;
    }
    if (metrics.length >= 8) break;
  }

  const main = charts.reduce((a, b) =>
    (b[1].data?.length ?? 0) > (a[1].data?.length ?? 0) ? b : a,
  )[1];
  const sample = main.data?.[0] ?? {};
  const columns = Object.keys(sample).map((key) => {
    const series = main.metadata?.series?.find((s) => s.name === key);
    const isX = main.metadata?.x_axis?.name === key;
    return {
      key,
      label: series?.title || (isX ? main.metadata?.x_axis?.title || key : key),
    };
  });
  const rows = (main.data ?? []).map((r) => {
    const out: ReportRow = {};
    for (const [k, v] of Object.entries(r)) {
      out[k] = typeof v === "number" || typeof v === "string" ? v : String(v ?? "");
    }
    return out;
  });

  return { metrics, columns, rows };
}
