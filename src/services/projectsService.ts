/**
 * projectsService.ts — wraps /customer/projects endpoints.
 *
 * Postman fields (create/update):
 *   name, start_date, end_date, manager_id, branch_ids[], id (update only)
 *
 * FIX: ProjectInput now includes manager_id and branch_ids[].
 * FIX: create/update use FormData to support branch_ids[].
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
  branchIds?: string[];
  managerId?: string;
  managerName?: string;
  startDate?: string;
  endDate?: string;
  tasksCount?: number;
  completedTasksCount?: number;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  /** Postman: manager_id */
  manager_id?: string;
  /** Postman: branch_ids[] */
  branch_ids?: string[];
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapProject(r: RawObject): Project {
  const branch  = r.branch  as RawObject | undefined;
  const manager = r.manager as RawObject | undefined;
  const total   = Number(r.tasks_count ?? (Array.isArray(r.tasks) ? (r.tasks as unknown[]).length : 0));
  const done    = Number(r.completed_tasks_count ?? r.completed_tasks ?? 0);
  const progress = total > 0 ? Math.round((done / total) * 100) : Number(r.progress ?? 0);

  // branch_ids from nested branches array
  const rawBranches = Array.isArray(r.branches) ? (r.branches as RawObject[]) : [];
  const branchIds = rawBranches.map((b) => String(b.id ?? "")).filter(Boolean);

  return {
    id:                   String(r.id ?? ""),
    name:                 str(r, "name", "title") ?? "Project",
    description:          str(r, "description"),
    status:               (str(r, "status") ?? "pending") as ProjectStatus,
    branchId:             str(r, "branch_id") ?? (branch && str(branch, "id")),
    branchName:           (branch && str(branch, "name")) ?? str(r, "branch_name"),
    branchIds:            branchIds.length ? branchIds : undefined,
    managerId:            str(r, "manager_id") ?? (manager && str(manager, "id")),
    managerName:          (manager && (str(manager, "name") ?? str(manager, "name_en"))) ?? str(r, "manager_name"),
    startDate:            str(r, "start_date"),
    endDate:              str(r, "end_date", "due_date"),
    tasksCount:           total || undefined,
    completedTasksCount:  done  || undefined,
    progress,
    createdAt:            str(r, "created_at"),
    updatedAt:            str(r, "updated_at"),
  };
}

// ─── FormData builder ─────────────────────────────────────────────────────────

function buildProjectFormData(
  input: ProjectInput & { id?: string }
): FormData {
  const fd = new FormData();
  if (input.id)          fd.append("id",          input.id);
  fd.append("name", input.name ?? "");
  if (input.description) fd.append("description", input.description);
  if (input.start_date)  fd.append("start_date",  input.start_date);
  if (input.end_date)    fd.append("end_date",     input.end_date);
  if (input.status)      fd.append("status",       input.status);
  if (input.manager_id)  fd.append("manager_id",   input.manager_id);
  // branch_ids[] — Postman uses array notation
  (input.branch_ids ?? []).forEach((bid) => fd.append("branch_ids[]", bid));
  return fd;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const raw = await api.get<unknown>(endpoints.projects.list);
  return pickArray(raw).map(mapProject);
}

export async function fetchProjectById(projectId: string): Promise<Project> {
  const raw = await api.get<unknown>(endpoints.projects.single, {
    query: { id: projectId },
  });
  return mapProject(pickObject(raw));
}

/** POST /customer/projects/create — FormData with branch_ids[] */
export async function createProject(input: ProjectInput): Promise<Project> {
  const raw = await api.post<unknown>(
    endpoints.projects.create,
    buildProjectFormData(input)
  );
  return mapProject(pickObject(raw));
}

/** POST /customer/projects/update — FormData with id + branch_ids[] */
export async function updateProject(
  projectId: string,
  input: Partial<ProjectInput>
): Promise<Project> {
  const raw = await api.post<unknown>(
    endpoints.projects.update,
    buildProjectFormData({ name: "", ...input, id: projectId })
  );
  return mapProject(pickObject(raw));
}

/** POST /customer/projects/cancel { id } */
export async function cancelProject(projectId: string): Promise<void> {
  await api.post(endpoints.projects.cancel, { id: projectId });
}

/**
 * POST /customer/projects/delete?id=1 { id }
 * Postman shows both query param and body id.
 */
export async function deleteProject(projectId: string): Promise<void> {
  await api.post(`${endpoints.projects.delete}?id=${projectId}`, {
    id: projectId,
  });
}
