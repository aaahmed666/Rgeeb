/**
 * Customer Island service — ported from the OLD project's
 * `store/apps/customer-island` Redux slice (same endpoints, same params,
 * same response shapes) so the NEW app reaches feature parity.
 *
 * Endpoints (all GET, all under /customer/island/…):
 *   dashboard · traffic · conversion · employee-presence · response-time
 *   demographics · heatmap · violations (paginated)
 */
import { apiFetch, ApiError } from "@/lib/api";

/* ─── Types (1:1 with old `types/apps/customer-island.ts`) ─── */

export interface IslandFilters {
  from?: string;
  to?: string;
  branch_id?: number | string;
  user_id?: number | string;
  camera_id?: number | string;
  date?: string;
  hour?: number;
  type?: string;
  page?: number;
  per_page?: number;
}

export interface IslandDashboardData {
  total_passers: number;
  total_stoppers: number;
  total_buyers: number;
  avg_response_time: number;
  presence_percentage: number;
  total_violations: number;
}

export interface HourlyCount {
  hour: number;
  count: number;
}
export interface HourlyRate {
  hour: number;
  rate: number;
}

export interface IslandTrafficData {
  hourly_passers: HourlyCount[];
  hourly_stoppers: HourlyCount[];
  attraction_rates: HourlyRate[];
}

export interface IslandConversionData {
  passers: number;
  stoppers: number;
  buyers: number;
  stoppers_percentage: number;
  buyers_percentage: number;
}

export interface PresencePoint {
  hour: number;
  status: "present" | "absent";
}
export interface IslandPresenceData {
  timeline: PresencePoint[];
}

export interface ResponseTimePoint {
  hour: number;
  value: number;
}
export interface IslandResponseTimeData {
  hourly_avg_response_time: ResponseTimePoint[];
  hourly_min_response_time: ResponseTimePoint[];
  hourly_max_response_time: ResponseTimePoint[];
}

export interface IslandDemographicsData {
  gender: { male: number; female: number };
  age_groups: {
    "0-18": number;
    "19-25": number;
    "26-35": number;
    "36-45": number;
    "46+": number;
  };
}

export interface IslandHeatmapData {
  heatmap_image: string | null;
  camera_name: string;
  camera_id: number;
  date: string;
  hour: number;
  total_stoppers?: number;
  avg_dwell_time?: number;
}

export interface IslandViolation {
  id: number;
  violation_type: string;
  employee: { id: number; name: string; avatar?: string } | null;
  branch: { id: number; name: string };
  detected_at: string;
  duration: number;
  status: "pending" | "resolved" | "ignored";
  snapshot_path?: string;
  video_path?: string;
  notes?: string;
}

/* ─── Compliance (parity with old `fetchIslandCompliance`) ─── */

export interface IslandComplianceData {
  compliance_score: number;
  ppe_violations_total: number;
  ppe_breakdown: {
    no_glove: number;
    no_mask: number;
    no_hairnet: number;
    other: number;
  };
  ppe_hourly: Array<{ hour: number; count: number }>;
  phone_incidents_total: number;
  phone_hourly: Array<{ hour: number; count: number }>;
}

/* ─── Settings (parity with old fetch/update IslandSettings) ─── */

export interface IslandSettings {
  store_queue_threshold: number;
  store_queue_alert_enabled: boolean;
  store_employee_absent_alert_enabled: boolean;
  has_telegram_setting: boolean;
}

export interface IslandSettingsUpdate {
  store_queue_threshold?: number;
  store_queue_alert_enabled?: boolean;
  store_employee_absent_alert_enabled?: boolean;
}

/* ─── Param builder (mirrors old buildParams exactly) ─── */

function buildParams(filters: IslandFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.branch_id !== undefined && filters.branch_id !== "")
    params.branch_id = filters.branch_id;
  if (filters.user_id !== undefined && filters.user_id !== "")
    params.user_id = filters.user_id;
  if (filters.camera_id !== undefined && filters.camera_id !== "")
    params.camera_id = filters.camera_id;
  if (filters.date) params.date = filters.date;
  if (filters.hour !== undefined && filters.hour !== null)
    params.hour = filters.hour;
  if (filters.type) params.type = filters.type;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;
  return params;
}

/* ─── Response unwrapping ───
 * Old slice read `response.data.data` (Laravel envelope). apiFetch returns
 * the parsed body, so unwrap `{ data: … }` when present. */
function unwrap<T>(raw: unknown): T {
  const obj = raw as { data?: T } | T;
  if (obj && typeof obj === "object" && "data" in (obj as object)) {
    const inner = (obj as { data?: T }).data;
    if (inner !== undefined && inner !== null) return inner;
  }
  return obj as T;
}

// Backend contract drift: the current API serves these under
// `/customer/store-intelligence/*`, while older deployments used
// `/customer/island/*`. The sub-paths are identical, so we try the new base
// first and fall back to the legacy one on a 404 (mirrors the dual-path
// strategy used for the renamed Foodics endpoints). The resolved base is
// cached for the session once a path succeeds.
const PRIMARY_BASE = "/customer/store-intelligence";
const LEGACY_BASE = "/customer/island";
let resolvedBase: string | null = null;

async function fetchWithBaseFallback(
  path: string,
  query: Record<string, string | number>
): Promise<unknown> {
  // If we already know which base works, use it directly.
  if (resolvedBase) {
    return apiFetch<unknown>(`${resolvedBase}/${path}`, { query });
  }
  try {
    const raw = await apiFetch<unknown>(`${PRIMARY_BASE}/${path}`, { query });
    resolvedBase = PRIMARY_BASE;
    return raw;
  } catch (err) {
    // Only fall back on "route not found" — never on auth/validation/timeout,
    // which the global handlers should see unchanged.
    if (err instanceof ApiError && err.status === 404) {
      const raw = await apiFetch<unknown>(`${LEGACY_BASE}/${path}`, { query });
      resolvedBase = LEGACY_BASE;
      return raw;
    }
    throw err;
  }
}

async function get<T>(path: string, filters: IslandFilters): Promise<T> {
  const raw = await fetchWithBaseFallback(path, buildParams(filters));
  return unwrap<T>(raw);
}

export const islandService = {
  dashboard: (f: IslandFilters) => get<IslandDashboardData>("dashboard", f),
  traffic: (f: IslandFilters) => get<IslandTrafficData>("traffic", f),
  conversion: (f: IslandFilters) => get<IslandConversionData>("conversion", f),
  employeePresence: (f: IslandFilters) =>
    get<IslandPresenceData>("employee-presence", f),
  responseTime: (f: IslandFilters) =>
    get<IslandResponseTimeData>("response-time", f),
  demographics: (f: IslandFilters) =>
    get<IslandDemographicsData>("demographics", f),
  heatmap: (f: IslandFilters) => get<IslandHeatmapData>("heatmap", f),

  /** Paginated list — old slice returned { items, total } from a Laravel paginator. */
  violations: async (
    f: IslandFilters
  ): Promise<{ items: IslandViolation[]; total: number }> => {
    const raw = await fetchWithBaseFallback("violations", buildParams(f));
    // Envelope: { data: { data: [...], total } } (paginator inside data)
    const env = raw as {
      data?: { data?: IslandViolation[]; total?: number } | IslandViolation[];
      total?: number;
    };
    const paginator = env?.data;
    if (Array.isArray(paginator)) {
      return { items: paginator, total: env.total ?? paginator.length };
    }
    return {
      items: paginator?.data ?? [],
      total: paginator?.total ?? 0,
    };
  },

  /** Compliance — PPE + phone-usage analytics (old `fetchIslandCompliance`). */
  compliance: (f: IslandFilters) => get<IslandComplianceData>("compliance", f),

  /** Store settings — GET (old `fetchIslandSettings`, no params). */
  settings: async (): Promise<IslandSettings> => {
    const raw = await fetchWithBaseFallback("settings", {});
    return unwrap<IslandSettings>(raw);
  },

  /**
   * Update store settings.
   * The OLD project used PUT /customer/island/settings; the CURRENT backend
   * (per the Postman collection) serves the write on POST to the same URL.
   * We POST to the resolved base and unwrap the Laravel envelope.
   */
  updateSettings: async (
    payload: IslandSettingsUpdate
  ): Promise<IslandSettings> => {
    const base = resolvedBase ?? PRIMARY_BASE;
    try {
      const raw = await apiFetch<unknown>(`${base}/settings`, {
        method: "POST",
        body: payload,
      });
      resolvedBase = base;
      return unwrap<IslandSettings>(raw);
    } catch (err) {
      // Mirror the GET fallback: retry on the legacy base if the route 404s.
      if (
        err instanceof ApiError &&
        err.status === 404 &&
        base !== LEGACY_BASE
      ) {
        const raw = await apiFetch<unknown>(`${LEGACY_BASE}/settings`, {
          method: "POST",
          body: payload,
        });
        resolvedBase = LEGACY_BASE;
        return unwrap<IslandSettings>(raw);
      }
      throw err;
    }
  },
};

/** Old dashboard helper — format seconds as `Xm Ys` / `Ys`. */
export function formatResponseTime(seconds: number): string {
  if (seconds == null || isNaN(seconds)) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
