"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
  Brain,
  Sparkles,
  User as UserIcon,
  CalendarDays,
  Clock,
  Check,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { cn } from "@/lib/utils";
import {
  applyAutoSchedule,
  fetchAutoSchedule,
  type SchedulerRecommendation,
} from "@/services/aiSchedulerService";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AiSchedulerView() {
  const { t } = useTranslation();
  const [taskId, setTaskId] = useState<string>("");
  const [rec, setRec] = useState<SchedulerRecommendation | null>(null);

  const matchMutation = useMutation({
    mutationFn: (id: string) => fetchAutoSchedule(id),
    onSuccess: (data) => setRec(data),
    onError: (e: Error) =>
      toast.error(
        e.message ||
          t("scheduler.matchFailed", "Failed to fetch recommendation")
      ),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!rec) return;
      await applyAutoSchedule(rec.task.id, {
        worker_id: rec.worker.id,
        scheduled_at: rec.schedule.scheduledAt,
        due_at: rec.schedule.dueAt,
      });
    },
    onSuccess: () => {
      toast.success(t("scheduler.applied", "AI recommendation applied"));
      setRec(null);
      setTaskId("");
    },
    onError: (e: Error) =>
      toast.error(e.message || t("scheduler.applyFailed", "Failed to apply")),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 text-white shadow-lg">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("scheduler.title", "AI Smart Scheduler")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "scheduler.subtitle",
              "Automatically assign tasks to the best worker at the optimal time"
            )}
          </p>
        </div>
      </header>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t("scheduler.selectTask", "Select Task to Schedule")}
                </label>
                <AsyncPaginatedSelect
                  endpoint="/customer/tasks"
                  labelKey="title"
                  valueKey="id"
                  value={taskId || null}
                  onChange={(v) => setTaskId(v ?? "")}
                  placeholder={t(
                    "scheduler.selectPlaceholder",
                    "Choose a task"
                  )}
                  isClearable
                />
              </div>
            </div>
            <Button
              size="lg"
              className="h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!taskId || matchMutation.isPending}
              onClick={() => matchMutation.mutate(taskId)}
            >
              {matchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t("scheduler.findBestMatch", "Find Best Match")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {rec && <RecommendationView rec={rec} />}

      {rec && (
        <div className="flex justify-center">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 px-8 text-white shadow-lg hover:opacity-95"
            disabled={applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            {applyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {t("scheduler.applyRecommendation", "Apply AI Recommendation")}
          </Button>
        </div>
      )}
    </div>
  );
}

function RecommendationView({ rec }: { rec: SchedulerRecommendation }) {
  const { t } = useTranslation();
  const confColor =
    rec.confidence.level === "high"
      ? "text-emerald-600"
      : rec.confidence.level === "medium"
        ? "text-amber-600"
        : "text-red-600";
  const confRing =
    rec.confidence.level === "high"
      ? "stroke-emerald-500"
      : rec.confidence.level === "medium"
        ? "stroke-amber-500"
        : "stroke-red-500";

  const bars = useMemo(
    () => [
      {
        label: t("scheduler.workload", "Workload"),
        suffix: `${rec.worker.activeTasks} ${t("scheduler.activeTasks", "active tasks")}`,
        current: rec.worker.workload.current,
        max: rec.worker.workload.max,
        tone: "neutral" as const,
      },
      {
        label: t("scheduler.completionRate", "Completion Rate"),
        suffix: `${rec.worker.completionRate.rate}% (${rec.worker.completionRate.current}/${rec.worker.completionRate.max})`,
        current: rec.worker.completionRate.current,
        max: rec.worker.completionRate.max,
        tone: "danger" as const,
      },
      {
        label: t("scheduler.speed", "Speed"),
        suffix: `${rec.worker.speed.avgHours}h avg (${rec.worker.speed.current}/${rec.worker.speed.max})`,
        current: rec.worker.speed.current,
        max: rec.worker.speed.max,
        tone: "good" as const,
      },
      {
        label: t("scheduler.branchFamiliarity", "Branch Familiarity"),
        suffix: `${rec.worker.branchFamiliarity.count} ${t("scheduler.branchTasks", "branch tasks")} (${rec.worker.branchFamiliarity.current}/${rec.worker.branchFamiliarity.max})`,
        current: rec.worker.branchFamiliarity.current,
        max: rec.worker.branchFamiliarity.max,
        tone: "good" as const,
      },
      {
        label: t("scheduler.activity", "Activity"),
        suffix: `${rec.worker.activity.last7days} ${t("scheduler.in7days", "in 7 days")} (${rec.worker.activity.current}/${rec.worker.activity.max})`,
        current: rec.worker.activity.current,
        max: rec.worker.activity.max,
        tone: "good" as const,
      },
    ],
    [rec, t]
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Worker card */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserIcon className="h-4 w-4" />
            {t("scheduler.recommendedWorker", "Recommended Worker")}
          </div>
        </div>
        <CardContent className="space-y-5 bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
              {initials(rec.worker.name)}
            </div>
            <div>
              <div className="text-base font-semibold">{rec.worker.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/15">
                  {t("scheduler.score", "Score")}: {rec.worker.score}/100
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                  {rec.worker.activeTasks} {t("scheduler.active", "active")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {bars.map((b: any) => (
              <Bar
                key={b.label}
                {...b}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schedule + confidence */}
      <div className="space-y-5">
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" />
              {t("scheduler.recommendedSchedule", "Recommended Schedule")}
            </div>
          </div>
          <CardContent className="space-y-3 bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-emerald-500" />
              {fmtDate(rec.schedule.scheduledAt)}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("scheduler.due", "Due")}: {fmtDate(rec.schedule.dueAt)}
            </div>
            {rec.schedule.reason && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                <Lightbulb className="me-1 inline h-4 w-4" />
                {rec.schedule.reason}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-5 p-4 sm:p-6">
            <div className="relative h-20 w-20 shrink-0">
              <svg
                viewBox="0 0 36 36"
                className="h-20 w-20 -rotate-90"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className={cn("transition-all", confRing)}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(rec.confidence.score / 100) * 97.4} 97.4`}
                />
              </svg>
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-lg font-bold",
                  confColor
                )}
              >
                {rec.confidence.score}%
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-base font-semibold">
                  {t("scheduler.aiConfidence", "AI Confidence")}
                </div>
                <Badge
                  className={cn(
                    "capitalize",
                    rec.confidence.level === "high" &&
                      "bg-emerald-500/15 text-emerald-600",
                    rec.confidence.level === "medium" &&
                      "bg-amber-500/15 text-amber-600",
                    rec.confidence.level === "low" &&
                      "bg-red-500/15 text-red-600"
                  )}
                >
                  {t(
                    `scheduler.level.${rec.confidence.level}`,
                    rec.confidence.level
                  )}
                </Badge>
              </div>
              {rec.confidence.factors.length > 0 ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {rec.confidence.factors.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("scheduler.noFactors", "No additional factors provided.")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Bar({
  label,
  suffix,
  current,
  max,
  tone,
}: {
  label: string;
  suffix: string;
  current: number;
  max: number;
  tone: "good" | "danger" | "neutral";
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const color =
    tone === "danger"
      ? "bg-red-500"
      : tone === "good"
        ? "bg-emerald-500"
        : "bg-slate-400";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
