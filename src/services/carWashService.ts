/**
 * carWashService.ts — wraps the vehicle / car-wash monitoring endpoints.
 *
 * No dedicated backend module exists for car wash, so this service composes
 * the existing customer feeds documented in the Postman collection:
 *   - GET /customer/drive-thru/dashboard      → KPIs, vehicle log, breakdowns
 *   - GET /customer/cameras                    → camera grid
 *   - GET /customer/cameras/stream             → live stream URL/token
 *   - GET /customer/analytics/summary          → fallback KPI source
 *   - GET /customer/analytics/by-service       → service breakdown fallback
 *   - GET /customer/analytics/by-camera        → vehicle classification fallback
 *
 * Backend field names vary, so every normalizer reads several candidate keys
 * and degrades gracefully (missing data → 0 / empty array) instead of
 * fabricating numbers.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, pickObject, str, num, bool, type RawObject } from "@/lib/raw-response";

/* ── Public types (consumed by the views) ─────────────────────────────────── */
export type ServiceType =
  | "no-service"
  | "internal-only"
  | "external-only"
  | "full";
export type VehicleClass = string; // "SUV" | "Sedan" | "Car" | "Truck" | ...

export interface CarWashCamera {
  id: string;
  name: string;
  location: string;
  online: boolean;
  zones: number;
}

export interface VehicleLogEntry {
  id: string;
  time: string;
  plate: string;
  trackId: number;
  vehicleClass: VehicleClass;
  service: ServiceType;
  extSeconds: number;
  intSeconds: number;
  zones: string[];
}

export interface CarWashSummary {
  totalVehicles: number;
  activeCameras: number;
  totalCameras: number;
  fullService: number;
  avgDurationMin: number;
  avgExtSeconds: number;
  avgIntSeconds: number;
}

export interface ServiceBreakdownSlice {
  type: ServiceType;
  count: number;
}

export interface ClassificationBar {
  vehicleClass: VehicleClass;
  count: number;
}

export interface CarWashFilters {
  branchId?: string;
  date?: string; // YYYY-MM-DD
  dateFrom?: string;
  dateTo?: string;
}

/* ── Theme-aware colours (CSS variables, track light/dark) ─────────────────── */
export const SERVICE_COLORS: Record<ServiceType, string> = {
  "no-service": "var(--chart-4)",
  "internal-only": "var(--chart-3)",
  "external-only": "var(--primary)",
  full: "var(--status-success)",
};

export const SERVICE_LABEL_KEY: Record<ServiceType, string> = {
  "no-service": "carWash.service.noService",
  "internal-only": "carWash.service.internalOnly",
  "external-only": "carWash.service.externalOnly",
  full: "carWash.service.fullService",
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s <= 0) return "0s";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (sec === 0) return `${m}m`;
  return `${m}m ${sec}s`;
}

function normalizeServiceType(raw?: string): ServiceType {
  const v = (raw ?? "").toLowerCase().replace(/[\s_]+/g, "-");
  if (v.includes("full") || v.includes("both")) return "full";
  if (v.includes("ext")) return "external-only";
  if (v.includes("int")) return "internal-only";
  if (v.includes("no") || v === "" || v.includes("none")) return "no-service";
  return "no-service";
}

function q(f?: CarWashFilters) {
  if (!f) return undefined;
  const out: Record<string, string> = {};
  if (f.branchId && f.branchId !== "all") out.branch_id = f.branchId;
  if (f.date) out.date = f.date;
  if (f.dateFrom) out.date_from = f.dateFrom;
  if (f.dateTo) out.date_to = f.dateTo;
  return Object.keys(out).length ? out : undefined;
}

/* ── Normalizers ──────────────────────────────────────────────────────────── */
function normalizeSummary(raw: unknown, camerasFallback?: CarWashCamera[]): CarWashSummary {
  const o = pickObject(raw);
  // drive-thru dashboard usually nests stats under "summary"/"stats"/"kpis"
  const s = pickObject(o.summary ?? o.stats ?? o.kpis ?? o);

  const total = camerasFallback?.length ?? 0;
  const active = camerasFallback?.filter((c) => c.online).length ?? 0;

  return {
    totalVehicles: num(s, "total_vehicles", "total", "vehicles", "count") ?? 0,
    activeCameras: num(s, "active_cameras") ?? active,
    totalCameras: num(s, "total_cameras") ?? total,
    fullService: num(s, "full_service", "full") ?? 0,
    avgDurationMin: num(s, "avg_duration", "avg_duration_min", "average_duration") ?? 0,
    avgExtSeconds: num(s, "avg_ext_seconds", "avg_external_seconds", "avg_ext") ?? 0,
    avgIntSeconds: num(s, "avg_int_seconds", "avg_internal_seconds", "avg_int") ?? 0,
  };
}

function normalizeCameras(raw: unknown): CarWashCamera[] {
  return pickArray(raw).map((r) => {
    const o = r as RawObject;
    const zonesVal = o.zones ?? o.roi_zones ?? o.services;
    const zones = Array.isArray(zonesVal)
      ? zonesVal.length
      : num(o, "zones_count", "zones") ?? 0;
    return {
      id: str(o, "id", "code") ?? "",
      name: str(o, "name", "code", "camera_name") ?? "—",
      location:
        str(o, "branch_name", "location", "country", "address") ?? "—",
      online: bool(o, "is_online", "online", "active"),
      zones,
    };
  });
}

function normalizeVehicleLog(raw: unknown): VehicleLogEntry[] {
  const o = pickObject(raw);
  const rows = pickArray(o.vehicles ?? o.log ?? o.vehicle_log ?? o.records ?? raw);
  return rows.map((r) => {
    const v = r as RawObject;
    const ext = num(v, "ext_seconds", "external_seconds", "ext_time", "exterior_seconds") ?? 0;
    const int = num(v, "int_seconds", "internal_seconds", "int_time", "interior_seconds") ?? 0;
    const zonesVal = v.zones ?? v.zone;
    const zones = Array.isArray(zonesVal)
      ? zonesVal.map((z) => String(z))
      : zonesVal
        ? [String(zonesVal)]
        : [];
    return {
      id: str(v, "id", "track_id", "plate") ?? Math.random().toString(36).slice(2),
      time: str(v, "time", "timestamp", "detected_at", "created_at") ?? "",
      plate: str(v, "plate", "plate_number", "license_plate") ?? "—",
      trackId: num(v, "track_id", "trackId", "id") ?? 0,
      vehicleClass: str(v, "class", "vehicle_class", "type") ?? "—",
      service: normalizeServiceType(str(v, "service", "service_type", "status")),
      extSeconds: ext,
      intSeconds: int,
      zones,
    };
  });
}

function normalizeServiceBreakdown(raw: unknown): ServiceBreakdownSlice[] {
  const o = pickObject(raw);
  const rows = pickArray(
    o.service_breakdown ?? o.breakdown ?? o.by_service ?? o.services ?? raw,
  );
  const slices = rows.map((r) => {
    const row = r as RawObject;
    return {
      type: normalizeServiceType(str(row, "type", "service", "name", "name_en")),
      count: num(row, "count", "total", "value") ?? 0,
    };
  });
  // merge duplicates by type
  const merged = new Map<ServiceType, number>();
  for (const s of slices) merged.set(s.type, (merged.get(s.type) ?? 0) + s.count);
  return [...merged.entries()]
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ type, count }));
}

function normalizeClassification(raw: unknown): ClassificationBar[] {
  const o = pickObject(raw);
  const rows = pickArray(
    o.classification ?? o.vehicle_classification ?? o.by_class ?? o.classes ?? raw,
  );
  return rows
    .map((r) => {
      const row = r as RawObject;
      return {
        vehicleClass: str(row, "class", "vehicle_class", "name", "label") ?? "—",
        count: num(row, "count", "total", "value") ?? 0,
      };
    })
    .filter((c) => c.count > 0 || c.vehicleClass !== "—");
}

/* ── Service ──────────────────────────────────────────────────────────────── */
export const carWashService = {
  /** Camera grid for the dashboard. */
  getCameras: async (): Promise<CarWashCamera[]> => {
    const raw = await api.get<unknown>(endpoints.carWash.cameras);
    return normalizeCameras(raw);
  },

  /** Live stream URL/token for a camera. */
  getStream: async (cameraId: string): Promise<string | null> => {
    const raw = await api.get<unknown>(endpoints.carWash.cameraStream, {
      query: { id: cameraId },
    });
    const o = pickObject(raw);
    return str(o, "url", "stream_url", "hls", "src") ?? null;
  },

  /** Dashboard KPIs (composes the drive-thru feed + camera list). */
  getSummary: async (f?: CarWashFilters): Promise<CarWashSummary> => {
    const [raw, cameras] = await Promise.all([
      api.get<unknown>(endpoints.carWash.dashboard, { query: q(f) }).catch(() => ({})),
      carWashService.getCameras().catch(() => [] as CarWashCamera[]),
    ]);
    return normalizeSummary(raw, cameras);
  },

  /** Full analytics payload (summary cards + charts + vehicle log). */
  getAnalytics: async (
    f?: CarWashFilters,
  ): Promise<{
    summary: CarWashSummary;
    breakdown: ServiceBreakdownSlice[];
    classification: ClassificationBar[];
    vehicleLog: VehicleLogEntry[];
  }> => {
    const dash = await api
      .get<unknown>(endpoints.carWash.dashboard, { query: q(f) })
      .catch(() => ({}));

    let breakdown = normalizeServiceBreakdown(dash);
    let classification = normalizeClassification(dash);
    const vehicleLog = normalizeVehicleLog(dash);

    // If the drive-thru feed didn't include breakdowns, fall back to analytics.
    if (breakdown.length === 0) {
      const bySvc = await api
        .get<unknown>(endpoints.carWash.analyticsByService, { query: q(f) })
        .catch(() => []);
      breakdown = normalizeServiceBreakdown(bySvc);
    }
    if (classification.length === 0) {
      const byCam = await api
        .get<unknown>(endpoints.carWash.analyticsByCamera, { query: q(f) })
        .catch(() => []);
      classification = normalizeClassification(byCam);
    }

    const cameras = await carWashService.getCameras().catch(() => [] as CarWashCamera[]);
    const summary = normalizeSummary(dash, cameras);

    return { summary, breakdown, classification, vehicleLog };
  },
};
