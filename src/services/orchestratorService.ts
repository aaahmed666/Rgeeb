/**
 * Orchestrator service — wraps the /orchestrator/* control-plane endpoints.
 *
 * These endpoints coordinate the GPU worker fleet that processes camera
 * services:
 *   • GET  /orchestrator/active     — assignments currently being processed
 *   • GET  /orchestrator/pending    — camera-services waiting for a worker
 *   • GET  /orchestrator/stale      — workers that missed the heartbeat window
 *   • GET  /orchestrator/stop-list  — camera-services flagged to stop
 *   • POST /orchestrator/activate   — assign a container to a camera-service
 *   • POST /orchestrator/reset-all  — clear every assignment
 *
 * Auth: the backend gates these with an `X-Orchestrator-Token` header rather
 * than the normal bearer session. We read that token from (in order) an env
 * var or localStorage so an operator can paste it in once; the bearer token
 * from apiFetch is still attached in case the backend also accepts admin
 * sessions. All reads degrade to an empty result on error so the monitoring
 * page never hard-crashes.
 */
import { api, ApiError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

/* ─── Types ──────────────────────────────────────────────────────────────── */

/** A camera-service currently assigned to a worker/container. */
export interface OrchestratorAssignment {
  id: string;
  cameraServiceId: string;
  cameraName?: string;
  serviceName?: string;
  branchName?: string;
  containerId?: string;
  workerId?: string;
  status?: string;
  lastHeartbeat?: string;
  startedAt?: string;
}

/** A camera-service waiting to be picked up. */
export interface OrchestratorPending {
  id: string;
  cameraServiceId: string;
  cameraName?: string;
  serviceName?: string;
  branchName?: string;
  priority?: string;
  requestedAt?: string;
}

/** A worker that stopped sending heartbeats. */
export interface OrchestratorStale {
  id: string;
  workerId?: string;
  cameraServiceId?: string;
  containerId?: string;
  lastHeartbeat?: string;
  staleForSeconds?: number;
}

/** A camera-service the orchestrator has flagged for stopping. */
export interface OrchestratorStopItem {
  id: string;
  cameraServiceId: string;
  cameraName?: string;
  serviceName?: string;
  reason?: string;
  flaggedAt?: string;
}

export interface OrchestratorSnapshot {
  active: OrchestratorAssignment[];
  pending: OrchestratorPending[];
  stale: OrchestratorStale[];
  stopList: OrchestratorStopItem[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const TOKEN_KEY = "app.orchestrator.token";

/** Resolve the orchestrator token from env (build-time) or localStorage. */
function getOrchestratorToken(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_ORCHESTRATOR_TOKEN;
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Persist / clear the orchestrator token (used by the settings field). */
export function setOrchestratorToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

function authHeaders(): Record<string, string> {
  const token = getOrchestratorToken();
  return token ? { "X-Orchestrator-Token": token } : {};
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function optStr(v: unknown): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  return String(v);
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * The collection ships no example bodies, so the exact envelope is unknown.
 * Accept the shapes the rest of this backend uses: a bare array, `{ data }`,
 * or a single named key (`workers`, `items`, `pending`, …).
 */
function toArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of [
      "data",
      "items",
      "results",
      "workers",
      "active",
      "pending",
      "stale",
      "stop_list",
      "stopList",
      "list",
    ]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
    // `{ data: { items: [] } }`
    if (obj.data && typeof obj.data === "object") {
      return toArray(obj.data);
    }
  }
  return [];
}

function pick(r: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (r[k] !== undefined && r[k] !== null) return r[k];
  }
  return undefined;
}

function rowId(r: Record<string, unknown>, idx: number): string {
  return str(
    pick(r, "id", "assignment_id", "camera_service_id", "cameraServiceId", "worker_id"),
    `row-${idx}`
  );
}

/* ─── Mappers ────────────────────────────────────────────────────────────── */

function mapActive(raw: unknown): OrchestratorAssignment[] {
  return toArray(raw).map((r, i) => ({
    id: rowId(r, i),
    cameraServiceId: str(pick(r, "camera_service_id", "cameraServiceId")),
    cameraName: optStr(pick(r, "camera_name", "cameraName", "camera")),
    serviceName: optStr(pick(r, "service_name", "serviceName", "service")),
    branchName: optStr(pick(r, "branch_name", "branchName", "branch")),
    containerId: optStr(pick(r, "container_id", "containerId")),
    workerId: optStr(pick(r, "worker_id", "workerId", "worker")),
    status: optStr(pick(r, "status", "state")),
    lastHeartbeat: optStr(
      pick(r, "last_heartbeat", "lastHeartbeat", "last_heartbeat_at", "updated_at")
    ),
    startedAt: optStr(pick(r, "started_at", "startedAt", "created_at")),
  }));
}

function mapPending(raw: unknown): OrchestratorPending[] {
  return toArray(raw).map((r, i) => ({
    id: rowId(r, i),
    cameraServiceId: str(pick(r, "camera_service_id", "cameraServiceId")),
    cameraName: optStr(pick(r, "camera_name", "cameraName", "camera")),
    serviceName: optStr(pick(r, "service_name", "serviceName", "service")),
    branchName: optStr(pick(r, "branch_name", "branchName", "branch")),
    priority: optStr(pick(r, "priority")),
    requestedAt: optStr(pick(r, "requested_at", "requestedAt", "created_at")),
  }));
}

function mapStale(raw: unknown): OrchestratorStale[] {
  return toArray(raw).map((r, i) => ({
    id: rowId(r, i),
    workerId: optStr(pick(r, "worker_id", "workerId", "worker")),
    cameraServiceId: optStr(pick(r, "camera_service_id", "cameraServiceId")),
    containerId: optStr(pick(r, "container_id", "containerId")),
    lastHeartbeat: optStr(
      pick(r, "last_heartbeat", "lastHeartbeat", "last_heartbeat_at", "updated_at")
    ),
    staleForSeconds: num(pick(r, "stale_for_seconds", "staleForSeconds", "stale_seconds")),
  }));
}

function mapStopList(raw: unknown): OrchestratorStopItem[] {
  return toArray(raw).map((r, i) => ({
    id: rowId(r, i),
    cameraServiceId: str(pick(r, "camera_service_id", "cameraServiceId")),
    cameraName: optStr(pick(r, "camera_name", "cameraName", "camera")),
    serviceName: optStr(pick(r, "service_name", "serviceName", "service")),
    reason: optStr(pick(r, "reason", "message")),
    flaggedAt: optStr(pick(r, "flagged_at", "flaggedAt", "created_at", "updated_at")),
  }));
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Re-throw auth errors so the global 401 handler can run; swallow the rest
    // so one failing feed doesn't blank the whole dashboard.
    if (err instanceof ApiError && err.isAuthError) throw err;
    return fallback;
  }
}

/* ─── Public service ─────────────────────────────────────────────────────── */

export const orchestratorService = {
  getActive: () =>
    safe(
      async () => mapActive(await api.get(endpoints.orchestrator.active, { headers: authHeaders() })),
      []
    ),

  getPending: () =>
    safe(
      async () =>
        mapPending(await api.get(endpoints.orchestrator.pending, { headers: authHeaders() })),
      []
    ),

  getStale: () =>
    safe(
      async () => mapStale(await api.get(endpoints.orchestrator.stale, { headers: authHeaders() })),
      []
    ),

  getStopList: () =>
    safe(
      async () =>
        mapStopList(await api.get(endpoints.orchestrator.stopList, { headers: authHeaders() })),
      []
    ),

  /** Fetch every feed in parallel for the monitoring page. */
  getSnapshot: async (): Promise<OrchestratorSnapshot> => {
    const [active, pending, stale, stopList] = await Promise.all([
      orchestratorService.getActive(),
      orchestratorService.getPending(),
      orchestratorService.getStale(),
      orchestratorService.getStopList(),
    ]);
    return { active, pending, stale, stopList };
  },

  /** Assign a container to a camera-service. */
  activate: async (cameraServiceId: string | number, containerId: string | number) => {
    const fd = new FormData();
    fd.append("camera_service_id", String(cameraServiceId));
    fd.append("container_id", String(containerId));
    return api.post(endpoints.orchestrator.activate, fd, { headers: authHeaders() });
  },

  /** Clear every assignment. */
  resetAll: async () =>
    api.post(endpoints.orchestrator.resetAll, new FormData(), { headers: authHeaders() }),

  hasToken: () => Boolean(getOrchestratorToken()),
};
