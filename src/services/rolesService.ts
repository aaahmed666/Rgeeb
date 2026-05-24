import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

function s(v: unknown): string | undefined {
  return typeof v === "string" && v
    ? v
    : typeof v === "number"
      ? String(v)
      : undefined;
}
function listFrom(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  const d = (res as { data?: unknown })?.data;
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  // Handle object-keyed responses: { "0": {...}, "1": {...}, ... }
  if (
    d !== null &&
    d !== undefined &&
    typeof d === "object" &&
    !Array.isArray(d)
  ) {
    return Object.values(d) as Record<string, unknown>[];
  }
  const nested = (d as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  return [];
}

export interface Role {
  id: string;
  name: string;
  guard?: string;
  permissionsCount: number;
  resourcesCount: number;
  resources: string[];
  permissions: string[];
  permissionIds: string[];
  permissionNames: string[]; // permission names for matching when ids are absent
  required?: boolean;
  createdAt?: string;
}

export interface Permission {
  id: string; // numeric id as string — used for permission_ids payload
  name: string;
  resource: string;
  action?: string;
}

function mapPermission(r: Record<string, unknown>): Permission {
  const name = s(r.name) ?? "";
  // Split only on "." so that "task_analytics.slaMetrics" → resource="task_analytics", action="slaMetrics"
  // and "branches.create" → resource="branches", action="create"
  const dotIdx = name.indexOf(".");
  const resource =
    s(r.resource) ??
    s(r.group) ??
    (dotIdx > 0 ? name.slice(0, dotIdx) : name) ??
    "general";
  const action =
    s(r.action) ?? (dotIdx > 0 ? name.slice(dotIdx + 1) : undefined);
  return {
    id: String(r.id ?? name),
    name,
    resource,
    action,
  };
}

function mapRole(r: Record<string, unknown>): Role {
  const perms = Array.isArray(r.permissions)
    ? (r.permissions as unknown[])
    : [];
  const names = perms
    .map((p) =>
      typeof p === "string"
        ? p
        : (s((p as Record<string, unknown>)?.name) ?? "")
    )
    .filter(Boolean);
  // Collect numeric ids for permission_ids payloads
  const permissionIds = perms
    .map((p) =>
      typeof p === "object" && p !== null
        ? String((p as Record<string, unknown>).id ?? "")
        : ""
    )
    .filter(Boolean);
  const resources = Array.from(
    new Set(
      names.map((n) => {
        const i = n.indexOf(".");
        return i > 0 ? n.slice(0, i) : n;
      })
    )
  );
  return {
    id: String(r.id ?? ""),
    name: s(r.name) ?? "",
    guard: s(r.guard_name) ?? s(r.guard),
    permissionsCount:
      Number(r.permissions_count ?? names.length) || names.length,
    resourcesCount: resources.length,
    resources,
    permissions: names,
    permissionIds,
    permissionNames: names,
    required: Boolean(r.required ?? r.is_required ?? false),
    createdAt: s(r.created_at),
  };
}

/**
 * Fetches roles. Supports pagination params for programmatic use.
 * For SELECT DROPDOWNS use: <AsyncPaginatedSelect endpoint="/customer/roles" />
 */
export async function fetchRoles(params?: {
  page?: number;
  per_page?: number;
  keyword?: string;
}): Promise<Role[]> {
  const res = await apiFetch<unknown>(endpoints.roles.list, {
    query: params?.page
      ? {
          page: params.page,
          per_page: params.per_page ?? 20,
          ...(params.keyword ? { keyword: params.keyword } : {}),
        }
      : { all: 1 },
  });
  return listFrom(res).map(mapRole);
}

export async function fetchAllPermissions(): Promise<Permission[]> {
  const res = await apiFetch<unknown>(endpoints.roles.permissions);
  return listFrom(res).map(mapPermission);
}

// POST /customer/roles/create  { name, permission_ids[0]=31, permission_ids[1]=32, ... }
export async function createRole(input: {
  name: string;
  permission_ids: string[];
}): Promise<Role> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.roles.create, {
    method: "POST",
    body: input,
  });
  return mapRole((res?.data as Record<string, unknown>) ?? res ?? {});
}

// POST /customer/roles/update  { id, name, permission_ids[0]=33, ... }
export async function updateRole(
  id: string,
  input: { name?: string; permission_ids?: string[] }
): Promise<Role> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.roles.update, {
    method: "POST",
    body: { id, ...input },
  });
  return mapRole((res?.data as Record<string, unknown>) ?? res ?? {});
}

// POST /customer/roles/delete  { id }
export async function deleteRole(id: string): Promise<void> {
  await apiFetch(endpoints.roles.delete, {
    method: "POST",
    body: { id },
  });
}
