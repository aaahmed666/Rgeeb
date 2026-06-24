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
  /** Preserved so toggling enabled doesn't wipe them on save (see toggleTaskRule). */
  titleTemplate?: string;
  descriptionTemplate?: string;
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
    // Backend exposes the service name as name_en / name_ar (see OLD project).
    serviceName:
      s(svc.name_en) ??
      s(svc.name_ar) ??
      s(svc.name) ??
      s(raw.service_name) ??
      s(raw.service) ??
      "—",
    taskType: (s(raw.task_type) ?? "ai_generated") as RuleTaskType,
    priority: (s(raw.priority) ?? "medium").toLowerCase() as RulePriority,
    // Backend field is response_minutes / dedup_window_minutes (NOT sla/dedup).
    slaMinutes: n(raw.response_minutes ?? raw.sla_minutes ?? raw.sla),
    dedupMinutes: n(raw.dedup_window_minutes ?? raw.dedup_minutes ?? raw.dedup),
    autoAssign: b(raw.auto_assign),
    assigneeId: s(raw.assignee_id),
    titleTemplate: s(raw.title_template),
    descriptionTemplate: s(raw.description_template),
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

/**
 * Translate the UI input shape to the backend /customer/task-rules/save body.
 * The save endpoint (Postman contract) expects response_minutes /
 * dedup_window_minutes — NOT sla_minutes / dedup_minutes.
 */
function toSaveBody(input: Partial<TaskRuleInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.service_id !== undefined) body.service_id = input.service_id;
  if (input.enabled !== undefined) body.enabled = input.enabled;
  if (input.task_type !== undefined) body.task_type = input.task_type;
  if (input.priority !== undefined) body.priority = input.priority;
  if (input.sla_minutes !== undefined) body.response_minutes = input.sla_minutes;
  if (input.dedup_minutes !== undefined)
    body.dedup_window_minutes = input.dedup_minutes;
  if (input.auto_assign !== undefined) body.auto_assign = input.auto_assign;
  if (input.assignee_id !== undefined) body.assignee_id = input.assignee_id;
  return body;
}

export async function createTaskRule(input: TaskRuleInput): Promise<TaskRule> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.taskRules.save, {
    method: "POST",
    body: toSaveBody(input),
  });
  return mapRule((res?.data as Record<string, unknown>) ?? res ?? {});
}

export async function updateTaskRule(
  id: string,
  input: Partial<TaskRuleInput>,
): Promise<TaskRule> {
  const res = await apiFetch<Record<string, unknown>>(endpoints.taskRules.save, {
    method: "POST",
    body: { id, ...toSaveBody(input) },
  });
  return mapRule((res?.data as Record<string, unknown>) ?? res ?? {});
}

/**
 * Toggle a rule's enabled flag.
 *
 * /customer/task-rules/save is an upsert that REQUIRES service_id (and the
 * full rule fields). Sending only { id, enabled } fails with
 * "The service id field is required." — so, like the OLD project's
 * handleToggle, we resend the complete rule with the flipped flag.
 */
export async function toggleTaskRule(
  rule: TaskRule,
  enabled: boolean,
): Promise<TaskRule> {
  const body: Record<string, unknown> = {
    id: rule.id,
    service_id: rule.serviceId,
    enabled,
    task_type: rule.taskType,
    priority: rule.priority,
    response_minutes: rule.slaMinutes,
    dedup_window_minutes: rule.dedupMinutes,
    auto_assign: rule.autoAssign,
  };
  // Preserve fields that aren't surfaced in the toggle UI so the save doesn't
  // blank them out.
  if (rule.titleTemplate !== undefined) body.title_template = rule.titleTemplate;
  if (rule.descriptionTemplate !== undefined)
    body.description_template = rule.descriptionTemplate;
  if (rule.assigneeId) body.assignee_id = rule.assigneeId;

  const res = await apiFetch<Record<string, unknown>>(endpoints.taskRules.save, {
    method: "POST",
    body,
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
