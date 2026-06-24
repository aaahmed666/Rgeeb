import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type TaskTemplateCategory =
  | "operations"
  | "inventory"
  | "cleaning"
  | "maintenance"
  | "quality"
  | "other";

export type TaskTemplatePriority = "low" | "medium" | "high" | "critical";

export interface TaskTemplate {
  id: string;
  nameEn: string;
  nameAr?: string;
  description?: string;
  category: TaskTemplateCategory;
  priority: TaskTemplatePriority;
  estimatedHours: number;
  titleTemplate: string;
  usedCount: number;
  icon?: string;
}

export interface TaskTemplateInput {
  name_en: string;
  name_ar?: string;
  description?: string;
  category: TaskTemplateCategory;
  priority: TaskTemplatePriority;
  estimated_hours: number;
  title_template: string;
}

function s(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}
function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function mapTemplate(raw: Record<string, unknown>): TaskTemplate {
  const cat = (s(raw.category) ?? "other").toLowerCase() as TaskTemplateCategory;
  const pri = (s(raw.priority) ?? "medium").toLowerCase() as TaskTemplatePriority;
  return {
    id: String(raw.id ?? ""),
    nameEn: s(raw.name_en) ?? s(raw.name) ?? "",
    nameAr: s(raw.name_ar),
    description: s(raw.description),
    category: cat,
    priority: pri,
    estimatedHours: n(raw.estimated_hours ?? raw.estimatedHours),
    titleTemplate: s(raw.title_template) ?? s(raw.titleTemplate) ?? "",
    usedCount: n(raw.used_count ?? raw.usage_count ?? raw.times_used),
    icon: s(raw.icon),
  };
}

export async function fetchTaskTemplates(): Promise<TaskTemplate[]> {
  const res = await apiFetch<unknown>(endpoints.taskTemplates.list);
  const arr =
    (res as { data?: unknown[] })?.data ??
    (Array.isArray(res) ? (res as unknown[]) : []);
  return (arr as Record<string, unknown>[]).map(mapTemplate);
}

export async function createTaskTemplate(input: TaskTemplateInput): Promise<TaskTemplate> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.taskTemplates.list, {
    method: "POST",
    body: input,
  });
  return mapTemplate((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteTaskTemplate(id: string): Promise<void> {
  await apiFetch(endpoints.taskTemplates.delete(id), { method: "DELETE" });
}

/**
 * Create a task from a template.
 *
 * Mirrors the OLD project's working contract:
 *   POST /customer/task-templates/create-task
 *   body: { template_id, variables }
 *
 * (The previous `/customer/task-templates/{id}/use` endpoint with a
 * { branch_id, customer_name } body did not match the backend.)
 */
export async function useTemplate(
  id: string,
  variables: Record<string, string> = {},
): Promise<{ taskId?: string }> {
  const res = await apiFetch<Record<string, unknown>>(
    endpoints.taskTemplates.createTask,
    { method: "POST", body: { template_id: id, variables } },
  );
  const data = (res?.data as Record<string, unknown>) ?? res ?? {};
  return { taskId: s(data.id) ?? s(data.task_id) };
}
