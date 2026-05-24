"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  Hourglass,
  MapPin,
  RefreshCw,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { taskAnalyticsService } from "@/services/taskAnalyticsService";

export default function TaskAnalyticsView() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const slaQ = useQuery({
    queryKey: ["task-analytics", "sla"],
    queryFn: () => taskAnalyticsService.sla(),
    refetchInterval: 30000,
  });
  const workersQ = useQuery({
    queryKey: ["task-analytics", "workers"],
    queryFn: () => taskAnalyticsService.workers(),
    refetchInterval: 30000,
  });
  const volumeQ = useQuery({
    queryKey: ["task-analytics", "volume"],
    queryFn: () => taskAnalyticsService.volume(),
    refetchInterval: 60000,
  });
  const aiQ = useQuery({
    queryKey: ["task-analytics", "ai"],
    queryFn: () => taskAnalyticsService.aiPipeline(),
    refetchInterval: 30000,
  });
  const branchesQ = useQuery({
    queryKey: ["task-analytics", "branches"],
    queryFn: () => taskAnalyticsService.branches(),
    refetchInterval: 30000,
  });

  const sla = slaQ.data ?? {
    compliance: 0,
    avgResponse: 0,
    avgCompletion: 0,
    overdueNow: 0,
  };
  const workers = workersQ.data ?? [];
  const volume = volumeQ.data ?? [];
  const ai = aiQ.data ?? {
    detections: 0,
    tasksCreated: 0,
    deduplicated: 0,
    dedupRate: 0,
    aiCompletion: 0,
    aiTotal: 0,
  };
  const branches = branchesQ.data ?? [];

  const refresh = () => {
    slaQ.refetch();
    workersQ.refetch();
    volumeQ.refetch();
    aiQ.refetch();
    branchesQ.refetch();
  };

  const fastest = workers.length
    ? [...workers].sort(
        (a, b) => (a.avgTime || Infinity) - (b.avgTime || Infinity)
      )[0]
    : null;
  const busiestBranch = branches.length
    ? [...branches].sort((a, b) => b.tasks - a.tasks)[0]
    : null;
  const bestBranch = branches.length
    ? [...branches].sort((a, b) => b.rate - a.rate)[0]
    : null;
  const worstBranch = branches.length
    ? [...branches].sort((a, b) => a.rate - b.rate)[0]
    : null;

  const totalDetections = ai.detections;
  const totalCreated = ai.tasksCreated;
  const totalAssigned = workers.reduce((s, w) => s + w.tasks, 0);
  const totalCompleted = workers.reduce((s, w) => s + w.done, 0);

  return (
    <div
      className="space-y-6 p-4 md:p-6"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start justify-between gap-3">
        <Card className="flex flex-1 items-center gap-3 border-0 bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
          <div className="rounded-lg bg-white/20 p-2">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {t("taskAnalytics.title", "Task Analytics")}
            </h1>
            <p className="text-sm opacity-90">
              {t("taskAnalytics.subtitle", "Performance metrics and insights")}
            </p>
          </div>
        </Card>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={slaQ.isFetching}
        >
          <RefreshCw
            className={cn("h-4 w-4", slaQ.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      {/* SLA cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SlaCard
          icon={Shield}
          label={t("taskAnalytics.slaCompliance", "SLA Compliance")}
          value={`${sla.compliance.toFixed(0)}%`}
          accent="emerald"
        />
        <SlaCard
          icon={Clock}
          label={t("taskAnalytics.avgResponse", "Avg Response")}
          value={formatMinutes(sla.avgResponse)}
          accent="amber"
        />
        <SlaCard
          icon={Hourglass}
          label={t("taskAnalytics.avgCompletion", "Avg Completion")}
          value={formatMinutes(sla.avgCompletion)}
          accent="indigo"
        />
        <SlaCard
          icon={AlertTriangle}
          label={t("taskAnalytics.overdueNow", "Overdue Now")}
          value={String(sla.overdueNow)}
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Workers - 2 cols */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-semibold">
              <Trophy className="h-4 w-4" />
              {t("taskAnalytics.workerPerf", "Worker Performance")}
            </div>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white"
            >
              {workers.length} {t("taskAnalytics.workers", "workers")}
            </Badge>
          </div>
          <DataTable
            data={workers.map((w, i) => ({ ...w, _rank: i }))}
            emptyMessage={t("common.noData", "No data")}
            columns={[
              {
                key: "rank",
                header: "#",
                headClassName: "w-8",
                render: (w) =>
                  w._rank < 3 ? (
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        w._rank === 0 && "bg-amber-500/20 text-amber-600",
                        w._rank === 1 && "bg-slate-400/20 text-slate-500",
                        w._rank === 2 && "bg-orange-600/20 text-orange-700"
                      )}
                    >
                      🏅
                    </span>
                  ) : (
                    <span>{w._rank + 1}</span>
                  ),
              },
              {
                key: "name",
                header: t("taskAnalytics.worker", "Worker"),
                render: (w) => (
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      {w.name.charAt(0).toUpperCase()}
                    </span>
                    {w.name}
                  </div>
                ),
              },
              {
                key: "tasks",
                header: t("taskAnalytics.tasks", "Tasks"),
                render: (w) => <span>{w.tasks}</span>,
              },
              {
                key: "done",
                header: t("taskAnalytics.done", "Done"),
                render: (w) => (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/15 text-emerald-600"
                  >
                    {w.done}
                  </Badge>
                ),
              },
              {
                key: "rate",
                header: t("taskAnalytics.rate", "Rate"),
                render: (w) => (
                  <span className={cn("font-semibold", rateColor(w.rate))}>
                    {w.rate.toFixed(1)}%
                  </span>
                ),
              },
              {
                key: "avgTime",
                header: t("taskAnalytics.avgTime", "Avg Time"),
                render: (w) => (
                  <span className="text-muted-foreground">
                    {formatMinutes(w.avgTime)}
                  </span>
                ),
              },
            ]}
          />
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Pipeline */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 font-semibold text-white">
              <Bot className="h-4 w-4" />
              {t("taskAnalytics.aiPipeline", "AI Pipeline")}
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <MiniStat
                icon={Activity}
                value={ai.detections}
                label={t("taskAnalytics.detections", "Detections")}
                tone="cyan"
              />
              <MiniStat
                icon={CheckCircle2}
                value={ai.tasksCreated}
                label={t("taskAnalytics.tasksCreated", "Tasks Created")}
                tone="emerald"
              />
              <MiniStat
                icon={Sparkles}
                value={ai.deduplicated}
                label={t("taskAnalytics.deduplicated", "Deduplicated")}
                tone="amber"
              />
              <MiniStat
                icon={Zap}
                value={`${ai.dedupRate.toFixed(1)}%`}
                label={t("taskAnalytics.dedupRate", "Dedup Rate")}
                tone="indigo"
              />
            </div>
            <div className="px-4 pb-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                  {t("taskAnalytics.aiCompletion", "AI Task Completion")}
                </span>
                <span>
                  {ai.aiCompletion}/{ai.aiTotal} (
                  {ai.aiTotal
                    ? ((ai.aiCompletion / ai.aiTotal) * 100).toFixed(1)
                    : "0"}
                  %)
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{
                    width: `${ai.aiTotal ? Math.min(100, (ai.aiCompletion / ai.aiTotal) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Funnel */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white">
              <Activity className="h-4 w-4" />
              {t("taskAnalytics.funnel", "Detection → Resolution Funnel")}
            </div>
            <div className="space-y-3 p-4">
              <FunnelBar
                label={t("taskAnalytics.detections", "Detections")}
                value={totalDetections}
                max={Math.max(totalDetections, 1)}
                color="bg-blue-500"
              />
              <FunnelBar
                label={t("taskAnalytics.tasksCreated", "Tasks Created")}
                value={totalCreated}
                max={Math.max(totalDetections, 1)}
                color="bg-purple-500"
              />
              <FunnelBar
                label={t("taskAnalytics.assigned", "Assigned")}
                value={totalAssigned}
                max={Math.max(totalDetections, 1)}
                color="bg-amber-500"
              />
              <FunnelBar
                label={t("taskAnalytics.completed", "Completed")}
                value={totalCompleted}
                max={Math.max(totalDetections, 1)}
                color="bg-emerald-500"
              />
            </div>
          </Card>

          {/* Branch perf */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 font-semibold text-white">
              <Building2 className="h-4 w-4" />
              {t("taskAnalytics.branchPerf", "Branch Performance")}
            </div>
            <DataTable
              data={branches}
              emptyMessage={t("common.noData", "No data")}
              columns={[
                {
                  key: "name",
                  header: t("taskAnalytics.branch", "Branch"),
                  render: (b) => (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-orange-500" />
                      {b.name}
                    </div>
                  ),
                },
                {
                  key: "tasks",
                  header: t("taskAnalytics.tasks", "Tasks"),
                  render: (b) => <span>{b.tasks}</span>,
                },
                {
                  key: "rate",
                  header: t("taskAnalytics.rate", "Rate"),
                  render: (b) => (
                    <span className={cn("font-semibold", rateColor(b.rate))}>
                      {b.rate.toFixed(1)}%
                    </span>
                  ),
                },
                {
                  key: "avgTime",
                  header: t("taskAnalytics.avgTime", "Avg Time"),
                  render: (b) => (
                    <span className="text-muted-foreground">
                      {formatMinutes(b.avgTime)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {/* Task Volume Chart */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3 font-semibold text-white">
          <Activity className="h-4 w-4" />
          {t("taskAnalytics.volume30", "Task Volume (Last 30 Days)")}
        </div>
        <div className="h-72 p-4">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart data={volume}>
              <defs>
                <linearGradient
                  id="volGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#6366f1"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="#6366f1"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => formatDay(d)}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#volGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Branch Scorecard */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t("taskAnalytics.scorecard", "Branch Performance Scorecard")}
          </div>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white"
          >
            {branches.length} {t("taskAnalytics.branches", "branches")}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          {branches.map((b) => (
            <Card
              key={b.id}
              className="border-l-4 border-l-rose-400 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1 font-semibold">
                  <MapPin className="h-3 w-3 text-rose-500" />
                  {b.name}
                </div>
                <Badge
                  variant="outline"
                  className={cn(gradeColor(b.rate))}
                >
                  {grade(b.rate)}
                </Badge>
              </div>
              <div className="mb-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-blue-500/10 p-2">
                  <div className="text-lg font-bold text-blue-600">
                    {b.tasks}
                  </div>
                  <div className="text-muted-foreground">
                    {t("taskAnalytics.tasks", "Tasks")}
                  </div>
                </div>
                <div className="rounded bg-emerald-500/10 p-2">
                  <div className="text-lg font-bold text-emerald-600">
                    {b.rate.toFixed(1)}%
                  </div>
                  <div className="text-muted-foreground">
                    {t("taskAnalytics.done", "Done")}
                  </div>
                </div>
                <div className="rounded bg-amber-500/10 p-2">
                  <div className="text-lg font-bold text-amber-600">
                    {formatMinutes(b.avgTime)}
                  </div>
                  <div className="text-muted-foreground">
                    {t("taskAnalytics.avgTime", "Avg Time")}
                  </div>
                </div>
              </div>
              {b.fastResponse ? (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Zap className="h-3 w-3" />{" "}
                  {t("taskAnalytics.fastResponse", "Fast Response")}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </Card>

      {/* Business Insights */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 font-semibold text-white">
          <Sparkles className="h-4 w-4" />
          {t("taskAnalytics.insights", "Business Insights")}
        </div>
        <div className="space-y-3 p-4">
          <InsightRow
            icon={Activity}
            tone="indigo"
            label={t("taskAnalytics.overallHealth", "OVERALL HEALTH")}
            value={grade(sla.compliance)}
            sub={`${sla.compliance.toFixed(0)}% ${t("taskAnalytics.slaCompliance", "SLA Compliance")}`}
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InsightRow
              icon={Trophy}
              tone="emerald"
              label={t("taskAnalytics.bestBranch", "BEST BRANCH")}
              value={bestBranch?.name ?? "—"}
              sub={`${bestBranch?.rate.toFixed(1) ?? 0}% ${t("taskAnalytics.completionRate", "completion rate")}`}
            />
            <InsightRow
              icon={Building2}
              tone="amber"
              label={t("taskAnalytics.busiestBranch", "BUSIEST BRANCH")}
              value={busiestBranch?.name ?? "—"}
              sub={`${busiestBranch?.tasks ?? 0} ${t("taskAnalytics.tasksThisPeriod", "tasks this period")}`}
            />
            <InsightRow
              icon={Zap}
              tone="blue"
              label={t("taskAnalytics.fastestResponder", "FASTEST RESPONDER")}
              value={fastest?.name ?? "—"}
              sub={`${formatMinutes(fastest?.avgTime ?? 0)} ${t("taskAnalytics.avgCompletion", "Avg Completion")}`}
            />
            <InsightRow
              icon={AlertTriangle}
              tone="rose"
              label={t("taskAnalytics.needsAttention", "NEEDS ATTENTION")}
              value={worstBranch?.name ?? "—"}
              sub={`${worstBranch?.rate.toFixed(1) ?? 0}% ${t("taskAnalytics.completionLowest", "completion — lowest")}`}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function SlaCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "emerald" | "amber" | "indigo" | "rose";
}) {
  const tone = {
    emerald: "border-t-emerald-500 text-emerald-600 bg-emerald-500/10",
    amber: "border-t-amber-500 text-amber-600 bg-amber-500/10",
    indigo: "border-t-indigo-500 text-indigo-600 bg-indigo-500/10",
    rose: "border-t-rose-500 text-rose-600 bg-rose-500/10",
  }[accent];
  return (
    <Card className={cn("border-t-4 p-4", tone.split(" ")[0])}>
      <div
        className={cn(
          "mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg",
          tone
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  tone: "cyan" | "emerald" | "amber" | "indigo";
}) {
  const toneCls = {
    cyan: "bg-cyan-500/10 text-cyan-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    indigo: "bg-indigo-500/10 text-indigo-600",
  }[tone];
  return (
    <div className={cn("rounded-lg p-3 text-center", toneCls)}>
      <Icon className="mx-auto mb-1 h-4 w-4 opacity-80" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "indigo" | "emerald" | "amber" | "blue" | "rose";
  label: string;
  value: string;
  sub: string;
}) {
  const toneCls = {
    indigo: "bg-indigo-500/15 text-indigo-600",
    emerald: "bg-emerald-500/15 text-emerald-600",
    amber: "bg-amber-500/15 text-amber-600",
    blue: "bg-blue-500/15 text-blue-600",
    rose: "bg-rose-500/15 text-rose-600",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          toneCls
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate font-semibold">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function rateColor(r: number) {
  if (r >= 80) return "text-emerald-600";
  if (r >= 50) return "text-amber-600";
  return "text-rose-600";
}

function grade(r: number) {
  if (r >= 90) return "A";
  if (r >= 75) return "B";
  if (r >= 60) return "C";
  if (r >= 40) return "D";
  return "F";
}

function gradeColor(r: number) {
  if (r >= 75) return "border-emerald-500 text-emerald-600";
  if (r >= 50) return "border-amber-500 text-amber-600";
  return "border-rose-500 text-rose-600";
}

function formatMinutes(m: number) {
  if (!m) return "0m";
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h}h ${r}m` : `${h}h`;
}

function formatDay(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return String(dt.getDate());
}
