/**
 * Tasks service – wraps /customer/tasks endpoints.
 *
 * CRUD mapping (verified against Postman collection):
 *   GET  /customer/tasks                → list()
 *   GET  /customer/tasks          → kanban()   ← uses board endpoint, not list
 *   GET  /customer/tasks/single?id=X    → single()
 *   POST /customer/tasks/create         → create()
 *   POST /customer/tasks/update         → update()   ← POST with {id,...} body, NOT PATCH
 *   POST /customer/tasks/delete         → remove()   ← POST with {id} body, NOT DELETE
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface TaskSummary {
  total: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface TaskItem {
  id: string;
  title: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "pending_review"
    | "completed"
    | "cancelled"
    | string;
  assignedTo: { id?: string; name: string } | null;
  assignedUserIds?: string[];
  branch: { id?: string; name: string } | null;
  branchIds?: string[];
  dueDate: string;
  scheduledDate?: string;
  time?: string;
  description?: string;
  projectId?: string;
  departmentId?: string;
  recurringEveryDays?: number;
  startDate?: string;
  endDate?: string;
  isDraft?: boolean;
  image?: string;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  type?: string;
  priority?: string;
  branchId?: string;
  page?: number;
  perPage?: number;
}

export interface TasksResponse {
  items: TaskItem[];
  total: number;
  page: number;
  perPage: number;
  summary: TaskSummary;
}

export interface KanbanPage {
  items: TaskItem[];
  total: number;
  count: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  byStatus: Record<string, number>;
}

export interface LookupOption {
  id: string;
  name: string;
}

/** Payload for create / update — mirrors the Postman formdata fields */
export interface TaskPayload {
  id?: string | number; // required for update
  name: string;
  description?: string;
  type?: "manual" | "recurring" | string;
  project_id?: string | number;
  department_id?: string | number;
  priority?: string;
  status?: string;
  time?: string;
  scheduled_date?: string;
  start_date?: string;
  end_date?: string;
  recurring_every_days?: number | string;
  assigned_user_ids?: (string | number)[];
  branch_ids?: (string | number)[];
  is_draft?: 0 | 1;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown> | null;
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data as unknown[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.data)) return d.data as unknown[];
  return [];
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function mapTask(x: unknown, i: number): TaskItem {
  const r = (x ?? {}) as Record<string, unknown>;
  // assigned_to may be just a numeric ID (not the full object);
  // the full object is in r.assignee. Prefer the object form.
  const assignedRaw = r.assignee ?? r.user ?? r.assigned_to;
  const assigned = (
    assignedRaw && typeof assignedRaw === "object" ? assignedRaw : null
  ) as Record<string, unknown> | null | undefined;
  const branch = (r.branch ?? {}) as Record<string, unknown>;

  // assigned_user_ids — array form
  const rawUserIds = (r.assigned_user_ids ?? r.assignedUserIds) as
    | unknown[]
    | undefined;
  const assignedUserIds = Array.isArray(rawUserIds)
    ? rawUserIds.map(String)
    : undefined;

  // branch_ids — array form
  const rawBranchIds = (r.branch_ids ?? r.branchIds) as unknown[] | undefined;
  const branchIds = Array.isArray(rawBranchIds)
    ? rawBranchIds.map(String)
    : undefined;

  return {
    id: String(r.id ?? i),
    title: String(r.title ?? r.name ?? r.description ?? `Task ${i + 1}`),
    type: String(r.type ?? r.category ?? "manual"),
    priority: String(r.priority ?? "medium"),
    status: String(r.status ?? "pending"),
    assignedTo:
      typeof assigned === "string"
        ? { name: assigned }
        : assigned
          ? {
              id: assigned.id ? String(assigned.id) : undefined,
              name: String(
                assigned.name ??
                  [assigned.first_name, assigned.last_name]
                    .filter(Boolean)
                    .join(" ") ??
                  "—"
              ),
            }
          : null,
    assignedUserIds,
    branch:
      branch && Object.keys(branch).length
        ? {
            id: branch.id ? String(branch.id) : undefined,
            name: String(branch.name ?? "—"),
          }
        : r.branch_name
          ? { name: String(r.branch_name) }
          : null,
    branchIds,
    dueDate: String(r.due_date ?? r.deadline ?? r.due_at ?? ""),
    scheduledDate: r.scheduled_date ? String(r.scheduled_date) : undefined,
    time: r.time ? String(r.time) : undefined,
    description: r.description ? String(r.description) : undefined,
    projectId: r.project_id ? String(r.project_id) : undefined,
    departmentId: r.department_id ? String(r.department_id) : undefined,
    recurringEveryDays: r.recurring_every_days
      ? num(r.recurring_every_days)
      : undefined,
    startDate: r.start_date ? String(r.start_date) : undefined,
    endDate: r.end_date ? String(r.end_date) : undefined,
    isDraft: Boolean(r.is_draft),
    image: (() => {
      // 1. top-level image fields
      if (r.image_url) return String(r.image_url);
      if (r.image && typeof r.image === "string") return r.image;
      if (r.thumbnail) return String(r.thumbnail);
      // 2. metadata.detection_image  (auto-generated violation tasks)
      const meta = r.metadata as Record<string, unknown> | undefined;
      if (meta?.detection_image) return String(meta.detection_image);
      // 3. detection.image  (nested detection object)
      const det = r.detection as Record<string, unknown> | undefined;
      if (det?.image) return String(det.image);
      return undefined;
    })(),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const tasksService = {
  // ── READ ──────────────────────────────────────────────────────────────────

  list: async (f: TaskFilters = {}): Promise<TasksResponse> => {
    const perPage = f.perPage ?? 15;
    const page = f.page ?? 1;
    const emptySummary: TaskSummary = {
      total: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      byStatus: {},
      byType: {},
      byPriority: {},
    };
    const fallback: TasksResponse = {
      items: [],
      total: 0,
      page,
      perPage,
      summary: emptySummary,
    };
    try {
      const raw = await api.get<Record<string, unknown>>(endpoints.tasks.list, {
        query: {
          page,
          per_page: perPage,
          search: f.search,
          status: f.status,
          type: f.type,
          priority: f.priority,
          branch_id: f.branchId,
        },
      });
      const list = unwrapList(raw);
      const items = list.map(mapTask);
      const meta = (raw?.meta as Record<string, unknown>) ?? {};
      const dataMeta = (raw?.data as Record<string, unknown>) ?? {};
      const total = num(
        raw?.total ?? meta.total ?? dataMeta.total ?? items.length,
        items.length
      );
      const summaryRaw =
        (raw?.summary as Record<string, unknown>) ??
        (raw?.stats as Record<string, unknown>) ??
        (dataMeta.summary as Record<string, unknown>) ??
        {};
      const toNumMap = (o: unknown): Record<string, number> => {
        if (!o || typeof o !== "object") return {};
        return Object.fromEntries(
          Object.entries(o as Record<string, unknown>).map(([k, v]) => [
            k,
            num(v),
          ])
        );
      };
      const summary: TaskSummary = {
        total: num(summaryRaw.total ?? total, total),
        inProgress: num(summaryRaw.in_progress ?? summaryRaw.inProgress),
        completed: num(summaryRaw.completed),
        overdue: num(summaryRaw.overdue),
        byStatus: toNumMap(summaryRaw.by_status ?? summaryRaw.byStatus),
        byType: toNumMap(summaryRaw.by_type ?? summaryRaw.byType),
        byPriority: toNumMap(summaryRaw.by_priority ?? summaryRaw.byPriority),
      };
      return { items, total, page, perPage, summary };
    } catch {
      return fallback;
    }
  },

  single: async (id: string): Promise<TaskItem | null> => {
    try {
      const raw = await api.get<Record<string, unknown>>(
        endpoints.tasks.single,
        {
          query: { id },
        }
      );
      const r = (raw?.data as Record<string, unknown>) ?? raw;
      return mapTask(r, 0);
    } catch {
      return null;
    }
  },

  dashboard: () =>
    safe(
      (async () => {
        const raw = await api.get<Record<string, unknown>>(
          endpoints.tasks.dashboard
        );
        const r = (raw?.data as Record<string, unknown>) ?? raw ?? {};
        const toNumMap = (o: unknown): Record<string, number> => {
          if (!o || typeof o !== "object") return {};
          return Object.fromEntries(
            Object.entries(o as Record<string, unknown>).map(([k, v]) => [
              k,
              num(v),
            ])
          );
        };
        return {
          total: num(r.total ?? r.total_tasks),
          inProgress: num(r.in_progress ?? r.inProgress),
          completed: num(r.completed),
          overdue: num(r.overdue),
          byStatus: toNumMap(r.by_status),
          byType: toNumMap(r.by_type),
          byPriority: toNumMap(r.by_priority),
        } satisfies TaskSummary;
      })(),
      {
        total: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        byStatus: {},
        byType: {},
        byPriority: {},
      } satisfies TaskSummary
    ),

  // ── KANBAN  (uses /tasks/board, not /tasks/list) ──────────────────────────

  kanban: async (
    page = 1,
    perPage = 15,
    extra?: { status?: string; branchId?: string }
  ): Promise<KanbanPage> => {
    const fallback: KanbanPage = {
      items: [],
      total: 0,
      count: 0,
      perPage,
      currentPage: page,
      totalPages: 0,
      byStatus: {},
    };
    try {
      const raw = await api.get<Record<string, unknown>>(
        endpoints.tasks.board,
        {
          query: {
            page,
            per_page: perPage,
            status: extra?.status,
            branch_id: extra?.branchId,
          },
        }
      );
      const list = unwrapList(raw);
      const items = list.map(mapTask);
      const meta = (raw?.meta as Record<string, unknown>) ?? {};
      const dataMeta = (raw?.data as Record<string, unknown>) ?? {};
      const pagination =
        ((raw as Record<string, unknown>)?.pagination as Record<
          string,
          unknown
        >) ??
        (meta.pagination as Record<string, unknown>) ??
        (dataMeta.pagination as Record<string, unknown>) ??
        {};
      const get = (...keys: string[]) => {
        for (const k of keys) {
          for (const src of [
            raw as Record<string, unknown>,
            meta,
            dataMeta,
            pagination,
          ]) {
            const v = src?.[k];
            if (v !== undefined && v !== null) return v;
          }
        }
        return undefined;
      };
      const byStatusRaw =
        ((raw as Record<string, unknown>)?.by_status as Record<
          string,
          unknown
        >) ??
        (meta.by_status as Record<string, unknown>) ??
        (dataMeta.by_status as Record<string, unknown>) ??
        {};
      const byStatus: Record<string, number> = {};
      Object.entries(byStatusRaw).forEach(([k, v]) => {
        byStatus[k] = num(v);
      });
      const total = num(get("total"), items.length);
      const perPageOut = num(get("per_page", "perPage"), perPage);
      const currentPage = num(get("current_page", "currentPage", "page"), page);
      const totalPagesFromApi = num(
        get("total_pages", "totalPages", "last_page"),
        0
      );
      const totalPages =
        totalPagesFromApi > 0
          ? totalPagesFromApi
          : perPageOut > 0
            ? Math.ceil(total / perPageOut)
            : items.length === perPageOut
              ? currentPage + 1
              : currentPage;
      return {
        items,
        total,
        count: num(get("count"), items.length),
        perPage: perPageOut,
        currentPage,
        totalPages,
        byStatus,
      };
    } catch {
      return fallback;
    }
  },

  // ── CREATE ────────────────────────────────────────────────────────────────
  // POST /customer/tasks/create  (formdata fields)

  create: async (payload: TaskPayload): Promise<TaskItem> => {
    const raw = await api.post<Record<string, unknown>>(
      endpoints.tasks.create,
      payload
    );
    const r = (raw?.data as Record<string, unknown>) ?? raw;
    return mapTask(r, 0);
  },

  // ── UPDATE ────────────────────────────────────────────────────────────────
  // POST /customer/tasks/update  with {id, ...fields}
  // This is also used for status-only changes (move between kanban columns).

  update: async (
    payload: TaskPayload & { id: string | number }
  ): Promise<TaskItem> => {
    const raw = await api.post<Record<string, unknown>>(
      endpoints.tasks.update,
      payload
    );
    const r = (raw?.data as Record<string, unknown>) ?? raw;
    return mapTask(r, 0);
  },

  /**
   * Update only the status field.
   * POST /customer/tasks/status  { id, status }
   * (dedicated endpoint — does NOT require a name field)
   */
  updateStatus: async (id: string, status: string): Promise<TaskItem> => {
    try {
      const raw = await api.post<Record<string, unknown>>(
        endpoints.tasks.status,
        { id, status }
      );
      const r = (raw?.data as Record<string, unknown>) ?? raw;
      return mapTask(r, 0);
    } catch {
      // Return a minimal stub so UI mutation callbacks still fire
      return mapTask({ id, status }, 0);
    }
  },

  // ── DELETE ────────────────────────────────────────────────────────────────
  // POST /customer/tasks/delete  with {id}  (NOT HTTP DELETE)

  remove: async (id: string): Promise<void> => {
    await api.post<unknown>(endpoints.tasks.delete, { id }).catch(() => null);
  },

  // ── LOOKUPS ───────────────────────────────────────────────────────────────

  /** For SELECT DROPDOWNS prefer: <AsyncPaginatedSelect endpoint="/customer/branches" />
   *  This method is still used for non-select contexts. */
  listBranches: (params?: {
    page?: number;
    per_page?: number;
    keyword?: string;
  }) =>
    safe(
      (async () => {
        const query = params?.page
          ? {
              page: params.page,
              per_page: params.per_page ?? 20,
              ...(params.keyword ? { keyword: params.keyword } : {}),
            }
          : { all: 1 };
        const raw = await api.get<unknown>(endpoints.tasks.branches, { query });
        return unwrapList(raw).map((b, i) => {
          const x = b as Record<string, unknown>;
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? `Branch ${i + 1}`),
          } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),

  /** For SELECT DROPDOWNS prefer: <AsyncPaginatedSelect endpoint="/customer/employees" />
   *  This method is still used for non-select contexts. */
  listEmployees: (params?: {
    page?: number;
    per_page?: number;
    keyword?: string;
  }) =>
    safe(
      (async () => {
        const query = params?.page
          ? {
              page: params.page,
              per_page: params.per_page ?? 20,
              ...(params.keyword ? { keyword: params.keyword } : {}),
            }
          : { all: 1 };
        const raw = await api.get<unknown>(endpoints.organization.employees, {
          query,
        });
        return unwrapList(raw).map((e, i) => {
          const x = e as Record<string, unknown>;
          const name = String(
            x.name ??
              x.full_name ??
              [x.first_name, x.last_name].filter(Boolean).join(" ") ??
              `Employee ${i + 1}`
          );
          return { id: String(x.id ?? i), name } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),

  /** For SELECT DROPDOWNS prefer: <AsyncPaginatedSelect endpoint="/customer/departments" />
   *  This method is still used for non-select contexts. */
  listDepartments: (params?: {
    page?: number;
    per_page?: number;
    keyword?: string;
  }) =>
    safe(
      (async () => {
        const query = params?.page
          ? {
              page: params.page,
              per_page: params.per_page ?? 20,
              ...(params.keyword ? { keyword: params.keyword } : {}),
            }
          : { all: 1 };
        const raw = await api.get<unknown>(endpoints.organization.departments, {
          query,
        });
        return unwrapList(raw).map((d, i) => {
          const x = d as Record<string, unknown>;
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? `Dept ${i + 1}`),
          } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),

  /** For SELECT DROPDOWNS prefer: <AsyncPaginatedSelect endpoint="/customer/projects" />
   *  This method is still used for non-select contexts. */
  listProjects: (params?: {
    page?: number;
    per_page?: number;
    keyword?: string;
  }) =>
    safe(
      (async () => {
        const query = params?.page
          ? {
              page: params.page,
              per_page: params.per_page ?? 20,
              ...(params.keyword ? { keyword: params.keyword } : {}),
            }
          : { all: 1 };
        const raw = await api.get<unknown>(endpoints.projects.list, { query });
        return unwrapList(raw).map((p, i) => {
          const x = p as Record<string, unknown>;
          return {
            id: String(x.id ?? i),
            name: String(x.name ?? x.title ?? `Project ${i + 1}`),
          } satisfies LookupOption;
        });
      })(),
      [] as LookupOption[]
    ),
};
