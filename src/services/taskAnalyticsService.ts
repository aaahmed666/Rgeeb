/**
 * Task Analytics service – wraps /customer/task-analytics endpoints.
 */
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { pickArray, str, type RawObject } from "@/lib/raw-response";

export interface SlaMetrics {
  compliance: number;
  avgResponse: number;
  avgCompletion: number;
  overdueNow: number;
}

export interface WorkerRow {
  id: string;
  name: string;
  tasks: number;
  done: number;
  rate: number;
  avgTime: number;
}

export interface VolumePoint {
  date: string;
  count: number;
}

export interface AiPipeline {
  detections: number;
  tasksCreated: number;
  deduplicated: number;
  dedupRate: number;
  aiCompletion: number;
  aiTotal: number;
}

export interface BranchRow {
  id: string;
  name: string;
  tasks: number;
  rate: number;
  avgTime: number;
  fastResponse?: boolean;
}

export interface FunnelData {
  detections: number;
  tasksCreated: number;
  assigned: number;
  completed: number;
}

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function unwrap<T = unknown>(raw: unknown): T {
  const r = raw as Record<string, unknown> | null;
  if (!r) return {} as T;
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) return r.data as T;
  return r as T;
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown> | null;
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data as unknown[];
  const d = r.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.data)) return d.data as unknown[];
  if (d && Array.isArray(d.items)) return d.items as unknown[];
  if (Array.isArray((r as Record<string, unknown>).items)) return (r as { items: unknown[] }).items;
  return [];
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export const taskAnalyticsService = {
  sla: () =>
    safe(
      (async () => {
        const r = unwrap<Record<string, unknown>>(await api.get(endpoints.taskAnalytics.sla));
        return {
          compliance: num(r.compliance ?? r.sla_compliance ?? r.rate),
          avgResponse: num(r.avg_response ?? r.avgResponse ?? r.response_time),
          avgCompletion: num(r.avg_completion ?? r.avgCompletion ?? r.completion_time),
          overdueNow: num(r.overdue_now ?? r.overdueNow ?? r.overdue),
        } satisfies SlaMetrics;
      })(),
      { compliance: 0, avgResponse: 0, avgCompletion: 0, overdueNow: 0 } satisfies SlaMetrics,
    ),

  workers: () =>
    safe(
      (async () => {
        const raw = await api.get<unknown>(endpoints.taskAnalytics.workers);
        return unwrapList(raw).map((x, i) => {
          const r = (x ?? {}) as Record<string, unknown>;
          const user = (r.user ?? r.worker ?? {}) as Record<string, unknown>;
          return {
            id: String(r.id ?? user.id ?? i),
            name: String(
              r.name ??
                user.name ??
                [user.first_name, user.last_name].filter(Boolean).join(" ") ??
                `Worker ${i + 1}`,
            ),
            tasks: num(r.tasks ?? r.total_tasks ?? r.count),
            done: num(r.done ?? r.completed),
            rate: num(r.rate ?? r.completion_rate),
            avgTime: num(r.avg_time ?? r.avgTime ?? r.average_time),
          } satisfies WorkerRow;
        });
      })(),
      [] as WorkerRow[],
    ),

  volume: () =>
    safe(
      (async () => {
        const raw = await api.get<unknown>(endpoints.taskAnalytics.volume);
        return unwrapList(raw).map((x, i) => {
          const r = (x ?? {}) as Record<string, unknown>;
          return {
            date: String(r.date ?? r.day ?? r.label ?? i),
            count: num(r.count ?? r.value ?? r.total ?? r.tasks),
          } satisfies VolumePoint;
        });
      })(),
      [] as VolumePoint[],
    ),

  aiPipeline: () =>
    safe(
      (async () => {
        const r = unwrap<Record<string, unknown>>(
          await api.get(endpoints.taskAnalytics.aiPipeline),
        );
        const created = num(r.tasks_created ?? r.tasksCreated ?? r.created);
        const detections = num(r.detections ?? r.total_detections);
        const dedup = num(r.deduplicated ?? r.dedup);
        const total = num(r.ai_total ?? r.total ?? created);
        return {
          detections,
          tasksCreated: created,
          deduplicated: dedup,
          dedupRate: num(r.dedup_rate ?? r.dedupRate ?? (detections ? (dedup / detections) * 100 : 0)),
          aiCompletion: num(r.ai_completion ?? r.completed ?? 0),
          aiTotal: total,
        } satisfies AiPipeline;
      })(),
      {
        detections: 0,
        tasksCreated: 0,
        deduplicated: 0,
        dedupRate: 0,
        aiCompletion: 0,
        aiTotal: 0,
      } satisfies AiPipeline,
    ),

  branches: () =>
    safe(
      (async () => {
        const raw = await api.get<unknown>(endpoints.taskAnalytics.branches);
        return unwrapList(raw).map((x, i) => {
          const r = (x ?? {}) as Record<string, unknown>;
          const branch = (r.branch ?? {}) as Record<string, unknown>;
          return {
            id: String(r.id ?? branch.id ?? i),
            name: String(r.name ?? branch.name ?? `Branch ${i + 1}`),
            tasks: num(r.tasks ?? r.total_tasks ?? r.count),
            rate: num(r.rate ?? r.completion_rate ?? r.done_rate),
            avgTime: num(r.avg_time ?? r.avgTime ?? r.average_time),
            fastResponse: Boolean(r.fast_response ?? r.fastResponse ?? false),
          } satisfies BranchRow;
        });
      })(),
      [] as BranchRow[],
    ),
};

// ---- Verification APIs ----
export interface VerificationRecord {
  id: string;
  taskId: string;
  taskTitle?: string;
  action: "verify" | "reject";
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

function mapVerification(r: RawObject): VerificationRecord {
  const task = r.task as RawObject | undefined;
  const reviewedBy = r.reviewed_by as RawObject | undefined;
  return {
    id: String(r.id ?? ""),
    taskId: String(r.task_id ?? task?.id ?? ""),
    taskTitle: (task && str(task, "title")) ?? str(r, "task_title"),
    action: r.action === "reject" ? "reject" : "verify",
    notes: str(r, "notes", "reason"),
    reviewedBy: (reviewedBy && str(reviewedBy, "name")) ?? str(r, "reviewer_name"),
    reviewedAt: str(r, "reviewed_at", "created_at"),
  };
}

export async function verifyTask(taskId: string, notes?: string): Promise<void> {
  await api.post(endpoints.taskAnalytics.verify, { task_id: taskId, notes });
}

export async function rejectTask(taskId: string, notes?: string): Promise<void> {
  await api.post(endpoints.taskAnalytics.reject, { task_id: taskId, notes });
}

export async function fetchVerificationHistory(): Promise<VerificationRecord[]> {
  const raw = await api.get<unknown>(endpoints.taskAnalytics.verifications);
  return pickArray(raw).map(mapVerification);
}
