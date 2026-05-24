/**
 * Cameras service — wraps /customer/cameras endpoints.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

function s(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : typeof v === "number" ? String(v) : undefined;
}
function b(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "active";
  return false;
}
function listFrom(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const d = (res as { data?: unknown })?.data;
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  const nested = (d as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  return [];
}

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

function mapCamera(r: Record<string, unknown>): Camera {
  return {
    id: String(r.id ?? ""),
    name: s(r.name) ?? s(r.label) ?? "Camera",
    streamUrl: s(r.stream_url) ?? s(r.rtsp_url) ?? s(r.url),
    location: s(r.location) ?? s(r.address),
    branchId: s(r.branch_id) ?? s((r.branch as any)?.id),
    branchName: s((r.branch as any)?.name) ?? s(r.branch_name),
    status: s(r.status),
    active: b(r.is_active ?? r.active ?? r.status),
    isOnline: b(r.is_online ?? r.online),
    lastSeen: s(r.last_seen ?? r.last_heartbeat),
    ipAddress: s(r.ip_address ?? r.ip),
    model: s(r.model ?? r.camera_model),
    createdAt: s(r.created_at),
  };
}

export async function fetchCameras(): Promise<Camera[]> {
  const raw = await api.get<unknown>(endpoints.cameras.list);
  return listFrom(raw).map(mapCamera);
}

export async function fetchCameraById(id: string): Promise<Camera> {
  const raw = await api.get<unknown>(endpoints.cameras.single, { query: { id } });
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapCamera(r);
}

export async function checkCamerasOnline(): Promise<Record<string, boolean>> {
  const raw = await api.post<unknown>(endpoints.cameras.checkOnline);
  return (raw as any) ?? {};
}

export async function createCamera(input: CameraInput): Promise<Camera> {
  const raw = await api.post<unknown>(endpoints.cameras.create, input);
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapCamera(r);
}

export async function updateCamera(id: string, input: Partial<CameraInput>): Promise<Camera> {
  const raw = await api.post<unknown>(endpoints.cameras.update, { id, ...input });
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapCamera(r);
}

export async function deleteCamera(id: string): Promise<void> {
  await api.post(endpoints.cameras.delete, { id });
}
