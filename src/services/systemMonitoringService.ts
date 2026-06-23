/**
 * System monitoring service – wraps /customer/realtime/pulse.
 * The pulse endpoint returns camera health, recent alerts and worker stats
 * in a single payload, so getAlerts piggybacks on the same call.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface SystemPulse {
  systemHealth: number;
  camerasOnline: number;
  camerasTotal: number;
  activeWorkers: number;
  detectionsToday: number;
  updatedAt: string;
  cameras: PulseCamera[];
  alerts: AlertItem[];
}

export interface PulseCamera {
  id: string;
  name: string;
  branch: string;
  status: "online" | "offline" | "degraded";
  lastSeen: string;
}

export interface AlertItem {
  id: string;
  type: string;
  source: string;
  branch: string;
  confidence?: number;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  image?: string;
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function severityFor(type: string, score: number): AlertItem["severity"] {
  if (
    type.includes("violation") ||
    type.includes("fire") ||
    type.includes("smoke")
  ) {
    return score >= 0.8 ? "critical" : "warning";
  }
  return "info";
}

interface PulsePayload {
  detections_today?: number;
  active_workers?: number;
  timestamp?: string;
  camera_health?: {
    total?: number;
    online?: number;
    degraded?: number;
    offline?: number;
  };
  cameras?: Array<{
    id?: number | string;
    name?: string;
    branch?: string;
    status?: string;
    is_online?: boolean;
    last_detection_at?: string | null;
    last_heartbeat_at?: string | null;
  }>;
  recent_alerts?: Array<{
    id?: number | string;
    type?: string;
    camera?: string;
    branch?: string;
    score?: number;
    detected_at?: string;
    image?: string;
  }>;
}

let cached: { at: number; promise: Promise<SystemPulse> } | null = null;

async function fetchPulse(): Promise<SystemPulse> {
  try {
    const raw = await api.get<PulsePayload | { data: PulsePayload }>(
      endpoints.monitoring.pulse
    );
    const d = ((raw as { data?: PulsePayload })?.data ?? raw) as PulsePayload;

    const health = d.camera_health ?? {};
    const total = num(health.total ?? d.cameras?.length, 0);
    const online = num(health.online, 0);
    const systemHealth = total > 0 ? Math.round((online / total) * 100) : 0;

    const cameras: PulseCamera[] = (d.cameras ?? []).map((c, i) => {
      const status =
        (c.is_online === false
          ? "offline"
          : (c.status as PulseCamera["status"])) || "online";
      const last = c.last_detection_at ?? c.last_heartbeat_at;
      return {
        id: String(c.id ?? i),
        name: String(c.name ?? `Camera ${i + 1}`),
        branch: String(c.branch ?? "—"),
        status: (["online", "offline", "degraded"].includes(status)
          ? status
          : "online") as PulseCamera["status"],
        lastSeen: last ? formatTime(last) : "Never",
      };
    });

    const alerts: AlertItem[] = (d.recent_alerts ?? []).map((a, i) => {
      const type = String(a.type ?? "detection");
      const score = num(a.score, 0);
      return {
        id: String(a.id ?? i),
        type,
        source: String(a.camera ?? "—"),
        branch: String(a.branch ?? "—"),
        confidence: a.score != null ? Math.round(score * 100) : undefined,
        severity: severityFor(type, score),
        timestamp: formatTime(String(a.detected_at ?? "")),
        image: a.image,
      };
    });

    return {
      systemHealth,
      camerasOnline: online,
      camerasTotal: total,
      activeWorkers: num(d.active_workers, 0),
      detectionsToday: num(d.detections_today, 0),
      updatedAt: String(d.timestamp ?? new Date().toISOString()),
      cameras,
      alerts,
    };
  } catch {
    return {
      systemHealth: 0,
      camerasOnline: 0,
      camerasTotal: 0,
      activeWorkers: 0,
      detectionsToday: 0,
      updatedAt: new Date().toISOString(),
      cameras: [],
      alerts: [],
    };
  }
}

function getPulseCached(): Promise<SystemPulse> {
  const now = Date.now();
  if (cached && now - cached.at < 3000) return cached.promise;
  const promise = fetchPulse();
  cached = { at: now, promise };
  return promise;
}

export const systemMonitoringService = {
  getPulse: () => getPulseCached(),
  getAlerts: async (limit = 10): Promise<AlertItem[]> => {
    const pulse = await getPulseCached();
    return pulse.alerts.slice(0, limit);
  },
};
