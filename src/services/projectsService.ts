/**
 * Projects service — wraps /customer/projects endpoints.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, pickObject, str, num, type RawObject } from "@/lib/raw-response";

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

function mapProject(r: RawObject): Project {
  const branch = r.branch as RawObject | undefined;
  const total = Number(
    r.tasks_count ?? (Array.isArray(r.tasks) ? (r.tasks as unknown[]).length : 0),
  );
  const done = Number(r.completed_tasks_count ?? r.completed_tasks ?? 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : Number(r.progress ?? 0);
  return {
    id: String(r.id ?? ""),
    name: str(r, "name", "title") ?? "Project",
    description: str(r, "description"),
    status: (str(r, "status") ?? "pending") as ProjectStatus,
    branchId: str(r, "branch_id") ?? (branch && str(branch, "id")),
    branchName: (branch && str(branch, "name")) ?? str(r, "branch_name"),
    startDate: str(r, "start_date"),
    endDate: str(r, "end_date", "due_date"),
    tasksCount: total || undefined,
    completedTasksCount: done || undefined,
    progress,
    createdAt: str(r, "created_at"),
    updatedAt: str(r, "updated_at"),
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const raw = await api.get<unknown>(endpoints.projects.list);
  return pickArray(raw).map(mapProject);
}

export async function fetchProjectById(projectId: string): Promise<Project> {
  const raw = await api.get<unknown>(endpoints.projects.single, { query: { id: projectId } });
  return mapProject(pickObject(raw));
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const raw = await api.post<unknown>(endpoints.projects.create, input);
  return mapProject(pickObject(raw));
}

export async function updateProject(
  projectId: string,
  input: Partial<ProjectInput>,
): Promise<Project> {
  const raw = await api.post<unknown>(endpoints.projects.update, { id: projectId, ...input });
  return mapProject(pickObject(raw));
}

export async function cancelProject(projectId: string): Promise<void> {
  await api.post(endpoints.projects.cancel, { id: projectId });
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.post(`${endpoints.projects.delete}?id=${projectId}`);
}
