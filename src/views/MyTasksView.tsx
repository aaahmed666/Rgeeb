"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Hourglass,
  ImageIcon,
  Inbox,
  ListChecks,
  MapPin,
  MessageSquare,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Video,
  ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { myTasksService, type MyTaskItem, type MyTaskStats } from "@/services/myTasksService";
import { toast } from "sonner";

const ACTIVE_STATUSES = new Set(["pending", "assigned", "in_progress"]);
const REVIEW_STATUSES = new Set(["pending_review", "review"]);
const DONE_STATUSES = new Set(["completed", "done", "closed"]);

type TFn = (k: string, d?: string) => string;

export default function MyTasksView() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const isRtl = i18n.dir() === "rtl";
  const [tab, setTab] = React.useState<"active" | "review" | "done">("active");

  const statsQ = useQuery({
    queryKey: ["my-tasks", "stats"],
    queryFn: () => myTasksService.stats(),
    refetchInterval: 30000,
  });

  const listQ = useQuery({
    queryKey: ["my-tasks", "list"],
    queryFn: () => myTasksService.list({ perPage: 100 }),
    refetchInterval: 20000,
  });

  const stats: MyTaskStats =
    statsQ.data ?? {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      completionRate: 0,
    };

  const items = listQ.data ?? [];
  const active = items.filter((x) => ACTIVE_STATUSES.has(x.status));
  const review = items.filter((x) => REVIEW_STATUSES.has(x.status));
  const done = items.filter((x) => DONE_STATUSES.has(x.status));

  const shown = tab === "active" ? active : tab === "review" ? review : done;

  const startM = useMutation({
    mutationFn: (id: string) => myTasksService.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success(t("myTasks.taskStarted", "Task started"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeM = useMutation({
    mutationFn: (id: string) => myTasksService.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success(t("myTasks.taskCompleted", "Task completed"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refresh = () => {
    statsQ.refetch();
    listQ.refetch();
  };

  // Permission read guard
  if (!hasPermission("my_tasks")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground">{t("common.noPermission", "You don\'t have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            {t("myTasks.title", "My Tasks")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("myTasks.subtitle", "Track and manage your assigned tasks in real-time")}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} disabled={listQ.isFetching}>
          <RefreshCw className={cn("h-4 w-4", listQ.isFetching && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={ListChecks}
          label={t("myTasks.total", "Total")}
          value={stats.total}
          gradient="from-slate-700 to-slate-500"
        />
        <StatCard
          icon={Hourglass}
          label={t("myTasks.pending", "Pending")}
          value={stats.pending}
          gradient="from-cyan-500 to-sky-400"
        />
        <StatCard
          icon={Sparkles}
          label={t("myTasks.inProgress", "In Progress")}
          value={stats.inProgress}
          gradient="from-amber-500 to-orange-400"
        />
        <StatCard
          icon={CheckCircle2}
          label={t("myTasks.completed", "Completed")}
          value={stats.completed}
          gradient="from-emerald-500 to-green-400"
        />
        <StatCard
          icon={AlertTriangle}
          label={t("myTasks.overdue", "Overdue")}
          value={stats.overdue}
          gradient="from-rose-500 to-red-400"
        />
      </div>

      {/* Completion Rate */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{t("myTasks.completionRate", "Completion Rate")}</span>
          <span className="font-semibold">{stats.completionRate.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, stats.completionRate))}%` }}
          />
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {t("myTasks.tabActive", "Active")} ({active.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            <Search className="h-4 w-4" />
            {t("myTasks.tabReview", "Review")} ({review.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {t("myTasks.tabDone", "Done")} ({done.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {listQ.isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="h-72 animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground" />
          <div className="font-medium">{t("myTasks.empty", "No tasks here")}</div>
          <div className="text-sm text-muted-foreground">
            {t("myTasks.emptyHint", "You're all caught up in this view.")}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {shown.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={() => startM.mutate(task.id)}
              onComplete={() => completeM.mutate(task.id)}
              starting={startM.isPending && startM.variables === task.id}
              completing={completeM.isPending && completeM.variables === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  gradient: string;
}

function StatCard({ icon: Icon, label, value, gradient }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 p-4 text-white shadow-lg",
        "bg-gradient-to-br",
        gradient,
      )}
    >
      <Icon className="mb-2 h-5 w-5 opacity-80" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </Card>
  );
}

interface TaskCardProps {
  task: MyTaskItem;
  onStart: () => void;
  onComplete: () => void;
  starting: boolean;
  completing: boolean;
}

function TaskCard({ task, onStart, onComplete, starting, completing }: TaskCardProps) {
  const { t } = useTranslation();
  const priority = (task.priority || "medium").toLowerCase();
  const status = (task.status || "pending").toLowerCase();
  const isActive = ACTIVE_STATUSES.has(status);
  const isReview = REVIEW_STATUSES.has(status);

  const borderColor =
    task.overdue || priority === "urgent"
      ? "border-l-rose-500"
      : priority === "high"
        ? "border-l-orange-500"
        : priority === "medium"
          ? "border-l-amber-400"
          : "border-l-emerald-400";

  return (
    <Card className={cn("overflow-hidden border-l-4 p-4", borderColor)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold">{task.title}</h3>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="secondary" className="gap-1">
            <UserCheck className="h-3 w-3" />
            {statusLabel(status, t as TFn)}
          </Badge>
          {task.overdue ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t("myTasks.overdueBadge", "OVERDUE")}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="outline" className={cn("gap-1", priorityClass(priority))}>
          {priorityLabel(priority, t as TFn)}
        </Badge>
        {task.branch ? (
          <Badge variant="outline" className="gap-1">
            <MapPin className="h-3 w-3" /> {task.branch}
          </Badge>
        ) : null}
        {task.serviceName ? (
          <Badge variant="outline" className="gap-1">
            {task.serviceName}
          </Badge>
        ) : null}
        {task.dueDate ? (
          <Badge variant="outline" className="gap-1">
            <CalendarClock className="h-3 w-3" /> {formatDate(task.dueDate)}
          </Badge>
        ) : null}
      </div>

      {task.assignedTo ? (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
            <UserCheck className="h-3 w-3 text-primary" />
          </div>
          <span className="text-muted-foreground">
            {t("myTasks.assignedTo", "Assigned to:")}
          </span>
          <span className="font-medium">{task.assignedTo}</span>
        </div>
      ) : null}

      <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-muted">
        {task.image ? (
          <img
            src={task.image}
            alt={task.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-40" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {isActive ? (
          status === "in_progress" ? (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onComplete}
              disabled={completing}
            >
              <CheckCircle2 className="me-2 h-4 w-4" />
              {t("myTasks.markDone", "Mark Done")}
            </Button>
          ) : (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onStart}
              disabled={starting}
            >
              <Play className="me-2 h-4 w-4" />
              {t("myTasks.startTask", "Start Task")}
            </Button>
          )
        ) : isReview ? (
          <Button
            className="flex-1"
            variant="outline"
            onClick={onComplete}
            disabled={completing}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t("myTasks.approve", "Approve & Close")}
          </Button>
        ) : (
          <Button className="flex-1" variant="outline" disabled>
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t("myTasks.completedLabel", "Completed")}
          </Button>
        )}
        <Button variant="outline" size="icon">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>

      {task.cameraName ? (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Video className="h-3 w-3" /> {task.cameraName}
          {task.detectedAt ? (
            <>
              <Clock className="ms-2 h-3 w-3" /> {formatDate(task.detectedAt)}
            </>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}


function statusLabel(s: string, t: TFn) {
  switch (s) {
    case "in_progress":
      return t("myTasks.statusInProgress", "In Progress");
    case "assigned":
      return t("myTasks.statusAssigned", "Assigned");
    case "pending":
      return t("myTasks.statusPending", "Pending");
    case "pending_review":
    case "review":
      return t("myTasks.statusReview", "Review");
    case "completed":
    case "done":
      return t("myTasks.statusCompleted", "Completed");
    default:
      return s;
  }
}

function priorityLabel(p: string, t: TFn) {
  switch (p) {
    case "urgent":
      return t("myTasks.priorityUrgent", "urgent");
    case "high":
      return t("myTasks.priorityHigh", "high");
    case "medium":
      return t("myTasks.priorityMedium", "medium");
    case "low":
      return t("myTasks.priorityLow", "low");
    default:
      return p;
  }
}

function priorityClass(p: string) {
  switch (p) {
    case "urgent":
      return "border-rose-500 text-rose-600";
    case "high":
      return "border-orange-500 text-orange-600";
    case "medium":
      return "border-amber-500 text-amber-600";
    case "low":
      return "border-emerald-500 text-emerald-600";
    default:
      return "";
  }
}

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
