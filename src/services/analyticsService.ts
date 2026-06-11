import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  branchId?: string;
}

export interface AnalyticsSummary {
  total_detections: number;
  violations: number;
  compliance_score: number;
  active_cameras: number;
  total_cameras: number;
  active_services: number;
  trend_pct?: number;
}

export interface TrendPoint {
  date: string;
  detections: number;
  violations: number;
}

export interface ServiceBreakdown {
  name: string;
  count: number;
  percent: number;
  violations?: number;
  color?: string;
}

export interface CameraRow {
  camera: string;
  branch: string;
  total: number;
  violations: number;
  rate: number;
}

export interface BranchRow {
  branch: string;
  detections: number;
  violations: number;
  violation_rate: number;
}

export interface Branch {
  id: string;
  name: string;
}

// ---------- Raw API shapes ----------
interface RawSummary {
  total_detections: number;
  total_violations: number;
  compliance_score: number;
  active_cameras: number;
  total_cameras: number;
  active_services: number;
  detection_change?: number;
}

interface RawTrendPoint {
  period: string;
  total: number;
  violations: string | number;
}

interface RawServiceRow {
  service_id?: number;
  name_en: string;
  name_ar?: string;
  total: number;
  violations: string | number;
}

interface RawCameraRow {
  camera_id?: number;
  camera_name: string;
  branch_name: string;
  total: number;
  violations: string | number;
}

interface RawBranchRow {
  id?: number;
  name: string;
  total_detections: number;
  violations: string | number;
}

// ---------- Normalizers ----------
function normalizeSummary(r: RawSummary): AnalyticsSummary {
  return {
    total_detections: r.total_detections ?? 0,
    violations: Number(r.total_violations ?? 0),
    compliance_score: r.compliance_score ?? 0,
    active_cameras: r.active_cameras ?? 0,
    total_cameras: r.total_cameras ?? 0,
    active_services: r.active_services ?? 0,
    trend_pct: r.detection_change,
  };
}

const SERVICE_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(150, 60%, 50%)",
  "hsl(35, 90%, 60%)",
  "hsl(0, 75%, 60%)",
  "hsl(270, 65%, 55%)",
  "hsl(190, 70%, 45%)",
];

function normalizeTrends(raw: RawTrendPoint[]): TrendPoint[] {
  return raw.map((r) => ({
    date: r.period?.slice(5) ?? "", // "2026-05-17" → "05-17"
    detections: Number(r.total ?? 0),
    violations: Number(r.violations ?? 0),
  }));
}

function normalizeServices(raw: RawServiceRow[]): ServiceBreakdown[] {
  const totalCount = raw.reduce((s, r) => s + Number(r.total ?? 0), 0) || 1;
  return raw.map((r, i) => {
    const count = Number(r.total ?? 0);
    return {
      name: r.name_en ?? "",
      count,
      percent: Math.round((count / totalCount) * 100),
      violations: Number(r.violations ?? 0) || undefined,
      color: SERVICE_COLORS[i % SERVICE_COLORS.length],
    };
  });
}

function normalizeCameras(raw: RawCameraRow[]): CameraRow[] {
  return raw.map((r) => {
    const total = Number(r.total ?? 0);
    const violations = Number(r.violations ?? 0);
    return {
      camera: r.camera_name ?? "",
      branch: r.branch_name ?? "",
      total,
      violations,
      rate: total > 0 ? Math.round((violations / total) * 100) : 0,
    };
  });
}

function normalizeBranches(raw: RawBranchRow[]): BranchRow[] {
  return raw.map((r) => {
    const detections = Number(r.total_detections ?? 0);
    const violations = Number(r.violations ?? 0);
    return {
      branch: r.name ?? "",
      detections,
      violations,
      violation_rate:
        detections > 0 ? Math.round((violations / detections) * 100) : 0,
    };
  });
}

function unwrapArray<T>(r: T[] | { data: T[] }): T[] {
  return Array.isArray(r) ? r : ((r as { data: T[] }).data ?? []);
}

// Demo/fabricated fallbacks removed: failed requests must surface as
// errors (handled by the view's error/empty states) instead of silently
// rendering fake numbers (29,705 detections / 80.3% compliance / random
// trends) that do not match the user's real data.

function q(filters: AnalyticsFilters) {
  return {
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    branch_id: filters.branchId,
  };
}

export const analyticsService = {
  getSummary: (f: AnalyticsFilters) =>
    apiFetch<RawSummary | { data: RawSummary }>(endpoints.analytics.summary, {
      query: q(f),
    }).then((r) =>
      normalizeSummary((r as { data: RawSummary }).data ?? (r as RawSummary)),
    ),

  getTrends: (f: AnalyticsFilters) =>
    apiFetch<RawTrendPoint[] | { data: RawTrendPoint[] }>(
      endpoints.analytics.trends,
      { query: q(f) },
    ).then((r) => normalizeTrends(unwrapArray(r))),

  getByService: (f: AnalyticsFilters) =>
    apiFetch<RawServiceRow[] | { data: RawServiceRow[] }>(
      endpoints.analytics.byService,
      { query: q(f) },
    ).then((r) => normalizeServices(unwrapArray(r))),

  getByCamera: (f: AnalyticsFilters) =>
    apiFetch<RawCameraRow[] | { data: RawCameraRow[] }>(
      endpoints.analytics.byCamera,
      { query: q(f) },
    ).then((r) => normalizeCameras(unwrapArray(r))),

  getByBranch: (f: AnalyticsFilters) =>
    apiFetch<RawBranchRow[] | { data: RawBranchRow[] }>(
      endpoints.analytics.byBranch,
      { query: q(f) },
    ).then((r) => normalizeBranches(unwrapArray(r))),

  getBranches: (params?: {
    page?: number;
    per_page?: number;
    keyword?: string;
  }) =>
    apiFetch<Branch[] | { data: Branch[] }>(endpoints.analytics.branches, {
      query: params?.page
        ? {
            page: params.page,
            per_page: params.per_page ?? 20,
            ...(params.keyword ? { keyword: params.keyword } : {}),
          }
        : { all: 1 },
    }).then((r) => unwrapArray(r)),
};
