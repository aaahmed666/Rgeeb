import { apiFetch } from "@/lib/api";

export interface SchedulerTask {
  id: string;
  title: string;
  branchName?: string;
  priority?: string;
  status?: string;
}

export interface SchedulerWorker {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  activeTasks: number;
  workload: { current: number; max: number };
  completionRate: { rate: number; current: number; max: number };
  speed: { avgHours: number; current: number; max: number };
  branchFamiliarity: { count: number; current: number; max: number };
  activity: { last7days: number; current: number; max: number };
}

export interface SchedulerRecommendation {
  task: SchedulerTask;
  worker: SchedulerWorker;
  schedule: {
    scheduledAt: string;
    dueAt: string;
    reason: string;
  };
  confidence: {
    score: number; // 0-100
    level: "low" | "medium" | "high";
    factors: string[];
  };
}

function pickStr(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === "string" && v) return v;
  return undefined;
}
function pickNum(...vals: unknown[]): number {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export interface SchedulerTasksPage {
  tasks: SchedulerTask[];
  currentPage: number;
  totalPages: number;
  total: number;
}

export async function fetchSchedulerTasks(
  page: number = 1,
  perPage: number = 15
): Promise<SchedulerTasksPage> {
  const res = await apiFetch<Record<string, unknown>>("/customer/tasks", {
    query: { page, per_page: perPage },
  });
  // Support both flat and nested shapes: { data: [...] } or { data: { data: [...] } }
  let arr: unknown[] = [];
  if (Array.isArray(res)) arr = res as unknown[];
  else if (Array.isArray(res?.data)) arr = res.data as unknown[];
  else {
    const inner = res?.data as Record<string, unknown> | undefined;
    if (inner && Array.isArray(inner.data)) arr = inner.data as unknown[];
  }
  const tasks = (arr as Record<string, unknown>[]).map((t) => ({
    id: String(t.id ?? ""),
    title: pickStr(t.title, t.name, t.task_title) ?? `Task #${t.id ?? ""}`,
    branchName: pickStr(
      (t.branch as Record<string, unknown> | undefined)?.name,
      t.branch_name
    ),
    priority: pickStr(t.priority),
    status: pickStr(t.status),
  }));

  const meta = (res?.meta as Record<string, unknown>) ?? {};
  const dataMeta = (res?.data as Record<string, unknown>) ?? {};
  const pagination =
    (res?.pagination as Record<string, unknown>) ??
    (meta.pagination as Record<string, unknown>) ??
    (dataMeta.pagination as Record<string, unknown>) ??
    {};
  const get = (...keys: string[]) => {
    for (const k of keys) {
      for (const src of [
        res as Record<string, unknown>,
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
  const total = pickNum(get("total"), tasks.length);
  const perPageOut = pickNum(get("per_page", "perPage"), perPage) || perPage;
  const currentPage =
    pickNum(get("current_page", "currentPage", "page"), page) || page;
  const totalPagesFromApi = pickNum(
    get("total_pages", "totalPages", "last_page")
  );
  const totalPages =
    totalPagesFromApi > 0
      ? totalPagesFromApi
      : perPageOut > 0
        ? Math.ceil(total / perPageOut)
        : 1;
  return { tasks, currentPage, totalPages, total };
}

export async function fetchAutoSchedule(
  taskId: string
): Promise<SchedulerRecommendation> {
  const raw = await apiFetch<Record<string, unknown>>(
    "/customer/smart-scheduler/auto-schedule",
    { query: { task_id: taskId } }
  );
  const data = (raw?.data as Record<string, unknown>) ?? raw ?? {};
  const w = (data.worker ?? data.recommended_worker ?? {}) as Record<
    string,
    unknown
  >;
  const s = (data.schedule ?? data.recommended_schedule ?? {}) as Record<
    string,
    unknown
  >;
  const c = (data.confidence ?? data.ai_confidence ?? {}) as Record<
    string,
    unknown
  >;
  const t = (data.task ?? {}) as Record<string, unknown>;

  const scoreVal = pickNum(w.score, w.match_score);
  const confScore = pickNum(c.score, c.percentage, c.value);
  const confLevelRaw = pickStr(c.level, c.label) ?? "";
  const level = (
    ["low", "medium", "high"].includes(confLevelRaw.toLowerCase())
      ? confLevelRaw.toLowerCase()
      : confScore >= 75
        ? "high"
        : confScore >= 50
          ? "medium"
          : "low"
  ) as "low" | "medium" | "high";

  const breakdown = (w.breakdown ?? w.scores ?? {}) as Record<string, unknown>;
  const wl = (breakdown.workload ?? {}) as Record<string, unknown>;
  const cr = (breakdown.completion_rate ??
    breakdown.completionRate ??
    {}) as Record<string, unknown>;
  const sp = (breakdown.speed ?? {}) as Record<string, unknown>;
  const bf = (breakdown.branch_familiarity ??
    breakdown.branchFamiliarity ??
    {}) as Record<string, unknown>;
  const ac = (breakdown.activity ?? {}) as Record<string, unknown>;

  return {
    task: {
      id: String(t.id ?? taskId),
      title: pickStr(t.title, t.name) ?? `Task #${taskId}`,
      branchName: pickStr(
        (t.branch as Record<string, unknown> | undefined)?.name,
        t.branch_name
      ),
      priority: pickStr(t.priority),
    },
    worker: {
      id: String(w.id ?? ""),
      name: pickStr(w.name, w.full_name, w.username) ?? "—",
      avatar: pickStr(w.avatar, w.avatar_url),
      score: scoreVal,
      activeTasks: pickNum(w.active_tasks, w.activeTasks),
      workload: {
        current: pickNum(wl.current, wl.value),
        max: pickNum(wl.max, wl.total) || 30,
      },
      completionRate: {
        rate: pickNum(cr.rate, cr.percent, cr.percentage),
        current: pickNum(cr.current, cr.value),
        max: pickNum(cr.max, cr.total) || 25,
      },
      speed: {
        avgHours: pickNum(sp.avg_hours, sp.avgHours, sp.average),
        current: pickNum(sp.current, sp.value),
        max: pickNum(sp.max, sp.total) || 20,
      },
      branchFamiliarity: {
        count: pickNum(bf.count, bf.tasks),
        current: pickNum(bf.current, bf.value),
        max: pickNum(bf.max, bf.total) || 15,
      },
      activity: {
        last7days: pickNum(ac.last_7_days, ac.last7Days, ac.count),
        current: pickNum(ac.current, ac.value),
        max: pickNum(ac.max, ac.total) || 10,
      },
    },
    schedule: {
      scheduledAt: pickStr(s.scheduled_at, s.scheduledAt, s.start_at) ?? "",
      dueAt: pickStr(s.due_at, s.dueAt, s.end_at) ?? "",
      reason: pickStr(s.reason, s.note, s.message) ?? "",
    },
    confidence: {
      score: confScore,
      level,
      factors: Array.isArray(c.factors)
        ? (c.factors as unknown[]).map((f) => String(f))
        : Array.isArray(c.reasons)
          ? (c.reasons as unknown[]).map((f) => String(f))
          : [],
    },
  };
}

export async function applyAutoSchedule(
  taskId: string,
  payload: { worker_id: string; scheduled_at: string; due_at: string }
): Promise<void> {
  await apiFetch("/customer/smart-scheduler/apply", {
    method: "POST",
    body: {
      task_id: taskId,
      assigned_to: payload.worker_id,
      scheduled_at: payload.scheduled_at,
      due_at: payload.due_at,
    },
  });
}
