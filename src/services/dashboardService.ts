/**
 * Dashboard data service. The rgeeb backend exposes a single unified
 * endpoint `/customer/dashboard` which returns the full payload (cameras,
 * ai services, tasks, visitor flow, live activity, attendance, compliance,
 * detections breakdown, branches). We fetch it once per filter set and
 * derive every sub-section from that payload, falling back to demo data
 * when a field is missing or the request fails (e.g. unauthenticated).
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface DashboardSummary {
  cameras: { online: number; total: number };
  aiServicesActive: number;
  detections: number;
  branches: { id: string; name: string }[];
}

export interface AIServiceItem {
  id: string;
  key: string;
  name: string;
  category: "safety" | "analytics" | "operations" | "monitoring";
  status: "active" | "inactive";
  detections?: number;
  color?: string;
  icon?: string;
}

export interface TaskSummary {
  total: number;
  open: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface VisitorFlowPoint {
  hour: string;
  in: number;
  out: number;
}

export interface LiveActivity {
  id: string;
  type: string;
  branch: string;
  source: string;
  agoSeconds: number;
  severity?: "info" | "warning" | "critical";
  timestamp: string;
}

export interface AttendanceData {
  total: number;
  checkedIn: number;
  present: number;
  checkedOut: number;
  absent: number;
}

export interface ComplianceData {
  score: number;
  totalDetections: number;
  violations: number;
  clean: number;
}

export interface DetectionBreakdownItem {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface BranchSummary {
  id: string;
  name: string;
  camerasOnline: number;
  camerasTotal: number;
  detections: number;
  grade: string;
}

interface DashboardFilters {
  from?: string;
  to?: string;
  branchId?: string;
  [key: string]: string | number | boolean | undefined | null;
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

/* ------------------------- demo fallbacks ------------------------- */

const DEMO_AI_SERVICES: AIServiceItem[] = [
  ["age_gender", "Age Gender Analytics", "analytics"],
  ["attendance", "Attendance", "operations"],
  ["behavior", "Behavior Analysis", "monitoring"],
  ["cash_register", "Cash Register Monitoring", "operations"],
  ["clean_tables", "Clean Tables", "operations"],
  ["cup_counting", "Cup Counting", "analytics"],
  ["customer_traffic", "Customer Traffic", "analytics"],
  ["delivery_tracking", "Delivery Tracking", "operations"],
  ["drive_thru", "Drive Thru Monitoring", "operations"],
  ["face_detection", "Face Detection", "safety"],
  ["fire_detection", "Fire Detection", "safety"],
  ["gate_monitoring", "Gate Monitoring", "monitoring"],
  ["helmet", "Helmet Detection", "safety"],
  ["kitchen_ppe", "Kitchen PPE", "safety"],
  ["license_plate", "License Plate Recognition", "monitoring"],
  ["mask", "Mask Detection", "safety"],
  ["motion", "Motion Detection", "monitoring"],
  ["object", "Object Detection", "monitoring"],
  ["overcrowd", "Overcrowd Violation", "safety"],
  ["people_counting", "People Counting", "analytics"],
  ["person", "Person Detection", "monitoring"],
  ["queue", "Queue Management", "operations"],
  ["receipt", "Receipt Detection", "operations"],
  ["restricted", "Restricted Area", "safety"],
  ["sandwich", "Sandwich Counting", "analytics"],
  ["smoking", "Smoking Detection", "safety"],
  ["spill", "Spill Detection", "safety"],
  ["vehicle", "Vehicle Tracking", "monitoring"],
  ["waiting", "Waiting Customer", "analytics"],
].map(([key, name, category], i) => ({
  id: String(i + 1),
  key: key as string,
  name: name as string,
  category: category as AIServiceItem["category"],
  status: "active",
  detections:
    key === "customer_traffic"
      ? 2802
      : key === "kitchen_ppe"
        ? 927
        : key === "waiting"
          ? 160
          : key === "clean_tables"
            ? 1
            : 0,
}));

const DEMO_VISITOR_FLOW: VisitorFlowPoint[] = Array.from(
  { length: 24 },
  (_, h) => ({
    hour: `${h}`.padStart(2, "0"),
    in: [
      131, 132, 95, 30, 55, 35, 22, 11, 13, 19, 31, 25, 33, 27, 15, 30, 36, 26,
      48, 55, 98, 65, 141, 160,
    ][h],
    out: Math.max(
      5,
      Math.round(
        [
          131, 132, 95, 30, 55, 35, 22, 11, 13, 19, 31, 25, 33, 27, 15, 30, 36,
          26, 48, 55, 98, 65, 141, 160,
        ][h] * 0.85
      )
    ),
  })
);

const DEMO_LIVE_ACTIVITY: LiveActivity[] = [
  {
    id: "1",
    type: "crossing_out",
    branch: "Second Branch",
    source: "Gate",
    agoSeconds: 11,
    severity: "info",
    timestamp: "23:48",
  },
  {
    id: "2",
    type: "PPE Violation",
    branch: "Main Branch",
    source: "PPE",
    agoSeconds: 31,
    severity: "warning",
    timestamp: "23:48",
  },
  {
    id: "3",
    type: "crossing_out",
    branch: "Second Branch",
    source: "Gate",
    agoSeconds: 32,
    severity: "info",
    timestamp: "23:48",
  },
  {
    id: "4",
    type: "crossing_out",
    branch: "Second Branch",
    source: "Gate",
    agoSeconds: 36,
    severity: "info",
    timestamp: "23:48",
  },
  {
    id: "5",
    type: "PPE Violation",
    branch: "Main Branch",
    source: "PPE",
    agoSeconds: 41,
    severity: "warning",
    timestamp: "23:48",
  },
  {
    id: "6",
    type: "PPE Violation",
    branch: "Main Branch",
    source: "PPE",
    agoSeconds: 49,
    severity: "critical",
    timestamp: "23:48",
  },
  {
    id: "7",
    type: "crossing_in",
    branch: "Second Branch",
    source: "Gate",
    agoSeconds: 58,
    severity: "info",
    timestamp: "23:48",
  },
];

const DEMO_ATTENDANCE: AttendanceData = {
  total: 5,
  checkedIn: 0,
  present: 0,
  checkedOut: 0,
  absent: 5,
};
const DEMO_COMPLIANCE: ComplianceData = {
  score: 76,
  totalDetections: 3890,
  violations: 927,
  clean: 2963,
};
const DEMO_BREAKDOWN: DetectionBreakdownItem[] = [
  {
    key: "customer_traffic",
    label: "Customer Traffic",
    count: 2802,
    percent: 72,
    color: "#6366f1",
  },
  {
    key: "kitchen_ppe",
    label: "Kitchen PPE",
    count: 927,
    percent: 24,
    color: "#22c55e",
  },
  {
    key: "waiting",
    label: "Waiting Customer",
    count: 160,
    percent: 4,
    color: "#f59e0b",
  },
  {
    key: "clean_tables",
    label: "Clean Tables",
    count: 1,
    percent: 0,
    color: "#ef4444",
  },
];
const DEMO_BRANCHES: BranchSummary[] = [
  {
    id: "main",
    name: "Main Branch",
    camerasOnline: 0,
    camerasTotal: 3,
    detections: 3,
    grade: "F",
  },
  {
    id: "second",
    name: "Second Branch",
    camerasOnline: 0,
    camerasTotal: 1,
    detections: 7,
    grade: "F",
  },
];

/* -------------------------
 * Maps a raw service name → canonical key used by SERVICE_ICON_MAP / SERVICE_KEY_MAP
 * in DashboardView. Matches on substrings in order of specificity.
 * -------------------------*/
const NAME_TO_KEY_MAP: Array<[string, string, AIServiceItem["category"]]> = [
  ["age", "age_gender", "analytics"],
  ["attendance", "attendance", "operations"],
  ["behavior", "behavior", "monitoring"],
  ["cash", "cash_register", "operations"],
  ["clean", "clean_tables", "operations"],
  ["cup", "cup_counting", "analytics"],
  ["traffic", "customer_traffic", "analytics"],
  ["delivery", "delivery_tracking", "operations"],
  ["drive", "drive_thru", "operations"],
  ["face", "face_detection", "analytics"],
  ["fire", "fire_detection", "safety"],
  ["smoke", "fire_detection", "safety"],
  ["gate", "gate_monitoring", "monitoring"],
  ["helmet", "helmet", "safety"],
  ["kitchen", "kitchen_ppe", "safety"],
  ["ppe", "kitchen_ppe", "safety"],
  ["license", "license_plate", "monitoring"],
  ["plate", "license_plate", "monitoring"],
  ["mask", "mask", "monitoring"],
  ["motion", "motion", "monitoring"],
  ["object", "object", "monitoring"],
  ["crowd", "overcrowd", "safety"],
  ["people", "people_counting", "analytics"],
  ["person", "person", "monitoring"],
  ["queue", "queue", "analytics"],
  ["receipt", "receipt", "operations"],
  ["restricted", "restricted", "safety"],
  ["sandwich", "sandwich", "analytics"],
  ["smoking", "smoking", "safety"],
  ["spill", "spill", "safety"],
  ["vehicle", "vehicle", "monitoring"],
  ["waiting", "waiting", "analytics"],
];

function inferServiceKey(
  rawName: string,
  rawKey?: string
): { key: string; category: AIServiceItem["category"] } {
  // If the API provides an explicit key/slug, trust it first
  if (rawKey && rawKey.length > 1) {
    // Try to find a category for this key
    const byKey = NAME_TO_KEY_MAP.find(([, k]) =>
      rawKey.toLowerCase().includes(k)
    );
    if (byKey) return { key: byKey[1], category: byKey[2] };
    return { key: rawKey, category: "monitoring" };
  }
  const lower = rawName.toLowerCase();
  for (const [substr, key, cat] of NAME_TO_KEY_MAP) {
    if (lower.includes(substr)) return { key, category: cat };
  }
  // fallback slug
  return {
    key: lower.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
    category: "monitoring",
  };
}

/* ------------------------- helpers ------------------------- */

function pickNum(
  d: Record<string, unknown> | undefined,
  ...keys: string[]
): number {
  if (!d) return 0;
  for (const k of keys) {
    const v = d[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function pickArr(
  d: Record<string, unknown> | null | undefined,
  ...keys: string[]
): unknown[] {
  if (!d) return [];
  for (const k of keys) {
    const v = d[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function buildDashboardQuery(f: DashboardFilters & { assignedToMe?: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date_from: f.from ?? today,
    date_to: f.to ?? today,
    branch_id: f.branchId,
    assigned_to_me: f.assignedToMe ? true : undefined,
  } as Record<string, string | number | boolean | undefined>;
}

/* ------------------------- shared fetch with in-flight cache ------------------------- */

type DashPayload = Record<string, unknown>;
const inflight = new Map<string, Promise<DashPayload | null>>();

function fetchDashboard(
  f: DashboardFilters & { assignedToMe?: boolean } = {}
): Promise<DashPayload | null> {
  const q = buildDashboardQuery(f);
  const key = JSON.stringify(q);
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = api
    .get<Record<string, unknown>>(endpoints.dashboard.overview, { query: q })
    .then((raw) => {
      const d = ((raw?.data as Record<string, unknown>) ?? raw) as Record<
        string,
        unknown
      >;
      return d ?? null;
    })
    .catch(() => null)
    .finally(() => {
      setTimeout(() => inflight.delete(key), 1000);
    });
  inflight.set(key, p);
  return p;
}

/* ------------------------- public service api ------------------------- */

export const dashboardService = {
  getSummary: async (f: DashboardFilters = {}): Promise<DashboardSummary> => {
    const fallback: DashboardSummary = {
      cameras: { online: 4, total: 4 },
      aiServicesActive: 29,
      detections: 3890,
      branches: [
        { id: "main", name: "Main Branch" },
        { id: "second", name: "Second Branch" },
      ],
    };
    const d = await fetchDashboard(f);
    if (!d) return fallback;
    const cameras = (d.cameras ?? {}) as Record<string, unknown>;
    const branchesRaw = pickArr(d ?? undefined, "branches");
    return {
      cameras: {
        online: pickNum(cameras, "online", "active"),
        total: pickNum(cameras, "total", "count", "limit"),
      },
      aiServicesActive:
        pickArr(
          d ?? undefined,
          "active_services",
          "ai_services",
          "aiServices",
          "services"
        ).length ||
        pickNum(d, "ai_services_active", "aiServicesActive", "services_active"),
      detections: pickNum(
        (d.detections ?? d) as Record<string, unknown>,
        "total",
        "detections",
        "detections_count",
        "total_detections"
      ),
      branches: branchesRaw.length
        ? branchesRaw.map((b) => {
            const o = (b ?? {}) as Record<string, unknown>;
            return {
              id: String(o.id ?? o.uuid ?? ""),
              name: String(o.name ?? o.name_en ?? o.name_ar ?? "—"),
            };
          })
        : fallback.branches,
    };
  },

  /**
   * Maps active_services from the dashboard payload.
   * API shape: { active_services: [{ id, name_en, name_ar }, …] }
   */
  listAIServices: async (
    f: DashboardFilters = {}
  ): Promise<AIServiceItem[]> => {
    const d = await fetchDashboard(f);
    // Try active_services first (real API), then fallback keys
    const arr = pickArr(
      d ?? undefined,
      "active_services",
      "ai_services",
      "aiServices",
      "services"
    );
    if (!arr.length) return DEMO_AI_SERVICES;
    return arr.map((s, i) => {
      const o = (s ?? {}) as Record<string, unknown>;
      const rawName = String(
        o.name_en ?? o.name ?? o.label ?? `Service ${i + 1}`
      );
      const rawKey = String(o.key ?? o.slug ?? o.code ?? "");
      const { key, category } = inferServiceKey(rawName, rawKey);
      return {
        id: String(o.id ?? i + 1),
        key,
        name: rawName,
        category: ((o.category as string) ??
          category) as AIServiceItem["category"],
        status: (o.status === "inactive"
          ? "inactive"
          : "active") as AIServiceItem["status"],
        detections: pickNum(o, "detections", "count") || undefined,
      };
    });
  },

  getTaskSummary: async (
    f: DashboardFilters & { assignedToMe?: boolean } = {}
  ): Promise<TaskSummary> => {
    const d = await fetchDashboard({
      ...f,
      assignedToMe: f.assignedToMe ?? true,
    });
    if (!d)
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        overdue: 0,
        completionRate: 0,
      };
    const tasks = (d.tasks as Record<string, unknown>) ?? d ?? {};
    return {
      total: pickNum(tasks, "total", "total_tasks"),
      open: pickNum(tasks, "open", "pending", "open_tasks"),
      inProgress: pickNum(tasks, "in_progress", "inProgress"),
      overdue: pickNum(tasks, "overdue"),
      completionRate: pickNum(tasks, "completion_rate", "completionRate"),
    };
  },

  getVisitorFlow: async (
    f: DashboardFilters = {}
  ): Promise<VisitorFlowPoint[]> => {
    const d = await fetchDashboard(f);
    const arr = pickArr(d ?? undefined, "visitor_flow", "visitorFlow", "flow");
    if (!arr.length) return DEMO_VISITOR_FLOW;
    return arr.map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return {
        hour: String(o.hour ?? o.h ?? ""),
        in: pickNum(o, "in", "ins"),
        out: pickNum(o, "out", "outs"),
      };
    });
  },

  getLiveActivity: async (
    f: DashboardFilters = {}
  ): Promise<LiveActivity[]> => {
    const d = await fetchDashboard(f);
    // recent_detections from dashboard doubles as live activity
    const arr = pickArr(
      d ?? undefined,
      "live_activity",
      "liveActivity",
      "activity",
      "recent_detections",
      "recentDetections"
    );
    if (!arr.length) return DEMO_LIVE_ACTIVITY;
    return arr.map((a, i) => {
      const o = (a ?? {}) as Record<string, unknown>;
      const type = String(o.type ?? "event");
      const score = Number(o.score ?? 0);
      const severity: LiveActivity["severity"] =
        type.includes("violation") ||
        type.includes("fire") ||
        type.includes("smoke")
          ? score >= 0.8
            ? "critical"
            : "warning"
          : "info";
      return {
        id: String(o.id ?? i),
        type,
        branch: String(o.branch ?? o.branch_name ?? "—"),
        source: String(o.source ?? o.camera ?? "—"),
        agoSeconds: pickNum(o, "ago_seconds", "agoSeconds"),
        severity: (o.severity as LiveActivity["severity"]) ?? severity,
        timestamp: String(o.timestamp ?? o.detected_at ?? o.time ?? ""),
      };
    });
  },

  getAttendance: async (f: DashboardFilters = {}): Promise<AttendanceData> => {
    const d = await fetchDashboard(f);
    const a = (d?.attendance as Record<string, unknown>) ?? null;
    if (!a) return DEMO_ATTENDANCE;
    return {
      total: pickNum(a, "total", "total_employees"),
      checkedIn: pickNum(a, "checked_in", "checkedIn"),
      present: pickNum(a, "present", "still_present"),
      checkedOut: pickNum(a, "checked_out", "checkedOut"),
      absent: pickNum(a, "absent"),
    };
  },

  getCompliance: async (f: DashboardFilters = {}): Promise<ComplianceData> => {
    const d = await fetchDashboard(f);
    const c = (d?.compliance as Record<string, unknown>) ?? null;
    if (!c) return DEMO_COMPLIANCE;
    return {
      score: pickNum(c, "score"),
      totalDetections: pickNum(c, "total_detections", "totalDetections"),
      violations: pickNum(c, "violations"),
      clean: pickNum(c, "clean"),
    };
  },

  getDetectionBreakdown: async (
    f: DashboardFilters = {}
  ): Promise<DetectionBreakdownItem[]> => {
    const d = await fetchDashboard(f);
    const arr = pickArr(
      d ?? undefined,
      "detections_breakdown",
      "detectionsBreakdown",
      "breakdown"
    );
    if (!arr.length) return DEMO_BREAKDOWN;
    return arr.map((b) => {
      const o = (b ?? {}) as Record<string, unknown>;
      return {
        key: String(o.key ?? o.slug ?? ""),
        label: String(o.label ?? o.name ?? "—"),
        count: pickNum(o, "count"),
        percent: pickNum(o, "percent", "percentage"),
        color: String(o.color ?? "#6366f1"),
      };
    });
  },

  getBranches: async (f: DashboardFilters = {}): Promise<BranchSummary[]> => {
    const d = await fetchDashboard(f);
    const arr = pickArr(
      d ?? undefined,
      "branches_summary",
      "branchesSummary",
      "branches"
    );
    if (!arr.length) return DEMO_BRANCHES;
    return arr.map((b, i) => {
      const o = (b ?? {}) as Record<string, unknown>;
      const camCount = (o.cameras_count as number) ?? 0;
      return {
        id: String(o.id ?? i),
        name: String(o.name ?? o.name_en ?? "—"),
        camerasOnline: pickNum(o, "cameras_online", "camerasOnline"),
        camerasTotal:
          pickNum(o, "cameras_total", "camerasTotal", "cameras_count") ||
          camCount,
        detections: pickNum(o, "detections"),
        grade: String(o.grade ?? "—"),
      };
    });
  },

  /** GET /customer/notifications/unread-count */
  getUnreadNotifications: () =>
    safe(
      api
        .get<{
          count?: number;
          data?: { count?: number };
        }>(endpoints.customer.notificationsUnread)
        .then((r) => Number(r?.count ?? r?.data?.count ?? 0)),
      0
    ),

  /** GET /customer/notifications?per_page=20 */
  listNotifications: (perPage = 20) =>
    safe(
      api.get<{ data?: unknown[] }>(endpoints.customer.notifications, {
        query: { per_page: perPage },
      }),
      { data: [] }
    ),

  /** GET /customer/profile */
  getProfile: () =>
    safe(api.get<Record<string, unknown>>(endpoints.customer.profile), {}),
};
