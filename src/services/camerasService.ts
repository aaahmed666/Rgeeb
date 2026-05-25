/**
 * Cameras service — wraps /customer/cameras endpoints.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, pickObject, str, bool, type RawObject } from "@/lib/raw-response";

export interface Camera {
  id: string;
  name: string;
  streamUrl?: string;
  location?: string;
  branchId?: string;
  branchName?: string;
  status?: string;
  active: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  ipAddress?: string;
  model?: string;
  createdAt?: string;
}

export interface CameraInput {
  name: string;
  stream_url?: string;
  location?: string;
  branch_id?: string;
  ip_address?: string;
  model?: string;
  active?: boolean;
}

function mapCamera(r: RawObject): Camera {
  const branch = r.branch as RawObject | undefined;
  return {
    id: String(r.id ?? ""),
    name: str(r, "name", "label") ?? "Camera",
    streamUrl: str(r, "stream_url", "rtsp_url", "url"),
    location: str(r, "location", "address"),
    branchId: str(r, "branch_id") ?? (branch && str(branch, "id")),
    branchName: (branch && str(branch, "name")) ?? str(r, "branch_name"),
    status: str(r, "status"),
    active: bool(r, "is_active", "active") || str(r, "status") === "active",
    isOnline: bool(r, "is_online", "online"),
    lastSeen: str(r, "last_seen", "last_heartbeat"),
    ipAddress: str(r, "ip_address", "ip"),
    model: str(r, "model", "camera_model"),
    createdAt: str(r, "created_at"),
  };
}

export async function fetchCameras(): Promise<Camera[]> {
  const raw = await api.get<unknown>(endpoints.cameras.list);
  return pickArray(raw).map(mapCamera);
}

export async function fetchCameraById(cameraId: string): Promise<Camera> {
  const raw = await api.get<unknown>(endpoints.cameras.single, { query: { id: cameraId } });
  return mapCamera(pickObject(raw));
}

export async function checkCamerasOnline(): Promise<Record<string, boolean>> {
  const raw = await api.post<unknown>(endpoints.cameras.checkOnline);
  return (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, boolean>;
}

export async function createCamera(input: CameraInput): Promise<Camera> {
  const raw = await api.post<unknown>(endpoints.cameras.create, input);
  return mapCamera(pickObject(raw));
}

export async function updateCamera(
  cameraId: string,
  input: Partial<CameraInput>,
): Promise<Camera> {
  const raw = await api.post<unknown>(endpoints.cameras.update, { id: cameraId, ...input });
  return mapCamera(pickObject(raw));
}

export async function deleteCamera(cameraId: string): Promise<void> {
  await api.post(endpoints.cameras.delete, { id: cameraId });
}
