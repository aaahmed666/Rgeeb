import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface IntelFilters {
  dateFrom: string;
  dateTo: string;
  branchId?: string;
}

// ---------- Public interfaces (used by BrIntelligenceView) ----------

export interface EfficiencyRow {
  branch: string;
  score: number;
  compliance: number;
  detections: number;
  violations: number;
  violation_rate: number;
  tasks_done: number;
  tasks_total: number;
  task_rate: number;
  trend: number;
  status: "Outstanding" | "On Target" | "Needs Attention" | "Critical";
}

export interface RankingItem {
  branch: string;
  value: number | string;
}
export interface Rankings {
  by_score: RankingItem[];
  by_detections: RankingItem[];
  by_compliance: RankingItem[];
  by_tasks: RankingItem[];
}

export interface HeatmapPayload {
  services: string[];
  dates: string[];
  cells: { date: string; hour: number; value: number }[];
}

export interface BranchHealth {
  branch: string;
  health: number;
  status: string;
  cameras_online?: number;
  cameras_total?: number;
  detections?: number;
  violations?: number;
  viol_pct?: number | null;
  uptime_pct?: number;
  trend_series?: number[];
}

export interface ServiceMatrixCell {
  service: string;
  branch: string;
  count: number;
  violations: number;
}

export interface AiInsight {
  icon?: string;
  title: string;
  description: string;
  severity?: "info" | "warning" | "success" | "danger";
}

export interface Anomaly {
  date: string;
  branch: string;
  metric: string;
  value: number;
  expected: number;
  delta: number;
  z_score?: number;
  severity?: "warning" | "danger" | "info";
  direction?: "up" | "down";
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}
export interface TrendForecast {
  r2: number;
  direction: "rising" | "falling" | "stable";
  slope?: number;
  std_error?: number;
  points: ForecastPoint[];
}

export interface HourlyPeak {
  hour: number;
  detections: number;
  violations: number;
}

export interface PeriodComparison {
  metric: string;
  current: number;
  previous: number;
  delta_pct: number;
}

// ---------- Raw API shapes ----------

interface RawEfficiencyBranch {
  id: number;
  name: string;
  composite_score: number;
  compliance_score: number;
  total_detections: number;
  violation_count: number;
  violation_rate: number;
  task_completion_rate: number;
  total_tasks: number;
  completed_tasks: number;
  classification: string;
  trend_pct: number;
  sparkline?: { day: string; total: number }[];
}

// branch-health returns array of branch objects
interface RawBranchHealthItem {
  id: number;
  name: string;
  cameras_total: number;
  cameras_online: number;
  total_detections: number;
  total_violations: number;
  violation_rate: number;
  daily_trend?: { day: string; total: number }[];
}

// rankings returns { by_score, by_detections, by_compliance, by_task_completion, by_response_speed }
interface RawRankings {
  by_score: RawEfficiencyBranch[];
  by_detections: RawEfficiencyBranch[];
  by_compliance: RawEfficiencyBranch[];
  by_task_completion: RawEfficiencyBranch[];
}

// heatmap returns { dates, hours, matrix: { "YYYY-MM-DD": number[] }, max_value }
interface RawHeatmap {
  dates: string[];
  hours: number[];
  matrix: Record<string, number[]>;
  max_value: number;
}

// service-matrix returns { branches, services, matrix: { branchId: { serviceId: count } }, max_value }
interface RawServiceMatrix {
  branches: { id: number; name: string }[];
  services: { id: number; name: string }[];
  matrix: Record<string, Record<string, number>>;
}

// ai-insights returns array of { type, icon, title, text }
interface RawAiInsight {
  type: string;
  icon?: string;
  title: string;
  text: string;
}

// anomaly-detection returns { anomalies: [...], threshold, total_found }
interface RawAnomaly {
  branch_name: string;
  date: string;
  count: number;
  mean: number;
  std_dev: number;
  z_score: number;
  type: "drop" | "spike";
  severity: "warning" | "danger" | "info";
}

// trend-forecast returns { historical, forecast, trend, slope, std_error, r_squared }
interface RawForecast {
  historical: { date: string; value: number }[];
  forecast: {
    date: string;
    predicted: number;
    upper_bound: number;
    lower_bound: number;
  }[];
  trend: string;
  slope: number;
  std_error: number;
  r_squared: number;
}

// hourly-peaks returns { hourly: [...], peak_hour, peak_count, quiet_hour, quiet_count }
interface RawHourlyItem {
  hour: number;
  total: number;
  violations: number;
}

// period-comparison returns { current: { total, violations, daily }, previous: { total, violations }, change_pct }
interface RawPeriodComparison {
  current: { total: number; violations: number };
  previous: { total: number; violations: number };
  change_pct: number;
}

// ---------- Normalizers ----------

function classificationToStatus(c: string): EfficiencyRow["status"] {
  switch ((c ?? "").toLowerCase()) {
    case "outstanding":
      return "Outstanding";
    case "on_target":
    case "on target":
      return "On Target";
    case "needs_attention":
    case "needs attention":
      return "Needs Attention";
    case "critical":
      return "Critical";
    default:
      return "On Target";
  }
}

function normalizeEfficiency(raw: RawEfficiencyBranch[]): EfficiencyRow[] {
  return raw.map((r) => ({
    branch: r.name ?? "",
    score: Number(r.composite_score ?? 0),
    compliance: Number(r.compliance_score ?? 0),
    detections: Number(r.total_detections ?? 0),
    violations: Number(r.violation_count ?? 0),
    violation_rate: Number(r.violation_rate ?? 0),
    tasks_done: Number(r.completed_tasks ?? 0),
    tasks_total: Number(r.total_tasks ?? 0),
    task_rate: Number(r.task_completion_rate ?? 0),
    trend: Number(r.trend_pct ?? 0),
    status: classificationToStatus(r.classification),
  }));
}

function normalizeRankings(raw: RawRankings): Rankings {
  const toItems = (arr: RawEfficiencyBranch[]): RankingItem[] =>
    (arr ?? []).map((r) => ({
      branch: r.name ?? "",
      value: Number(r.composite_score ?? 0),
    }));
  return {
    by_score: toItems(raw.by_score),
    by_detections: (raw.by_detections ?? []).map((r) => ({
      branch: r.name ?? "",
      value: Number(r.total_detections ?? 0),
    })),
    by_compliance: (raw.by_compliance ?? []).map((r) => ({
      branch: r.name ?? "",
      value: `${Number(r.compliance_score ?? 0)}%`,
    })),
    by_tasks: (raw.by_task_completion ?? []).map((r) => ({
      branch: r.name ?? "",
      value: `${Number(r.task_completion_rate ?? 0)}%`,
    })),
  };
}

function normalizeHeatmap(raw: RawHeatmap): HeatmapPayload {
  const dates = raw.dates ?? [];
  const hours = raw.hours ?? Array.from({ length: 24 }, (_, i) => i);
  const matrix = raw.matrix ?? {};
  const cells: HeatmapPayload["cells"] = [];
  for (const date of dates) {
    const vals: number[] = matrix[date] ?? [];
    for (let i = 0; i < hours.length; i++) {
      cells.push({ date, hour: hours[i], value: vals[i] ?? 0 });
    }
  }
  return { services: ["All"], dates, cells };
}

function normalizeBranchHealth(raw: RawBranchHealthItem[]): BranchHealth[] {
  return raw.map((r) => {
    const det = Number(r.total_detections ?? 0);
    const viol = Number(r.total_violations ?? 0);
    const health = 100 - Math.min(100, Number(r.violation_rate ?? 0));
    return {
      branch: r.name ?? "",
      health: Math.round(health),
      status:
        health >= 80
          ? "Outstanding"
          : health >= 60
            ? "On Target"
            : health >= 40
              ? "Needs Attention"
              : "Critical",
      cameras_online: Number(r.cameras_online ?? 0),
      cameras_total: Number(r.cameras_total ?? 0),
      detections: det,
      violations: viol,
      viol_pct: det > 0 ? Math.round((viol / det) * 100) : null,
      uptime_pct: r.cameras_total
        ? Math.round(((r.cameras_online ?? 0) / r.cameras_total) * 100)
        : 0,
      trend_series: (r.daily_trend ?? []).map((d) => d.total),
    };
  });
}

function normalizeServiceMatrix(raw: RawServiceMatrix): ServiceMatrixCell[] {
  const cells: ServiceMatrixCell[] = [];
  const branches = raw.branches ?? [];
  const services = raw.services ?? [];
  const matrix = raw.matrix ?? {};
  for (const b of branches) {
    const bRow = matrix[String(b.id)] ?? {};
    for (const s of services) {
      const count = Number(bRow[String(s.id)] ?? 0);
      if (count > 0) {
        cells.push({ branch: b.name, service: s.name, count, violations: 0 });
      }
    }
  }
  return cells;
}

function normalizeInsights(raw: RawAiInsight[]): AiInsight[] {
  const typeToSeverity = (t: string): AiInsight["severity"] => {
    switch (t) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "danger";
      default:
        return "info";
    }
  };
  return raw.map((r) => ({
    icon: r.icon,
    title: r.title ?? "",
    description: r.text ?? "",
    severity: typeToSeverity(r.type),
  }));
}

function normalizeAnomalies(raw: RawAnomaly[]): Anomaly[] {
  return raw.map((r) => ({
    date: r.date ?? "",
    branch: r.branch_name ?? "",
    metric: "detections",
    value: Number(r.count ?? 0),
    expected: Number(r.mean ?? 0),
    delta: Math.round(
      ((Number(r.count ?? 0) - Number(r.mean ?? 0)) /
        Math.max(1, Number(r.mean ?? 1))) *
        100
    ),
    z_score: r.z_score,
    severity: r.severity ?? "warning",
    direction: r.type === "drop" ? "down" : "up",
  }));
}

function normalizeForecast(raw: RawForecast): TrendForecast {
  const points: ForecastPoint[] = [
    ...(raw.historical ?? []).map((h) => ({
      date: h.date?.slice(5) ?? "",
      actual: h.value,
    })),
    ...(raw.forecast ?? []).map((f) => ({
      date: f.date?.slice(5) ?? "",
      forecast: f.predicted,
      lower: f.lower_bound,
      upper: f.upper_bound,
    })),
  ];
  const trend = (raw.trend ?? "stable") as TrendForecast["direction"];
  return {
    r2: Number(raw.r_squared ?? 0),
    direction: trend === "rising" || trend === "falling" ? trend : "stable",
    slope: raw.slope,
    std_error: raw.std_error,
    points,
  };
}

function normalizeHourly(raw: RawHourlyItem[]): HourlyPeak[] {
  return raw.map((r) => ({
    hour: r.hour,
    detections: Number(r.total ?? 0),
    violations: Number(r.violations ?? 0),
  }));
}

function normalizeComparison(raw: RawPeriodComparison): PeriodComparison[] {
  return [
    {
      metric: "Detections",
      current: Number(raw.current?.total ?? 0),
      previous: Number(raw.previous?.total ?? 0),
      delta_pct: Number(raw.change_pct ?? 0),
    },
    {
      metric: "Violations",
      current: Number(raw.current?.violations ?? 0),
      previous: Number(raw.previous?.violations ?? 0),
      delta_pct: raw.previous?.violations
        ? Math.round(
            ((Number(raw.current?.violations ?? 0) -
              Number(raw.previous.violations)) /
              Number(raw.previous.violations)) *
              100
          )
        : 0,
    },
  ];
}

// ---------- Demo data ----------

const demoEfficiency: EfficiencyRow[] = [
  {
    branch: "Second Branch",
    score: 100,
    compliance: 100,
    detections: 20728,
    violations: 0,
    violation_rate: 0,
    tasks_done: 0,
    tasks_total: 0,
    task_rate: 100,
    trend: 13.1,
    status: "Outstanding",
  },
  {
    branch: "Main Branch",
    score: 26.4,
    compliance: 19,
    detections: 6810,
    violations: 5514,
    violation_rate: 81,
    tasks_done: 0,
    tasks_total: 313,
    task_rate: 0,
    trend: 57.2,
    status: "Critical",
  },
];

const demoRankings: Rankings = {
  by_score: [
    { branch: "Second Branch", value: 100 },
    { branch: "Main Branch", value: 26.4 },
  ],
  by_detections: [
    { branch: "Second Branch", value: 20728 },
    { branch: "Main Branch", value: 6810 },
  ],
  by_compliance: [
    { branch: "Second Branch", value: "100%" },
    { branch: "Main Branch", value: "19%" },
  ],
  by_tasks: [
    { branch: "Second Branch", value: "100%" },
    { branch: "Main Branch", value: "0%" },
  ],
};

const demoHeatmap: HeatmapPayload = (() => {
  const dates = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i));
    return d.toISOString().slice(0, 10);
  });
  const cells: HeatmapPayload["cells"] = [];
  for (const date of dates)
    for (let h = 0; h < 24; h++)
      cells.push({ date, hour: h, value: Math.round(Math.random() * 400) });
  return { services: ["All"], dates, cells };
})();

const demoBranchHealth: BranchHealth[] = [
  {
    branch: "Second Branch",
    health: 100,
    status: "Outstanding",
    cameras_online: 0,
    cameras_total: 1,
    detections: 20728,
    violations: 0,
    viol_pct: null,
    uptime_pct: 0,
    trend_series: [42, 40, 41, 39, 38, 36, 22, 20],
  },
  {
    branch: "Main Branch",
    health: 26,
    status: "Critical",
    cameras_online: 0,
    cameras_total: 5,
    detections: 6810,
    violations: 5514,
    viol_pct: 81,
    uptime_pct: 0,
    trend_series: [30, 28, 32, 30, 28, 26, 27, 25],
  },
];

const demoMatrix: ServiceMatrixCell[] = [
  {
    service: "Customer Traffic",
    branch: "Second Branch",
    count: 20728,
    violations: 0,
  },
  {
    service: "Kitchen PPE",
    branch: "Main Branch",
    count: 5509,
    violations: 5509,
  },
];

const demoInsights: AiInsight[] = [
  {
    title: "Top Performer",
    description: "Second Branch leads with a score of 100",
    severity: "success",
  },
  {
    title: "Attention Needed",
    description: "Main Branch has the lowest score (26.4)",
    severity: "warning",
  },
];

const demoAnomalies: Anomaly[] = [
  {
    date: "2026-05-22",
    branch: "Second Branch",
    metric: "detections",
    value: 7,
    expected: 1075,
    delta: -99,
    z_score: -2.43,
    severity: "warning",
    direction: "down",
  },
];

const demoForecast: TrendForecast = {
  r2: 0.531,
  direction: "falling",
  slope: -432,
  std_error: 1075,
  points: [
    { date: "05-17", actual: 4630 },
    { date: "05-18", actual: 4560 },
    { date: "05-19", actual: 3700 },
    { date: "05-20", actual: 3520 },
    { date: "05-21", actual: 3500 },
    { date: "05-22", actual: 3470 },
    { date: "05-23", actual: 3950 },
    { date: "05-24", actual: 200 },
    { date: "05-25", forecast: 2400, lower: 1800, upper: 3000 },
  ],
};

const demoHourly: HourlyPeak[] = Array.from({ length: 24 }).map((_, h) => ({
  hour: h,
  detections:
    h >= 19
      ? 1800 + Math.round(Math.random() * 500)
      : 400 + Math.round(Math.random() * 600),
  violations: 30 + Math.round(Math.random() * 80),
}));

const demoComparison: PeriodComparison[] = [
  { metric: "Detections", current: 27538, previous: 22650, delta_pct: 21.5 },
  { metric: "Violations", current: 5514, previous: 3850, delta_pct: 43.2 },
];

const demoAvailableServices = [
  "All",
  "Customer Traffic",
  "Kitchen PPE",
  "Waiting Customer",
  "Clean Tables",
];

// ---------- Helpers ----------

async function safe<T>(p: Promise<T>, fb: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fb;
  }
}

function q(f: IntelFilters, extra: Record<string, string | number> = {}) {
  return {
    date_from: f.dateFrom,
    date_to: f.dateTo,
    branch_id: f.branchId,
    ...extra,
  };
}

function unwrapArray<T>(r: T[] | { data: T[] } | { branches: T[] }): T[] {
  if (Array.isArray(r)) return r;
  if (r && typeof r === "object") {
    if ("data" in r) return (r as { data: T[] }).data ?? [];
    if ("branches" in r) return (r as { branches: T[] }).branches ?? [];
  }
  return [];
}

// ---------- Service ----------

export const intelligenceService = {
  efficiency: (f: IntelFilters) =>
    safe(
      apiFetch<
        | RawEfficiencyBranch[]
        | { data: RawEfficiencyBranch[] }
        | { branches: RawEfficiencyBranch[] }
      >(endpoints.intelligence.efficiencyIndex, { query: q(f) }).then((r) =>
        normalizeEfficiency(unwrapArray(r))
      ),
      [] as EfficiencyRow[]
    ),

  rankings: (f: IntelFilters, top = 3) =>
    safe(
      apiFetch<RawRankings | { data: RawRankings }>(
        endpoints.intelligence.rankings,
        { query: q(f, { top }) }
      ).then((r) =>
        normalizeRankings(
          (r as { data: RawRankings }).data ?? (r as RawRankings)
        )
      ),
      null as Rankings | null
    ),

  heatmap: (f: IntelFilters, service?: string) =>
    safe(
      apiFetch<RawHeatmap | { data: RawHeatmap }>(
        endpoints.intelligence.heatmap,
        { query: q(f, service ? { service } : {}) }
      ).then((r) =>
        normalizeHeatmap((r as { data: RawHeatmap }).data ?? (r as RawHeatmap))
      ),
      null as HeatmapPayload | null
    ),

  branchHealth: (f: IntelFilters) =>
    safe(
      apiFetch<RawBranchHealthItem[] | { data: RawBranchHealthItem[] }>(
        endpoints.intelligence.branchHealth,
        { query: q(f) }
      ).then((r) => normalizeBranchHealth(unwrapArray(r))),
      [] as BranchHealth[]
    ),

  serviceMatrix: (f: IntelFilters) =>
    safe(
      apiFetch<RawServiceMatrix | { data: RawServiceMatrix }>(
        endpoints.intelligence.serviceMatrix,
        { query: q(f) }
      ).then((r) =>
        normalizeServiceMatrix(
          (r as { data: RawServiceMatrix }).data ?? (r as RawServiceMatrix)
        )
      ),
      [] as ServiceMatrixCell[]
    ),

  aiInsights: (f: IntelFilters) =>
    safe(
      apiFetch<RawAiInsight[] | { data: RawAiInsight[] }>(
        endpoints.intelligence.aiInsights,
        { query: q(f) }
      ).then((r) => normalizeInsights(unwrapArray(r))),
      [] as AiInsight[]
    ),

  anomalies: (f: IntelFilters) =>
    safe(
      apiFetch<
        { anomalies: RawAnomaly[] } | { data: { anomalies: RawAnomaly[] } }
      >(endpoints.intelligence.anomalyDetection, { query: q(f) }).then((r) => {
        const inner =
          (r as { data: { anomalies: RawAnomaly[] } }).data ??
          (r as { anomalies: RawAnomaly[] });
        return normalizeAnomalies(inner.anomalies ?? []);
      }),
      [] as Anomaly[]
    ),

  forecast: (f: IntelFilters) =>
    safe(
      apiFetch<RawForecast | { data: RawForecast }>(
        endpoints.intelligence.trendForecast,
        { query: q(f) }
      ).then((r) =>
        normalizeForecast(
          (r as { data: RawForecast }).data ?? (r as RawForecast)
        )
      ),
      null as TrendForecast | null
    ),

  hourly: (f: IntelFilters) =>
    safe(
      apiFetch<
        { hourly: RawHourlyItem[] } | { data: { hourly: RawHourlyItem[] } }
      >(endpoints.intelligence.hourlyPeaks, { query: q(f) }).then((r) => {
        const inner =
          (r as { data: { hourly: RawHourlyItem[] } }).data ??
          (r as { hourly: RawHourlyItem[] });
        return normalizeHourly(inner.hourly ?? []);
      }),
      [] as HourlyPeak[]
    ),

  comparison: (f: IntelFilters) =>
    safe(
      apiFetch<RawPeriodComparison | { data: RawPeriodComparison }>(
        endpoints.intelligence.periodComparison,
        { query: q(f) }
      ).then((r) =>
        normalizeComparison(
          (r as { data: RawPeriodComparison }).data ??
            (r as RawPeriodComparison)
        )
      ),
      [] as PeriodComparison[]
    ),

  availableServices: () =>
    safe(
      apiFetch<string[] | { data: string[] }>(
        endpoints.services.list
      ).then((r) => unwrapArray(r)),
      demoAvailableServices
    ),
};
