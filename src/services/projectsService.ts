/**
 * Projects service — wraps /customer/projects endpoints.
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

export type ProjectStatus = "active" | "pending" | "completed" | "cancelled" | string;

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  branchId?: string;
  branchName?: string;
  startDate?: string;
  endDate?: string;
  tasksCount?: number;
  completedTasksCount?: number;
  progress?: number; // 0-100
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
  branch_id?: string;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
}

function mapProject(r: Record<string, unknown>): Project {
  const total = Number(r.tasks_count ?? (Array.isArray(r.tasks) ? (r.tasks as unknown[]).length : 0));
  const done = Number(r.completed_tasks_count ?? r.completed_tasks ?? 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : Number(r.progress ?? 0);
  return {
    id: String(r.id ?? ""),
    name: s(r.name) ?? s(r.title) ?? "Project",
    description: s(r.description),
    status: (s(r.status) ?? "pending") as ProjectStatus,
    branchId: s(r.branch_id) ?? s((r.branch as any)?.id),
    branchName: s((r.branch as any)?.name) ?? s(r.branch_name),
    startDate: s(r.start_date),
    endDate: s(r.end_date ?? r.due_date),
    tasksCount: total || undefined,
    completedTasksCount: done || undefined,
    progress,
    createdAt: s(r.created_at),
    updatedAt: s(r.updated_at),
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const raw = await api.get<unknown>(endpoints.projects.list);
  return listFrom(raw).map(mapProject);
}

export async function fetchProjectById(id: string): Promise<Project> {
  const raw = await api.get<unknown>(endpoints.projects.single, { query: { id } });
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapProject(r);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const raw = await api.post<unknown>(endpoints.projects.create, input);
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapProject(r);
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<Project> {
  const raw = await api.post<unknown>(endpoints.projects.update, { id, ...input });
  const r = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  return mapProject(r);
}

export async function cancelProject(id: string): Promise<void> {
  await api.post(endpoints.projects.cancel, { id });
}

export async function deleteProject(id: string): Promise<void> {
  await api.post(`${endpoints.projects.delete}?id=${id}`);
}
