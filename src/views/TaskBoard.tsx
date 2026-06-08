"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Columns,
  Eye,
  Inbox,
  MapPin,
  Move,
  Play,
  Trash2,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/services/tasksService";

// ─── Board column config ──────────────────────────────────────────────────────

interface BoardColumn {
  id: string;
  label: string;
  tone: string;
  badgeTone: string;
  icon: React.ReactNode;
}

const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: "pending",
    label: "tasks.board.new",
    tone: "bg-slate-500/10 border-slate-500/20",
    badgeTone: "bg-slate-700 text-white",
    icon: <Inbox className="h-4 w-4" />,
  },
  {
    id: "assigned",
    label: "tasks.board.assigned",
    tone: "bg-blue-500/5 border-blue-500/20",
    badgeTone: "bg-blue-500 text-white",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    id: "in_progress",
    label: "tasks.board.inProgress",
    tone: "bg-orange-500/5 border-orange-500/20",
    badgeTone: "bg-orange-500 text-white",
    icon: <Play className="h-4 w-4" />,
  },
  {
    id: "pending_review",
    label: "tasks.board.pendingReview",
    tone: "bg-violet-500/5 border-violet-500/20",
    badgeTone: "bg-violet-500 text-white",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: "completed",
    label: "tasks.board.completed",
    tone: "bg-emerald-500/5 border-emerald-500/20",
    badgeTone: "bg-emerald-500 text-white",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

// ─── TaskBoard ────────────────────────────────────────────────────────────────

export function TaskBoard({
  tasks,
  isLoading,
  summary,
  formatDate,
  onMove,
  onDelete,
}: {
  tasks: TaskItem[];
  isLoading: boolean;
  summary: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  formatDate: (s: string) => string;
  onMove: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [dragOver, setDragOver] = React.useState<string | null>(null);
  const total = tasks.length || summary.total;
  const completedPct =
    total > 0 ? Math.round((summary.completed / total) * 100) : 0;

  const grouped = React.useMemo<Record<string, TaskItem[]>>(() => {
    const map: Record<string, TaskItem[]> = {};
    BOARD_COLUMNS.forEach((c) => (map[c.id] = []));
    for (const task of tasks) {
      const key = map[task.status] ? task.status : "pending";
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const fromStatus = e.dataTransfer.getData("text/from-status");
    if (id && fromStatus !== columnId) onMove(id, columnId);
  };

  // Permission read guard
  if (!hasPermission("tasks")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground">{t("common.noPermission", "You don\'t have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Move className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {t("tasks.board.hint", "Drag and drop to update task status")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className="gap-1"
            >
              <Columns className="h-3 w-3" />
              {t("tasks.board.totalChip", "{{n}} Total", { n: total })}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 border-destructive/30 bg-destructive/10 text-destructive"
            >
              <AlertTriangle className="h-3 w-3" />
              {t("tasks.board.overdueChip", "{{n}} Overdue", {
                n: summary.overdue,
              })}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              {completedPct}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {BOARD_COLUMNS.map((col) => {
          const colTasks = grouped[col.id] ?? [];
          const isOver = dragOver === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.id);
              }}
              onDragLeave={() => setDragOver((c) => (c === col.id ? null : c))}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                "flex min-h-[200px] flex-col rounded-xl border-2 transition-colors",
                col.tone,
                isOver && "border-primary ring-2 ring-primary/40"
              )}
            >
              <div className="flex items-center justify-between gap-2 rounded-t-xl bg-background/60 px-3 py-2.5 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {col.icon}
                  <span>{t(col.label, col.id)}</span>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-bold",
                    col.badgeTone
                  )}
                >
                  {colTasks.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-lg bg-muted"
                    />
                  ))
                ) : colTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 py-10 text-center text-xs text-muted-foreground">
                    <div>
                      <Inbox className="mx-auto mb-1 h-5 w-5 opacity-50" />
                      {t("tasks.board.dropHere", "Drop tasks here")}
                    </div>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <BoardCard
                      key={task.id}
                      task={task}
                      formatDate={formatDate}
                      onDelete={() => onDelete(task.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BoardCard ────────────────────────────────────────────────────────────────

function BoardCard({
  task,
  formatDate,
  onDelete,
}: {
  task: TaskItem;
  formatDate: (s: string) => string;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const priorityTone =
    task.priority === "urgent"
      ? "bg-destructive text-destructive-foreground"
      : task.priority === "high"
        ? "bg-orange-500/15 text-orange-700 border-orange-500/30"
        : task.priority === "medium"
          ? "bg-cyan-500/15 text-cyan-700 border-cyan-500/30"
          : "bg-muted text-muted-foreground";

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < Date.now() &&
    task.status !== "completed";

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.setData("text/from-status", task.status);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="group cursor-grab overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      {task.image ? (
        <div className="relative aspect-video bg-muted">
          <img
            src={task.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("h-5 px-1.5 text-[10px] capitalize", priorityTone)}
          >
            {t(`tasks.priorityLabel.${task.priority}`, task.priority)}
          </Badge>
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-mono lowercase"
          >
            {task.type}
          </Badge>
          {isOverdue ? (
            <Badge
              variant="outline"
              className="ms-auto h-5 gap-1 border-destructive/30 bg-destructive/10 px-1.5 text-[10px] text-destructive"
            >
              <AlertTriangle className="h-3 w-3" />
              {t("tasks.board.overdue", "Overdue")}
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {task.branch?.name ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {task.branch.name}
            </span>
          ) : null}
          {task.dueDate ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          {task.assignedTo ? (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{task.assignedTo.name}</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition group-hover:opacity-100"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </article>
  );
}
