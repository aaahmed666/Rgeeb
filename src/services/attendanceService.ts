/**
 * Attendance service — wraps /customer/attendances endpoints.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, pickObject, str, num, bool, type RawObject } from "@/lib/raw-response";

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
}

function mapAttendance(r: RawObject): AttendanceRecord {
  const employee = r.employee as RawObject | undefined;
  const branch = r.branch as RawObject | undefined;
  return {
    id: String(r.id ?? ""),
    employeeId: str(r, "employee_id") ?? (employee && str(employee, "id")),
    employeeName: (employee && str(employee, "name")) ?? str(r, "employee_name", "name"),
    branchId: str(r, "branch_id") ?? (branch && str(branch, "id")),
    branchName: (branch && str(branch, "name")) ?? str(r, "branch_name"),
    checkIn: str(r, "check_in", "checked_in_at"),
    checkOut: str(r, "check_out", "checked_out_at"),
    duration: num(r, "duration"),
    status: str(r, "status"),
    date: str(r, "date"),
    notes: str(r, "notes"),
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

export async function fetchAttendances(
  filters?: AttendanceFilters,
): Promise<AttendanceRecord[]> {
  const raw = await api.get<unknown>(endpoints.attendance.list, {
    query: filters as Record<string, string | number | boolean | undefined | null>,
  });
  return pickArray(raw).map(mapAttendance);
}

export async function fetchAttendanceDashboard(params?: {
  branch_id?: string;
  date?: string;
}): Promise<AttendanceDashboard> {
  const raw = await api.get<unknown>(endpoints.attendance.dashboard, {
    query: params as Record<string, string | undefined>,
  });
  const d = pickObject(raw);
  return {
    totalEmployees: num(d, "total_employees", "total") ?? 0,
    presentToday: num(d, "present", "present_today") ?? 0,
    absentToday: num(d, "absent", "absent_today") ?? 0,
    lateToday: num(d, "late", "late_today") ?? 0,
    avgDuration: num(d, "avg_duration") ?? 0,
    recentRecords: pickArray(d.recent ?? d.records ?? []).map(mapAttendance),
  };
}

export async function checkIn(data: {
  user_id: string;           // Postman: user_id (not employee_id)
  photo_file?: File | null;  // Postman: photo_file (FormData file upload)
  branch_id?: string;
  notes?: string;
}): Promise<AttendanceRecord> {
  // Build FormData when photo_file is present (Postman uses multipart)
  let body: FormData | Record<string, unknown>;
  if (data.photo_file) {
    const fd = new FormData();
    fd.append("user_id", data.user_id);
    fd.append("photo_file", data.photo_file);
    if (data.branch_id) fd.append("branch_id", data.branch_id);
    if (data.notes) fd.append("notes", data.notes);
    body = fd;
  } else {
    body = { user_id: data.user_id, branch_id: data.branch_id, notes: data.notes };
  }
  const raw = await api.post<unknown>(endpoints.attendance.checkIn, body);
  return mapAttendance(pickObject(raw));
}

export async function checkOut(data: {
  attendance_id: string;  // Postman: attendance_id
  notes?: string;
}): Promise<AttendanceRecord> {
  const raw = await api.post<unknown>(endpoints.attendance.checkOut, data);
  return mapAttendance(pickObject(raw));
}
