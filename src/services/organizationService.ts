import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

/* ---------------- helpers ---------------- */
function s(v: unknown): string | undefined {
  return typeof v === "string" && v
    ? v
    : typeof v === "number"
      ? String(v)
      : undefined;
}
function b(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string")
    return (
      v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "active"
    );
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

function totalFrom(res: unknown): number {
  const r = (res ?? {}) as Record<string, unknown>;
  const data = (r.data ?? {}) as Record<string, unknown>;
  const meta = (r.meta ?? data.meta ?? {}) as Record<string, unknown>;
  const pagination = (r.pagination ?? data.pagination ?? {}) as Record<
    string,
    unknown
  >;
  // Cover flat, wrapped, meta-based and pagination-based paginator shapes.
  return Number(meta.total ?? r.total ?? data.total ?? pagination.total ?? 0);
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/* ================ Branches ================ */
export interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  phone?: string;
  address?: string;
  camerasCount: number;
  active: boolean;
  /** Municipality permit fields (echoed back for edit pre-fill). */
  permitNumber?: string;
  permitActivityType?: string;
  permitEndDate?: string;
  permitImage?: string;
}

export interface BranchInput {
  name: string;
  name_ar?: string;
  phone?: string;
  address?: string;
  active?: boolean;
  /** Municipality permit fields (parity with OLD AddBranchDrawer). */
  permit_number?: string;
  permit_activity_type?: string;
  permit_end_date?: string;
  permit_image?: File | null;
}

/**
 * Build the multipart body for branch create/update. The OLD production
 * contract (and the Postman collection) expects these exact field names:
 *   municipality_permit_number, activity_type, permit_end_date,
 *   permit_image_file. We map our friendlier input keys onto them and only
 *   append optional fields when present so we don't clobber existing values.
 */
function buildBranchFormData(input: Partial<BranchInput>): FormData {
  const fd = new FormData();
  if (input.name !== undefined) fd.append("name", input.name);
  if (input.name_ar) fd.append("name_ar", input.name_ar);
  if (input.phone !== undefined) fd.append("phone", input.phone);
  if (input.address !== undefined) fd.append("address", input.address);
  if (input.active !== undefined) fd.append("active", input.active ? "1" : "0");
  if (input.permit_number)
    fd.append("municipality_permit_number", input.permit_number);
  if (input.permit_activity_type)
    fd.append("activity_type", input.permit_activity_type);
  if (input.permit_end_date)
    fd.append("permit_end_date", input.permit_end_date);
  if (input.permit_image instanceof File)
    fd.append("permit_image_file", input.permit_image);
  return fd;
}

function mapBranch(r: Record<string, unknown>): Branch {
  const cams =
    r.cameras_count ??
    r.cameras ??
    (Array.isArray(r.cameras) ? (r.cameras as unknown[]).length : 0);
  return {
    id: String(r.id ?? ""),
    name: s(r.name) ?? s(r.name_en) ?? "",
    nameAr: s(r.name_ar),
    phone: s(r.phone) ?? s(r.mobile),
    address: s(r.address) ?? s(r.location),
    camerasCount: Number(cams ?? 0) || 0,
    active: b(r.is_active ?? r.active ?? r.status),
    permitNumber: s(r.municipality_permit_number),
    permitActivityType: s(r.activity_type),
    permitEndDate: s(r.permit_end_date),
    permitImage: s(r.permit_image) ?? s(r.permit_image_file),
  };
}

/**
 * Fetches branches.
 * - No params → sends all=1, returns ALL active branches (for SELECT DROPDOWNS)
 * - With { page, per_page } → returns paginated result (for TABLES)
 */
export async function fetchBranches(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<Branch[]>;
export async function fetchBranches(params: {
  page: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<PaginatedResult<Branch>>;
export async function fetchBranches(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<Branch[] | PaginatedResult<Branch>> {
  const res = await apiFetch<unknown>(endpoints.organization.branches, {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 15,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  const items = listFrom(res).map(mapBranch);
  if (params?.page) {
    // Table mode: return all (active + inactive) with pagination
    return { items, total: totalFrom(res) || items.length };
  }
  // Dropdown mode: filter to active only unless caller opts out
  if (!params?.includeInactive) {
    return items.filter((b) => b.active !== false);
  }
  return items;
}

export async function createBranch(input: BranchInput): Promise<Branch> {
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.organization.branchCreate,
    {
      method: "POST",
      body: buildBranchFormData(input),
    }
  );
  return mapBranch((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateBranch(
  id: string,
  input: Partial<BranchInput>
): Promise<Branch> {
  const fd = buildBranchFormData(input);
  fd.append("id", id);
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.organization.branchUpdate,
    {
      method: "POST",
      body: fd,
    }
  );
  return mapBranch((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteBranch(id: string): Promise<void> {
  await apiFetch(endpoints.organization.branchDelete, {
    method: "POST",
    body: { id },
  });
}

/* ================ Departments ================ */
export interface Department {
  id: string;
  nameEn: string;
  nameAr?: string;
  active: boolean;
  managerId?: string;
  managerName?: string;
  branchId?: string;
  branchName?: string;
}

export interface DepartmentInput {
  name_en: string;
  name_ar?: string;
  active?: boolean;
  manager_id?: string;
  branch_id?: string;
}

function mapDepartment(r: Record<string, unknown>): Department {
  const manager = r.manager as Record<string, unknown> | undefined;
  const branch = r.branch as Record<string, unknown> | undefined;
  return {
    id: String(r.id ?? ""),
    nameEn: s(r.name_en) ?? s(r.name) ?? "",
    nameAr: s(r.name_ar),
    active: b(r.is_active ?? r.active ?? r.status ?? true),
    managerId: s(r.manager_id) ?? s(manager?.id),
    managerName: s(manager?.name) ?? s(manager?.full_name) ?? s(r.manager_name),
    branchId: s(r.branch_id) ?? s(branch?.id),
    branchName: s(branch?.name) ?? s(r.branch_name),
  };
}

/**
 * Fetches departments.
 * - No params → sends all=1, returns ALL active departments (for SELECT DROPDOWNS)
 * - With { page, per_page } → returns paginated result (for TABLES)
 */
export async function fetchDepartments(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<Department[]>;
export async function fetchDepartments(params: {
  page: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<PaginatedResult<Department>>;
export async function fetchDepartments(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
  /** Set true to return ALL statuses (table mode). Default (dropdown mode) returns active only. */
  includeInactive?: boolean;
}): Promise<Department[] | PaginatedResult<Department>> {
  const res = await apiFetch<unknown>(endpoints.organization.departments, {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 15,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  const items = listFrom(res).map(mapDepartment);
  if (params?.page) {
    // Table mode: return all (active + inactive) with pagination
    return { items, total: totalFrom(res) || items.length };
  }
  // Dropdown mode (all=1): filter to active only unless caller opts out
  if (!params?.includeInactive) {
    return items.filter((d) => d.active !== false);
  }
  return items;
}

export async function createDepartment(
  input: DepartmentInput
): Promise<Department> {
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.organization.departmentCreate,
    {
      method: "POST",
      body: input,
    }
  );
  return mapDepartment((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateDepartment(
  id: string,
  input: Partial<DepartmentInput>
): Promise<Department> {
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.organization.departmentUpdate,
    {
      method: "POST",
      body: { id, ...input },
    }
  );
  return mapDepartment((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch(endpoints.organization.departmentDelete, {
    method: "POST",
    body: { id },
  });
}

/* ================ Employees ================ */
export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  departmentNameAr?: string;
  roleId?: string;
  roleName?: string;
  active: boolean;
  isMainAdmin?: boolean;
  nationalId?: string;
  employeeCode?: string;
}

export interface WorkingHourDay {
  day: string;
  is_day_off: 0 | 1 | boolean;
  start_time?: string;
  end_time?: string;
}

export interface EmployeeInput {
  name: string; // API primary (name_en in Postman)
  name_en?: string;
  name_ar?: string;
  email: string;
  phone?: string;
  password?: string;
  branch_id?: string;
  department_id?: string;
  role_id?: string;
  active?: boolean;
  /** Postman: main_admin */
  main_admin?: boolean;
  is_main_admin?: boolean;
  /** Postman: identity (national ID / iqama number) */
  identity?: string;
  national_id?: string;
  /** Postman: code (employee code) */
  code?: string;
  employee_code?: string;
  certificate_number?: string;
  certificate_end_date?: string;
  /** File upload */
  avatar_file?: File | null;
  /** Working schedule: working_hours[N][day/is_day_off/start_time/end_time] */
  working_hours?: WorkingHourDay[];
}

function buildEmployeeFormData(
  input: EmployeeInput & { id?: string }
): FormData {
  const fd = new FormData();
  if (input.id) fd.append("id", input.id);
  // name_en is the Postman field; also send "name" for compatibility
  const nameEn = input.name_en || input.name || "";
  fd.append("name", nameEn);
  fd.append("name_en", nameEn);
  if (input.name_ar) fd.append("name_ar", input.name_ar);
  fd.append("email", input.email || "");
  if (input.phone) fd.append("phone", input.phone);
  if (input.password) fd.append("password", input.password);
  if (input.branch_id) fd.append("branch_id", input.branch_id);
  if (input.department_id) fd.append("department_id", input.department_id);
  if (input.role_id) fd.append("role_id", input.role_id);
  if (input.active !== undefined) fd.append("active", input.active ? "1" : "0");
  // main_admin (Postman field)
  const isAdmin = input.main_admin ?? input.is_main_admin;
  if (isAdmin !== undefined) fd.append("main_admin", isAdmin ? "1" : "0");
  // identity (was national_id)
  const identity = input.identity ?? input.national_id;
  if (identity) fd.append("identity", identity);
  // code (was employee_code)
  const code = input.code ?? input.employee_code;
  if (code) fd.append("code", code);
  if (input.certificate_number)
    fd.append("certificate_number", input.certificate_number);
  if (input.certificate_end_date)
    fd.append("certificate_end_date", input.certificate_end_date);
  if (input.avatar_file) fd.append("avatar_file", input.avatar_file);
  // working_hours[N][day], [is_day_off], [start_time], [end_time]
  (input.working_hours ?? []).forEach((wh, i) => {
    fd.append(`working_hours[${i}][day]`, wh.day);
    fd.append(`working_hours[${i}][is_day_off]`, wh.is_day_off ? "1" : "0");
    if (!wh.is_day_off) {
      if (wh.start_time)
        fd.append(`working_hours[${i}][start_time]`, wh.start_time);
      if (wh.end_time) fd.append(`working_hours[${i}][end_time]`, wh.end_time);
    }
  });
  return fd;
}

function pickName(r: Record<string, unknown>, key: string): string | undefined {
  const v = r[key];
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return s(obj.name) ?? s(obj.name_en) ?? s(obj.title);
  }
  return undefined;
}

function mapEmployee(r: Record<string, unknown>): Employee {
  const dept = r.department as Record<string, unknown> | undefined;
  const branch = r.branch as Record<string, unknown> | undefined;
  const role = r.role as Record<string, unknown> | undefined;
  return {
    id: String(r.id ?? ""),
    name: s(r.name) ?? s(r.full_name) ?? "",
    email: s(r.email),
    phone: s(r.phone) ?? s(r.mobile),
    avatar: s(r.avatar) ?? s(r.image) ?? s(r.photo),
    branchId: s(r.branch_id) ?? s(branch?.id),
    branchName: pickName(r, "branch") ?? s(r.branch_name),
    departmentId: s(r.department_id) ?? s(dept?.id),
    departmentName: s(dept?.name_en) ?? s(dept?.name) ?? s(r.department_name),
    departmentNameAr: s(dept?.name_ar),
    roleId: s(r.role_id) ?? s(role?.id),
    roleName:
      s(role?.name) ??
      s(r.role_name) ??
      (typeof r.role === "string" ? r.role : undefined),
    active: b(r.is_active ?? r.active ?? r.status ?? true),
    isMainAdmin: b(r.is_main_admin ?? r.is_admin ?? false),
    nationalId: s(r.national_id) ?? s(r.iqama),
    employeeCode: s(r.employee_code) ?? s(r.code),
  };
}

/**
 * Fetches employees.
 * - No params → sends all=1, returns ALL active employees (for SELECT DROPDOWNS)
 * - With { page, per_page } → returns paginated result (for TABLES)
 */
export async function fetchEmployees(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<Employee[]>;
export async function fetchEmployees(params: {
  page: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<PaginatedResult<Employee>>;
export async function fetchEmployees(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
  includeInactive?: boolean;
}): Promise<Employee[] | PaginatedResult<Employee>> {
  const res = await apiFetch<unknown>(endpoints.organization.employees, {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 15,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  const items = listFrom(res).map(mapEmployee);
  if (params?.page) {
    // Table mode: return all (active + inactive) with pagination
    return { items, total: totalFrom(res) || items.length };
  }
  // Dropdown mode: filter to active only unless caller opts out
  if (!params?.includeInactive) {
    return items.filter((e) => e.active !== false);
  }
  return items;
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const fd = buildEmployeeFormData(input);
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.organization.employeeCreate,
    { method: "POST", body: fd }
  );
  return mapEmployee((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<Employee> {
  const fd = buildEmployeeFormData({ name: "", email: "", ...input, id });
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.organization.employeeUpdate,
    { method: "POST", body: fd }
  );
  return mapEmployee((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiFetch(endpoints.organization.employeeDelete, {
    method: "POST",
    body: { id },
  });
}
