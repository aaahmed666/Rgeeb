/**
 * My Tasks service – wraps /customer/tasks/my-tasks and /customer/tasks/stats.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface MyTaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export interface MyTaskItem {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  status: "pending" | "assigned" | "in_progress" | "pending_review" | "completed" | "cancelled" | string;
  assignedTo: string;
  branch: string;
  cameraName?: string;
  serviceName?: string;
  dueDate: string;
  detectedAt?: string;
  image?: string;
  overdue?: boolean;
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown> | null;
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data as unknown[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.data)) return d.data as unknown[];
  if (d && Array.isArray(d.tasks)) return d.tasks as unknown[];
  if (Array.isArray((r as Record<string, unknown>).tasks)) return (r as { tasks: unknown[] }).tasks;
  return [];
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function mapTask(x: unknown, i: number): MyTaskItem {
  const r = (x ?? {}) as Record<string, unknown>;
  const assigned = (r.assigned_to ?? r.assignee ?? r.user) as
    | Record<string, unknown>
    | string
    | null
    | undefined;
  const branch = (r.branch ?? {}) as Record<string, unknown>;
  const camera = (r.camera ?? {}) as Record<string, unknown>;
  const service = (r.service ?? {}) as Record<string, unknown>;
  const assignedName =
    typeof assigned === "string"
      ? assigned
      : assigned
        ? String(
            assigned.name ??
              [assigned.first_name, assigned.last_name].filter(Boolean).join(" ") ??
              "—",
          )
        : "—";
  return {
    id: String(r.id ?? i),
    title: String(r.title ?? r.name ?? `Task ${i + 1}`),
    description: String(r.description ?? ""),
    type: String(r.type ?? r.category ?? "task"),
    priority: String(r.priority ?? "medium"),
    status: String(r.status ?? "pending"),
    assignedTo: assignedName,
    branch: String(branch?.name ?? r.branch_name ?? "—"),
    cameraName: String(camera?.name ?? r.camera_name ?? ""),
    serviceName: String(service?.name ?? r.service_name ?? ""),
    dueDate: String(r.due_date ?? r.deadline ?? r.due_at ?? ""),
    detectedAt: String(r.detected_at ?? r.created_at ?? ""),
    image: (r.image_url as string) ?? (r.image as string) ?? (r.thumbnail as string) ?? undefined,
    overdue: Boolean(r.overdue ?? r.is_overdue ?? false),
  };
}

export const myTasksService = {
  list: (params: { status?: string; page?: number; perPage?: number } = {}) =>
    safe(
      (async () => {
        const raw = await api.get<Record<string, unknown>>(endpoints.myTasks.list, {
          query: {
            status: params.status,
            page: params.page ?? 1,
            per_page: params.perPage ?? 50,
          },
        });
        return unwrapList(raw).map(mapTask);
      })(),
      [] as MyTaskItem[],
    ),

  stats: () =>
    safe(
      (async () => {
        const raw = await api.get<Record<string, unknown>>(endpoints.myTasks.stats);
        const r = (raw?.data as Record<string, unknown>) ?? raw ?? {};
        const total = num(r.total ?? r.total_tasks);
        const completed = num(r.completed);
        return {
          total,
          pending: num(r.pending),
          inProgress: num(r.in_progress ?? r.inProgress),
          completed,
          overdue: num(r.overdue),
          completionRate: num(
            r.completion_rate ?? r.completionRate ?? (total ? (completed / total) * 100 : 0),
          ),
        } satisfies MyTaskStats;
      })(),
      {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0,
      } satisfies MyTaskStats,
    ),

  start: (id: string) =>
    api
      .post<unknown>(endpoints.myTasks.start(id), {})
      .catch(() => api.patch<unknown>(endpoints.myTasks.status(id), { status: "in_progress" }))
      .catch(() => null),

  complete: (id: string) =>
    api
      .post<unknown>(endpoints.myTasks.complete(id), {})
      .catch(() => api.patch<unknown>(endpoints.myTasks.status(id), { status: "completed" }))
      .catch(() => null),

  updateStatus: (id: string, status: string) =>
    api.patch<unknown>(endpoints.myTasks.status(id), { status }).catch(() => null),
};
