/**
 * camerasService.ts — wraps /customer/cameras endpoints.
 *
 * Postman fields (create):
 *   name, code*, branch_id, active, source*, enable_counter, min_conf,
 *   direction_in, services[0][service_id], services[0][points][0][x/y]
 *
 * Postman fields (update): same + id, line_points[start/end][x/y]
 *
 * FIX: Camera interface and CameraInput now include all Postman fields.
 * FIX: create/update use FormData to support nested array fields.
 * FIX: delete uses /customer/cameras/delete (Postman has a typo pointing to branches/delete).
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, pickObject, str, bool, num, type RawObject } from "@/lib/raw-response";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CameraServicePoint {
  x: number;
  y: number;
}

export interface CameraServiceConfig {
  service_id: string | number;
  points?: CameraServicePoint[];
}

export interface Camera {
  id: string;
  name: string;
  code?: string;           // Postman: code
  source?: string;         // Postman: source (RTSP URL)
  streamUrl?: string;      // alias for source
  location?: string;
  branchId?: string;
  branchName?: string;
  status?: string;
  active: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  ipAddress?: string;
  model?: string;
  enableCounter?: boolean; // Postman: enable_counter
  minConf?: number;        // Postman: min_conf
  directionIn?: string;    // Postman: direction_in
  services?: CameraServiceConfig[];
  createdAt?: string;
}

export interface CameraInput {
  name: string;
  code?: string;
  source?: string;
  stream_url?: string;     // alias for source
  branch_id?: string;
  location?: string;
  ip_address?: string;
  model?: string;
  active?: boolean;
  enable_counter?: boolean;
  min_conf?: number;
  direction_in?: string;
  services?: CameraServiceConfig[];
  // line_points for update
  line_points?: {
    start?: { x: number; y: number };
    end?: { x: number; y: number };
  };
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapCamera(r: RawObject): Camera {
  const branch = r.branch as RawObject | undefined;
  const rawServices = Array.isArray(r.services) ? (r.services as RawObject[]) : [];
  return {
    id: String(r.id ?? ""),
    name: str(r, "name", "label") ?? "Camera",
    code: str(r, "code"),
    source: str(r, "source", "stream_url", "rtsp_url", "url"),
    streamUrl: str(r, "source", "stream_url", "rtsp_url", "url"),
    location: str(r, "location", "address"),
    branchId: str(r, "branch_id") ?? (branch && str(branch, "id")),
    branchName: (branch && str(branch, "name")) ?? str(r, "branch_name"),
    status: str(r, "status"),
    active: bool(r, "is_active", "active") || str(r, "status") === "active",
    isOnline: bool(r, "is_online", "online"),
    lastSeen: str(r, "last_seen", "last_heartbeat"),
    ipAddress: str(r, "ip_address", "ip"),
    model: str(r, "model", "camera_model"),
    enableCounter: bool(r, "enable_counter"),
    minConf: num(r, "min_conf") ?? undefined,
    directionIn: str(r, "direction_in"),
    services: rawServices.map((s) => ({
      service_id: str(s, "service_id") ?? String(s.id ?? ""),
      points: Array.isArray(s.points)
        ? (s.points as RawObject[]).map((p) => ({
            x: Number(p.x ?? 0),
            y: Number(p.y ?? 0),
          }))
        : undefined,
    })),
    createdAt: str(r, "created_at"),
  };
}

// ─── FormData builder ─────────────────────────────────────────────────────────

function buildCameraFormData(input: CameraInput & { id?: string }): FormData {
  const fd = new FormData();
  if (input.id) fd.append("id", input.id);
  fd.append("name", input.name ?? "");
  if (input.code)       fd.append("code", input.code);
  // Postman field is "source"
  const src = input.source ?? input.stream_url ?? "";
  if (src) fd.append("source", src);
  if (input.branch_id)  fd.append("branch_id", input.branch_id);
  if (input.location)   fd.append("location", input.location);
  if (input.ip_address) fd.append("ip_address", input.ip_address);
  if (input.model)      fd.append("model", input.model);
  fd.append("active", input.active !== false ? "1" : "0");
  fd.append("enable_counter", input.enable_counter ? "1" : "0");
  if (input.min_conf !== undefined)
    fd.append("min_conf", String(input.min_conf));
  if (input.direction_in)
    fd.append("direction_in", input.direction_in);
  // services[i][service_id], services[i][points][j][x/y]
  (input.services ?? []).forEach((svc, i) => {
    fd.append(`services[${i}][service_id]`, String(svc.service_id));
    (svc.points ?? []).forEach((pt, j) => {
      fd.append(`services[${i}][points][${j}][x]`, String(pt.x));
      fd.append(`services[${i}][points][${j}][y]`, String(pt.y));
    });
  });
  // line_points for update
  if (input.line_points) {
    const lp = input.line_points;
    if (lp.start) {
      fd.append("line_points[start][x]", String(lp.start.x));
      fd.append("line_points[start][y]", String(lp.start.y));
    }
    if (lp.end) {
      fd.append("line_points[end][x]", String(lp.end.x));
      fd.append("line_points[end][y]", String(lp.end.y));
    }
  }
  return fd;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchCameras(): Promise<Camera[]> {
  const raw = await api.get<unknown>(endpoints.cameras.list);
  return pickArray(raw).map(mapCamera);
}

export async function fetchCameraById(cameraId: string): Promise<Camera> {
  const raw = await api.get<unknown>(endpoints.cameras.single, {
    query: { id: cameraId },
  });
  return mapCamera(pickObject(raw));
}

export async function checkCamerasOnline(): Promise<Record<string, boolean>> {
  const raw = await api.post<unknown>(endpoints.cameras.checkOnline);
  return (typeof raw === "object" && raw !== null
    ? raw
    : {}) as Record<string, boolean>;
}

/** POST /customer/cameras/create — sends FormData with indexed services/points */
export async function createCamera(input: CameraInput): Promise<Camera> {
  const fd = buildCameraFormData(input);
  const raw = await api.post<unknown>(endpoints.cameras.create, fd);
  return mapCamera(pickObject(raw));
}

/** POST /customer/cameras/update — sends FormData with id + all fields */
export async function updateCamera(
  cameraId: string,
  input: Partial<CameraInput>
): Promise<Camera> {
  const fd = buildCameraFormData({ name: "", ...input, id: cameraId });
  const raw = await api.post<unknown>(endpoints.cameras.update, fd);
  return mapCamera(pickObject(raw));
}

/**
 * POST /customer/cameras/delete { id }
 * NOTE: Postman has a typo pointing to /customer/branches/delete — the
 * correct endpoint is /customer/cameras/delete and the frontend uses that.
 */
export async function deleteCamera(cameraId: string): Promise<void> {
  await api.post(endpoints.cameras.delete, { id: cameraId });
}
