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
import { toLocalISODate } from "@/lib/utils";

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
  ["smoke", "smoke_detection", "safety"],
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

// Palette used by the OLD production AI Detection Breakdown card. Colors are
// assigned to services by index so the new dashboard renders identical hues.
const BREAKDOWN_COLORS = [
  "#667eea",
  "#4caf50",
  "#ff9800",
  "#f44336",
  "#2196f3",
  "#9c27b0",
  "#00bcd4",
  "#e91e63",
];

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
  const today = toLocalISODate(new Date());
  return {
    // Backend contract (Postman: /customer/dashboard) expects `from` / `to`.
    // Sending `date_from` / `date_to` made the backend ignore the range.
    from: f.from ?? today,
    to: f.to ?? today,
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
    .catch(() => {
      inflight.delete(key); // evict on error so next call retries
      return null;
    })
    .finally(() => {
      setTimeout(() => inflight.delete(key), 30_000); // 30s TTL — prevents duplicate calls on re-renders/navigation
    });
  inflight.set(key, p);
  return p;
}

/**
 * Fetch per-branch camera online state from the realtime pulse
 * (`/customer/realtime/pulse`). Returns one entry per camera with its branch
 * name and online flag. On failure it returns an empty array — never demo
 * cameras — so branch stats stay honest (no fabricated online cameras).
 */
type PulseCamFlag = { branch: string; online: boolean };
let pulseCamsCache: { at: number; promise: Promise<PulseCamFlag[]> } | null =
  null;

function fetchPulseCameras(): Promise<PulseCamFlag[]> {
  const now = Date.now();
  if (pulseCamsCache && now - pulseCamsCache.at < 15_000) {
    return pulseCamsCache.promise;
  }
  const promise = api
    .get<Record<string, unknown>>(endpoints.monitoring.pulse)
    .then((raw) => {
      const d = ((raw?.data as Record<string, unknown>) ?? raw) as Record<
        string,
        unknown
      >;
      const cams = pickArr(d, "cameras");
      return cams.map((c) => {
        const o = (c ?? {}) as Record<string, unknown>;
        const isOnline =
          o.is_online === true ||
          (o.is_online !== false && o.status === "online");
        return {
          branch: String(o.branch ?? "—"),
          online: Boolean(isOnline),
        };
      });
    })
    .catch(() => [] as PulseCamFlag[]);
  pulseCamsCache = { at: now, promise };
  return promise;
}

/**
 * Manually invalidate all cached dashboard entries (call before a forced refresh).
 */
export function invalidateDashboardCache(
  f?: DashboardFilters & { assignedToMe?: boolean }
) {
  if (f) {
    const q = buildDashboardQuery(f);
    inflight.delete(JSON.stringify(q));
  } else {
    inflight.clear();
  }
  pulseCamsCache = null;
}

/* ------------------------- public service api ------------------------- */

export const dashboardService = {
  getSummary: async (f: DashboardFilters = {}): Promise<DashboardSummary> => {
    // No fabricated fallback: a failed/empty payload returns honest zeros so
    // the UI never claims 4/4 cameras or fake branches that don't exist.
    const empty: DashboardSummary = {
      cameras: { online: 0, total: 0 },
      aiServicesActive: 0,
      detections: 0,
      branches: [],
    };
    const d = await fetchDashboard(f);
    if (!d) return empty;
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
      branches: branchesRaw.map((b) => {
        const o = (b ?? {}) as Record<string, unknown>;
        return {
          id: String(o.id ?? o.uuid ?? ""),
          name: String(o.name ?? o.name_en ?? o.name_ar ?? "—"),
        };
      }),
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
    if (!arr.length) return [];
    const mapped = arr.map((s, i) => {
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
    // Deduplicate by canonical key — the API sometimes returns both "smoke"
    // and "fire" (or two "age_gender" entries) which would create duplicate cards.
    const seen = new Set<string>();
    return mapped.filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
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
    if (!arr.length) return [];
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
    if (!arr.length) return [];
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

  getAttendance: async (
    f: DashboardFilters = {}
  ): Promise<AttendanceData | null> => {
    const d = await fetchDashboard(f);
    const a = (d?.attendance as Record<string, unknown>) ?? null;
    if (!a) return null;
    return {
      total: pickNum(a, "total", "total_employees"),
      checkedIn: pickNum(a, "checked_in", "checkedIn"),
      present: pickNum(a, "present", "still_present"),
      checkedOut: pickNum(a, "checked_out", "checkedOut"),
      absent: pickNum(a, "absent"),
    };
  },

  getCompliance: async (
    f: DashboardFilters = {}
  ): Promise<ComplianceData | null> => {
    const d = await fetchDashboard(f);
    const c = (d?.compliance as Record<string, unknown>) ?? null;
    if (!c) return null;
    const totalDetections = pickNum(c, "total_detections", "totalDetections");
    const violations = pickNum(c, "violations");
    let score = pickNum(c, "score");
    // Parity with OLD production: when the backend omits `score`, derive it
    // as 100 - (violations / max(total, 1)) * 100.
    if (!score && totalDetections > 0) {
      score = Math.round(
        100 - (violations / Math.max(totalDetections, 1)) * 100
      );
    }
    return {
      score,
      totalDetections,
      violations,
      clean: pickNum(c, "clean"),
    };
  },

  getDetectionBreakdown: async (
    f: DashboardFilters = {}
  ): Promise<DetectionBreakdownItem[]> => {
    const d = await fetchDashboard(f);
    if (!d) return [];

    // Parity with OLD production dashboard (DetectionBreakdown component):
    // the unified /customer/dashboard payload exposes detections as
    //   detections: { total, by_service: [{ service, count }] }
    // The previous implementation looked for a non-existent
    // `detections_breakdown` field, so the card always rendered empty
    // ("No detections today"). We read `detections.by_service` first, then
    // fall back to grouping `recent_detections` by type when it is absent.
    const detections = (d.detections ?? {}) as Record<string, unknown>;
    let rows = pickArr(detections, "by_service", "byService").map((b) => {
      const o = (b ?? {}) as Record<string, unknown>;
      return {
        service: String(o.service ?? o.label ?? o.name ?? ""),
        count: pickNum(o, "count"),
      };
    });

    // Fallback: derive the breakdown from recent_detections grouped by type.
    if (!rows.length) {
      const recent = pickArr(
        d ?? undefined,
        "recent_detections",
        "recentDetections"
      );
      const grouped: Record<string, number> = {};
      for (const r of recent) {
        const ro = (r ?? {}) as Record<string, unknown>;
        const type = String(ro.type ?? "Unknown");
        grouped[type] = (grouped[type] ?? 0) + 1;
      }
      rows = Object.entries(grouped)
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count);
    }

    if (!rows.length) return [];

    const total = rows.reduce((s, r) => s + r.count, 0) || 1;
    return rows.slice(0, 8).map((r, i) => {
      const label = r.service
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        key: r.service || String(i),
        label: label || "—",
        count: r.count,
        percent: Math.round((r.count / total) * 100),
        color: BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length],
      };
    });
  },

  getBranches: async (f: DashboardFilters = {}): Promise<BranchSummary[]> => {
    // Parity with OLD production dashboard (Branch Comparison Heatmap):
    // the /customer/dashboard payload only carries branches as
    //   branches: [{ id, name, cameras_count }]
    // Per-branch *detections* are derived from `recent_detections` (matched by
    // branch name), per-branch *cameras online* from the realtime pulse, and
    // the letter *grade* from the camera-health percentage. The previous
    // implementation expected `detections`/`cameras_online`/`grade` fields that
    // the backend never sends, so every branch showed "0 detections" / "—".
    const [d, pulseCams] = await Promise.all([
      fetchDashboard(f),
      fetchPulseCameras(),
    ]);
    const arr = pickArr(d ?? undefined, "branches");
    if (!arr.length) return [];

    const recent = pickArr(
      d ?? undefined,
      "recent_detections",
      "recentDetections"
    );

    return arr.map((b, i) => {
      const o = (b ?? {}) as Record<string, unknown>;
      const name = String(o.name ?? o.name_en ?? o.name_ar ?? "—");

      const branchCams = pulseCams.filter((c) => c.branch === name);
      const online = branchCams.filter((c) => c.online).length;
      const offline = branchCams.length - online;
      const camerasTotal =
        pickNum(o, "cameras_count", "cameras_total", "camerasTotal") ||
        online + offline ||
        0;

      const detections = recent.filter((r) => {
        const ro = (r ?? {}) as Record<string, unknown>;
        return String(ro.branch ?? ro.branch_name ?? "") === name;
      }).length;

      const healthPct =
        camerasTotal > 0 ? Math.round((online / camerasTotal) * 100) : 0;
      const grade =
        healthPct >= 90
          ? "A"
          : healthPct >= 70
            ? "B"
            : healthPct >= 50
              ? "C"
              : healthPct >= 1
                ? "D"
                : "F";

      return {
        id: String(o.id ?? i),
        name,
        camerasOnline: online,
        camerasTotal,
        detections,
        grade,
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
        }>(endpoints.notifications.unreadCount)
        .then((r) => Number(r?.count ?? r?.data?.count ?? 0)),
      0
    ),

  /** GET /customer/notifications?per_page=20 */
  listNotifications: (perPage = 20) =>
    safe(
      api.get<{ data?: unknown[] }>(endpoints.notifications.list, {
        query: { per_page: perPage },
      }),
      { data: [] }
    ),

  /** GET /customer/profile */
  getProfile: () =>
    safe(api.get<Record<string, unknown>>(endpoints.auth.profile), {}),
};
