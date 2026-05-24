/**
 * Attendance service — wraps /customer/attendances endpoints.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

function s(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : typeof v === "number" ? String(v) : undefined;
}
function listFrom(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const d = (res as { data?: unknown })?.data;
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  const nested = (d as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  return [];
}

export interface AttendanceRecord {
  id: string;
  employeeId?: string;
  employeeName?: string;
  branchId?: string;
  branchName?: string;
  checkIn?: string;
  checkOut?: string;
  duration?: number; // minutes
  status?: string;
  date?: string;
  notes?: string;
  faceVerified?: boolean;
}

export interface AttendanceDashboard {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgDuration: number;
  recentRecords: AttendanceRecord[];
  raw: unknown;
}

function mapAttendance(r: Record<string, unknown>): AttendanceRecord {
  return {
    id: String(r.id ?? ""),
    employeeId: s(r.employee_id) ?? s((r.employee as any)?.id),
    employeeName: s((r.employee as any)?.name) ?? s(r.employee_name) ?? s(r.name),
    branchId: s(r.branch_id) ?? s((r.branch as any)?.id),
    branchName: s((r.branch as any)?.name) ?? s(r.branch_name),
    checkIn: s(r.check_in ?? r.checked_in_at),
    checkOut: s(r.check_out ?? r.checked_out_at),
    duration: typeof r.duration === "number" ? r.duration : undefined,
    status: s(r.status),
    date: s(r.date),
    notes: s(r.notes),
    faceVerified: typeof r.face_verified === "boolean" ? r.face_verified : undefined,
  };
}

export interface AttendanceFilters {
  date_from?: string;
  date_to?: string;
  branch_id?: string;
  employee_id?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export async function fetchAttendances(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
  const raw = await api.get<unknown>(endpoints.attendance.list, { query: filters as any });
  return listFrom(raw).map(mapAttendance);
}

export async function fetchAttendanceDashboard(params?: {
  branch_id?: string;
  date?: string;
}): Promise<AttendanceDashboard> {
  const raw = await api.get<unknown>(endpoints.attendance.dashboard, { query: params as any });
  const d = (raw as any)?.data ?? raw ?? {};
  return {
    totalEmployees: Number(d.total_employees ?? d.total ?? 0),
    presentToday: Number(d.present ?? d.present_today ?? 0),
    absentToday: Number(d.absent ?? d.absent_today ?? 0),
    lateToday: Number(d.late ?? d.late_today ?? 0),
    avgDuration: Number(d.avg_duration ?? 0),
    recentRecords: listFrom(d.recent ?? d.records ?? []).map(mapAttendance),
    raw: d,
  };
}

export async function checkIn(data: {
  employee_id?: string;
  branch_id?: string;
  face_image?: string;
  notes?: string;
}): Promise<AttendanceRecord> {
  const raw = await api.post<unknown>(endpoints.attendance.checkIn, data);
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapAttendance(r);
}

export async function checkOut(data: {
  attendance_id: string;
  face_image?: string;
  notes?: string;
}): Promise<AttendanceRecord> {
  const raw = await api.post<unknown>(endpoints.attendance.checkOut, data);
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapAttendance(r);
}
