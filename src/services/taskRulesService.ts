import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export type RulePriority = "low" | "medium" | "high" | "critical";
export type RuleTaskType = "ai_generated" | "violation_response" | "manual" | string;

export interface AiService {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
}

export interface TaskRule {
  id: string;
  enabled: boolean;
  serviceId: string;
  serviceName: string;
  taskType: RuleTaskType;
  priority: RulePriority;
  slaMinutes: number;
  dedupMinutes: number;
  autoAssign: boolean;
  assigneeId?: string;
}

export interface TaskRuleStats {
  totalProcessed: number;
  tasksCreated: number;
  deduplicated: number;
  dedupRate: number; // 0-100
}

export interface TaskRuleInput {
  service_id: string;
  enabled: boolean;
  task_type: RuleTaskType;
  priority: RulePriority;
  sla_minutes: number;
  dedup_minutes: number;
  auto_assign: boolean;
  assignee_id?: string;
}

function s(v: unknown) {
  return typeof v === "string" && v ? v : undefined;
}
function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function b(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["1", "true", "yes"].includes(v.toLowerCase());
  return false;
}

export async function fetchAiServices(): Promise<AiService[]> {
  // /customer/ai-services does not exist in backend — use /customer/services instead
  const res = await apiFetch<unknown>(endpoints.services.list);
  const arr =
    (res as { data?: unknown[] })?.data ??
    (Array.isArray(res) ? (res as unknown[]) : []);
  return (arr as Record<string, unknown>[]).map((x) => ({
    id: String(x.id ?? x.slug ?? ""),
    name: s(x.name) ?? s(x.title) ?? s(x.label) ?? String(x.id ?? ""),
    slug: s(x.slug),
    icon: s(x.icon),
  }));
}

function mapRule(raw: Record<string, unknown>): TaskRule {
  const svc = (raw.service ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ""),
    enabled: b(raw.enabled ?? raw.is_enabled ?? true),
    serviceId: String(raw.service_id ?? svc.id ?? ""),
    serviceName: s(svc.name) ?? s(raw.service_name) ?? s(raw.service) ?? "—",
    taskType: (s(raw.task_type) ?? "ai_generated") as RuleTaskType,
    priority: (s(raw.priority) ?? "medium").toLowerCase() as RulePriority,
    slaMinutes: n(raw.sla_minutes ?? raw.sla),
    dedupMinutes: n(raw.dedup_minutes ?? raw.dedup),
    autoAssign: b(raw.auto_assign),
    assigneeId: s(raw.assignee_id),
  };
}

export async function fetchTaskRules(): Promise<TaskRule[]> {
  const res = await apiFetch<unknown>(endpoints.taskRules.list);
  const arr =
    (res as { data?: unknown[] })?.data ??
    (Array.isArray(res) ? (res as unknown[]) : []);
  return (arr as Record<string, unknown>[]).map(mapRule);
}

export async function fetchTaskRuleStats(): Promise<TaskRuleStats> {
  try {
    // /customer/task-rules/stats does not exist — derive stats from the rules list
    const res = await apiFetch<Record<string, unknown>>(endpoints.taskRules.list);
    const data = (res?.data as Record<string, unknown>) ?? res ?? {};
    // If backend returns stats directly, use them; otherwise compute from list
    if ("total_processed" in data || "totalProcessed" in data) {
      const total = n(data.total_processed ?? data.totalProcessed);
      const dedup = n(data.deduplicated);
      return {
        totalProcessed: total,
        tasksCreated: n(data.tasks_created ?? data.tasksCreated),
        deduplicated: dedup,
        dedupRate: n(data.dedup_rate ?? data.dedupRate ?? (total > 0 ? (dedup / total) * 100 : 0)),
      };
    }
    // Derive from rules list
    const arr = Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);
    const total = (arr as unknown[]).length;
    return {
      totalProcessed: total,
      tasksCreated: total,
      deduplicated: 0,
      dedupRate: 0,
    };
  } catch {
    return { totalProcessed: 0, tasksCreated: 0, deduplicated: 0, dedupRate: 0 };
  }
}

export async function createTaskRule(input: TaskRuleInput): Promise<TaskRule> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.taskRules.save, {
    method: "POST",
    body: input,
  });
  return mapRule((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateTaskRule(
  id: string,
  input: Partial<TaskRuleInput>,
): Promise<TaskRule> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.taskRules.save, {
    method: "POST",
    body: { id, ...input },
  });
  return mapRule((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function deleteTaskRule(id: string): Promise<void> {
  try {
    await apiFetch(endpoints.taskRules.delete(id), { method: "POST", body: { id } });
  } catch {
    // OLD production contract fallback: POST /customer/task-rules/delete { id }
    await apiFetch(endpoints.taskRules.legacyDelete, { method: "POST", body: { id } });
  }
}

/** Deduplication statistics — present in OLD production (task rules page). */
export async function getTaskRuleDedupStats(): Promise<Record<string, unknown> | null> {
  try {
    return await apiFetch<Record<string, unknown>>(endpoints.taskRules.dedupStats);
  } catch {
    return null;
  }
}
