"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Columns,
  Eye,
  Inbox,
  Lock,
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
    id: "new",
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
    id: "pending_verification",
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
  {
    id: "closed",
    label: "tasks.board.closed",
    tone: "bg-slate-500/10 border-slate-500/20",
    badgeTone: "bg-slate-500 text-white",
    icon: <Lock className="h-4 w-4" />,
  },
];

const COLUMN_IDS = new Set(BOARD_COLUMNS.map((c) => c.id));

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

  // Parity with the OLD board: only users with the task status-update grant may
  // move cards between columns. Without it, cards render but are not draggable.
  const canUpdateStatus =
    hasPermission("task_management.updateStatus") ||
    hasPermission("my_tasks.updateStatus") ||
    hasPermission("task_management.update") ||
    hasPermission("task_management");

  const total = tasks.length || summary.total;
  const completedPct =
    total > 0 ? Math.round((summary.completed / total) * 100) : 0;

  // ── Sensors: mouse/pen, touch, and keyboard (a11y) ──
  // PointerSensor activation distance prevents a click from being read as a drag
  // (so the delete button and card taps still work). TouchSensor delay enables
  // scrolling on mobile without accidentally grabbing a card.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status into columns. An optional local override map lets the
  // card jump to the target column instantly on drop while the API call settles
  // (the parent also runs an optimistic cache update; this is a render-time
  // safety net so the board never flickers back mid-flight).
  const [overrides, setOverrides] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // Drop a local override once the underlying task actually reports the new
    // status (parent cache caught up), so we don't hold stale overrides.
    setOverrides((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      let changed = false;
      const next = { ...prev };
      for (const task of tasks) {
        if (next[task.id] && next[task.id] === task.status) {
          delete next[task.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tasks]);

  const statusOf = React.useCallback(
    (task: TaskItem) => overrides[task.id] ?? task.status,
    [overrides]
  );

  const grouped = React.useMemo<Record<string, TaskItem[]>>(() => {
    const map: Record<string, TaskItem[]> = {};
    BOARD_COLUMNS.forEach((c) => (map[c.id] = []));
    for (const task of tasks) {
      const status = statusOf(task);
      if (map[status]) map[status].push(task);
    }
    return map;
  }, [tasks, statusOf]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const activeTask = React.useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId]
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  // Resolve the column id from a droppable target. Dropping over a CARD resolves
  // to that card's column (via the card's `data.columnId`); dropping over the
  // column surface resolves directly.
  const resolveColumn = (
    overId: string,
    overData?: Record<string, unknown>
  ) => {
    if (COLUMN_IDS.has(overId)) return overId;
    const colFromData = overData?.columnId;
    if (typeof colFromData === "string" && COLUMN_IDS.has(colFromData))
      return colFromData;
    return null;
  };

  const handleDragOver = (e: DragOverEvent) => {
    if (!e.over) return;
    const id = String(e.active.id);
    const targetCol = resolveColumn(
      String(e.over.id),
      e.over.data.current as Record<string, unknown> | undefined
    );
    if (!targetCol) return;
    setOverrides((prev) =>
      prev[id] === targetCol ? prev : { ...prev, [id]: targetCol }
    );
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const task = tasks.find((tk) => tk.id === id);
    const fromStatus = task?.status;

    if (!e.over) {
      // Dropped outside any column — revert the optimistic override.
      setOverrides((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    const targetCol = resolveColumn(
      String(e.over.id),
      e.over.data.current as Record<string, unknown> | undefined
    );

    if (!targetCol || targetCol === fromStatus) {
      // No real change — clear any transient override.
      setOverrides((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    // Keep the override until the parent cache reflects the new status, then
    // fire the API mutation.
    setOverrides((prev) => ({ ...prev, [id]: targetCol }));
    onMove(id, targetCol);
  };

  const handleDragCancel = () => {
    const id = activeId;
    setActiveId(null);
    if (!id) return;
    setOverrides((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Permission read guard
  if (!hasPermission("tasks")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">
          {t("errors.unauthorized", "Access Denied")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(
            "common.noPermission",
            "You don\'t have permission to view this page."
          )}
        </p>
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
              {canUpdateStatus
                ? t("tasks.board.hint", "Drag and drop to update task status")
                : t(
                    "tasks.board.hintReadOnly",
                    "Read-only — you don't have permission to change task status"
                  )}
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumnDroppable
              key={col.id}
              col={col}
              tasks={grouped[col.id] ?? []}
              isLoading={isLoading}
              draggable={canUpdateStatus}
              activeId={activeId}
              formatDate={formatDate}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* Floating preview that follows the cursor/finger while dragging. */}
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeTask ? (
            <BoardCard
              task={activeTask}
              formatDate={formatDate}
              draggable={false}
              isOverlay
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function BoardColumnDroppable({
  col,
  tasks,
  isLoading,
  draggable,
  activeId,
  formatDate,
  onDelete,
}: {
  col: BoardColumn;
  tasks: TaskItem[];
  isLoading: boolean;
  draggable: boolean;
  activeId: string | null;
  formatDate: (s: string) => string;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
    data: { columnId: col.id },
  });

  return (
    <div
      ref={setNodeRef}
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
          {tasks.length}
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
        ) : tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 py-10 text-center text-xs text-muted-foreground">
            <div>
              <Inbox className="mx-auto mb-1 h-5 w-5 opacity-50" />
              {t("tasks.board.dropHere", "Drop tasks here")}
            </div>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              columnId={col.id}
              draggable={draggable}
              isActive={activeId === task.id}
              formatDate={formatDate}
              onDelete={() => onDelete(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────

function DraggableCard({
  task,
  columnId,
  draggable,
  isActive,
  formatDate,
  onDelete,
}: {
  task: TaskItem;
  columnId: string;
  draggable: boolean;
  isActive: boolean;
  formatDate: (s: string) => string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      disabled: !draggable,
      data: { columnId, type: "task" },
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    // The original card stays in place but dims while its overlay clone drags.
    opacity: isDragging || isActive ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <BoardCard
        task={task}
        formatDate={formatDate}
        draggable={draggable}
        dragHandleProps={
          draggable ? { ...attributes, ...listeners } : undefined
        }
        onDelete={onDelete}
      />
    </div>
  );
}

// ─── BoardCard ────────────────────────────────────────────────────────────────

function BoardCard({
  task,
  formatDate,
  draggable = true,
  dragHandleProps,
  isOverlay = false,
  onDelete,
}: {
  task: TaskItem;
  formatDate: (s: string) => string;
  draggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
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
      {...(dragHandleProps ?? {})}
      className={cn(
        "group overflow-hidden rounded-lg border bg-card shadow-sm transition hover:shadow-md",
        draggable
          ? "cursor-grab touch-none active:cursor-grabbing"
          : "cursor-default",
        isOverlay && "rotate-1 cursor-grabbing shadow-xl ring-2 ring-primary/40"
      )}
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
          {/* Pointer-down stop prevents the drag sensor from swallowing the
              click so delete still fires. */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition group-hover:opacity-100"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
    </article>
  );
}
