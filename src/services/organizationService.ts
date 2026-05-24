import { apiFetch } from "@/lib/api";

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

/* ================ Branches ================ */
export interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  phone?: string;
  address?: string;
  camerasCount: number;
  active: boolean;
}

export interface BranchInput {
  name: string;
  name_ar?: string;
  phone?: string;
  address?: string;
  active?: boolean;
  /** Municipality permit fields */
  permit_number?: string;
  permit_activity_type?: string;
  permit_end_date?: string;
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
  };
}

/**
 * Fetches branches. Supports pagination params for programmatic use.
 * For SELECT DROPDOWNS use: <AsyncPaginatedSelect endpoint="/customer/branches" />
 */
export async function fetchBranches(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
}): Promise<Branch[]> {
  const res = await apiFetch<unknown>("/customer/branches", {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 20,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  return listFrom(res).map(mapBranch);
}

export async function createBranch(input: BranchInput): Promise<Branch> {
  const res = await apiFetch<Record<string, unknown>>(
    "/customer/branches/create",
    {
      method: "POST",
      body: input,
    }
  );
  return mapBranch((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateBranch(
  id: string,
  input: Partial<BranchInput>
): Promise<Branch> {
  const res = await apiFetch<Record<string, unknown>>(
    "/customer/branches/update",
    {
      method: "POST",
      body: { id, ...input },
    }
  );
  return mapBranch((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteBranch(id: string): Promise<void> {
  await apiFetch("/customer/branches/delete", { method: "POST", body: { id } });
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
 * Fetches departments. Supports pagination params for programmatic use.
 * For SELECT DROPDOWNS use: <AsyncPaginatedSelect endpoint="/customer/departments" />
 */
export async function fetchDepartments(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
}): Promise<Department[]> {
  const res = await apiFetch<unknown>("/customer/departments", {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 20,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  return listFrom(res).map(mapDepartment);
}

export async function createDepartment(
  input: DepartmentInput
): Promise<Department> {
  const res = await apiFetch<Record<string, unknown>>(
    "/customer/departments/create",
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
    "/customer/departments/update",
    {
      method: "POST",
      body: { id, ...input },
    }
  );
  return mapDepartment((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch("/customer/departments/delete", {
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

export interface EmployeeInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  branch_id?: string;
  department_id?: string;
  role_id?: string;
  active?: boolean;
  is_main_admin?: boolean;
  name_ar?: string;
  national_id?: string;
  employee_code?: string;
  certificate_number?: string;
  certificate_end_date?: string;
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
 * Fetches employees. Supports pagination params for programmatic use.
 * For SELECT DROPDOWNS use: <AsyncPaginatedSelect endpoint="/customer/employees" />
 */
export async function fetchEmployees(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
}): Promise<Employee[]> {
  const res = await apiFetch<unknown>("/customer/employees", {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 20,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  return listFrom(res).map(mapEmployee);
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const res = await apiFetch<Record<string, unknown>>(
    "/customer/employees/create",
    {
      method: "POST",
      body: input,
    }
  );
  return mapEmployee((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<Employee> {
  const res = await apiFetch<Record<string, unknown>>(
    "/customer/employees/update",
    {
      method: "POST",
      body: { id, ...input },
    }
  );
  return mapEmployee((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiFetch("/customer/employees/delete", {
    method: "POST",
    body: { id },
  });
}
