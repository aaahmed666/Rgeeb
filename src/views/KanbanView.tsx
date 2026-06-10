"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Loader2,
  MapPin,
  Move,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  X,
  Pencil,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { toast } from "sonner";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import {
  tasksService,
  type TaskItem,
  type KanbanPage,
  type TaskPayload,
  type LookupOption,
} from "@/services/tasksService";

const PER_PAGE = 15;

interface BoardColumn {
  id: string;
  label: string;
  tone: string;
  badgeTone: string;
  icon: React.ReactNode;
}

const COLUMNS: BoardColumn[] = [
  {
    id: "pending",
    label: "New",
    tone: "bg-slate-500/5 border-slate-500/20",
    badgeTone: "bg-slate-700 text-white",
    icon: <Inbox className="h-4 w-4" />,
  },
  {
    id: "assigned",
    label: "Assigned",
    tone: "bg-blue-500/5 border-blue-500/20",
    badgeTone: "bg-blue-500 text-white",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    id: "in_progress",
    label: "In Progress",
    tone: "bg-orange-500/5 border-orange-500/20",
    badgeTone: "bg-orange-500 text-white",
    icon: <Play className="h-4 w-4" />,
  },
  {
    id: "pending_review",
    label: "Pending Review",
    tone: "bg-violet-500/5 border-violet-500/20",
    badgeTone: "bg-violet-500 text-white",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    id: "completed",
    label: "Completed",
    tone: "bg-emerald-500/5 border-emerald-500/20",
    badgeTone: "bg-emerald-500 text-white",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

const PRIORITIES = ["low", "medium", "high", "urgent"];
const TASK_TYPES = ["manual", "recurring"];
const STATUSES = COLUMNS.map((c) => ({ value: c.id, label: c.label }));

// ---------------------------------------------------------------------------
// Task Form Modal (Create & Edit)
// ---------------------------------------------------------------------------

interface TaskFormProps {
  mode: "create" | "edit";
  initial?: Partial<TaskItem>;
  branches: LookupOption[];
  employees: LookupOption[];
  onSubmit: (payload: TaskPayload) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

function TaskForm({
  mode,
  initial,
  branches,
  employees,
  onSubmit,
  onClose,
  isSubmitting,
}: TaskFormProps) {
  const { t } = useTranslation();
  const [name, setName] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [type, setType] = React.useState(initial?.type ?? "manual");
  const [priority, setPriority] = React.useState(initial?.priority ?? "medium");
  const [status, setStatus] = React.useState(initial?.status ?? "pending");
  const [time, setTime] = React.useState(initial?.time ?? "");
  const [scheduledDate, setScheduledDate] = React.useState(
    initial?.scheduledDate ?? ""
  );
  const [recurringDays, setRecurringDays] = React.useState(
    initial?.recurringEveryDays ? String(initial.recurringEveryDays) : ""
  );
  const [startDate, setStartDate] = React.useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = React.useState(initial?.endDate ?? "");
  const [isDraft, setIsDraft] = React.useState(initial?.isDraft ?? false);

  const [projectId, setProjectId] = React.useState(initial?.projectId ?? "");
  const [departmentId, setDepartmentId] = React.useState(
    initial?.departmentId ?? ""
  );
  const [selectedBranches, setSelectedBranches] = React.useState<string[]>(
    initial?.branchIds ?? (initial?.branch?.id ? [initial.branch.id] : [])
  );
  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>(
    initial?.assignedUserIds ??
      (initial?.assignedTo?.id ? [initial.assignedTo.id] : [])
  );

  const toggleMulti = (
    id: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload: TaskPayload = {
      ...(mode === "edit" && initial?.id ? { id: initial.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      priority,
      status,
      project_id: projectId || undefined,
      department_id: departmentId || undefined,
      time: time || undefined,
      scheduled_date: scheduledDate || undefined,
      recurring_every_days: recurringDays ? Number(recurringDays) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      assigned_user_ids: selectedEmployees.length
        ? selectedEmployees
        : undefined,
      branch_ids: selectedBranches.length ? selectedBranches : undefined,
      is_draft: isDraft ? 1 : 0,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? t("kanban.newTask") : t("tasks.editTask")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="task-name">
                {t("tasks.form.name")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">{t("tasks.form.description")}</Label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Type + Priority + Status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tasks.col.type")}</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TASK_TYPES.map((t) => (
                    <option
                      key={t}
                      value={t}
                      className="capitalize"
                    >
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tasks.col.priority")}</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PRIORITIES.map((p) => (
                    <option
                      key={p}
                      value={p}
                      className="capitalize"
                    >
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tasks.col.status")}</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option
                      key={s.value}
                      value={s.value}
                    >
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project + Department */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("projects.projectName")}</Label>
                <AsyncPaginatedSelect
                  endpoint="/customer/projects"
                  labelKey="name"
                  valueKey="id"
                  value={projectId || null}
                  onChange={(v) => setProjectId(v ?? "")}
                  placeholder={`— ${t("common.noData")} —`}
                  isClearable
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("navigation.departments")}</Label>
                <AsyncPaginatedSelect
                  endpoint="/customer/departments"
                  labelKey="name_en"
                  valueKey="id"
                  extraParams={{ active: 1 }}
                  value={departmentId || null}
                  onChange={(v) => setDepartmentId(v ?? "")}
                  placeholder={`— ${t("common.noData")} —`}
                  isClearable
                />
              </div>
            </div>

            {/* Scheduled date + time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("tasks.form.scheduledDate")}</Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("serviceMonitor.colTime")}</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Recurring */}
            {type === "recurring" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("projects.startDate")}</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("projects.endDate")}</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Repeat every (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={recurringDays}
                    onChange={(e) => setRecurringDays(e.target.value)}
                    placeholder="e.g. 7"
                  />
                </div>
              </div>
            )}

            {/* Branches (multi-select chips) */}
            {branches.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("navigation.branches")}</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-input p-2">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        toggleMulti(b.id, selectedBranches, setSelectedBranches)
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs transition",
                        selectedBranches.includes(b.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Employees (multi-select chips) */}
            {employees.length > 0 && (
              <div className="space-y-1.5">
                <Label>{t("tasks.col.assignedTo")}</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-input p-2">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() =>
                        toggleMulti(
                          emp.id,
                          selectedEmployees,
                          setSelectedEmployees
                        )
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs transition",
                        selectedEmployees.includes(emp.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {emp.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Draft toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              {t("common.save")} draft
            </label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? t("tasks.createTask") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Dialog
// ---------------------------------------------------------------------------

function DeleteConfirm({
  task,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  task: TaskItem;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">Delete Task</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                "{task.title}"
              </span>
              ? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

function KanbanPageRoute() {
  const { t, i18n } = useTranslation();
  const can = usePermission("kanban");
  const qc = useQueryClient();
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Modal state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTask, setEditTask] = React.useState<TaskItem | null>(null);
  const [deleteTask, setDeleteTask] = React.useState<TaskItem | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  // Board data
  const q = useInfiniteQuery({
    queryKey: ["kanban", "tasks"],
    queryFn: ({ pageParam = 1 }) =>
      tasksService.kanban(pageParam as number, PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (last: KanbanPage) =>
      last.currentPage < last.totalPages ? last.currentPage + 1 : undefined,
  });

  // Lookups (loaded once, used by form)
  const { data: branches = [] } = useQuery({
    queryKey: ["lookup", "branches"],
    queryFn: () => tasksService.listBranches(),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["lookup", "employees"],
    queryFn: () => tasksService.listEmployees(),
  });

  const pages = q.data?.pages ?? [];
  const items: TaskItem[] = React.useMemo(
    () => pages.flatMap((p) => p.items),
    [pages]
  );
  const last = pages[pages.length - 1];
  const total = last?.total ?? 0;
  const loaded = items.length;
  const byStatus = last?.byStatus ?? {};

  // Infinite scroll
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          q.hasNextPage &&
          !q.isFetchingNextPage
        ) {
          q.fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.hasNextPage, q.isFetchingNextPage]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["kanban"] });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createM = useMutation({
    mutationFn: (payload: TaskPayload) => tasksService.create(payload),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      toast.success(t("tasks.createSuccess", "Task created"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: (payload: TaskPayload & { id: string }) =>
      tasksService.update(payload),
    onSuccess: () => {
      invalidate();
      setEditTask(null);
      toast.success(t("tasks.updateSuccess", "Task updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksService.updateStatus(id, status),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteTask(null);
      toast.success(t("tasks.deleteSuccess", "Task deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Grouped tasks ────────────────────────────────────────────────────────

  const grouped = React.useMemo(() => {
    const map: Record<string, TaskItem[]> = {};
    COLUMNS.forEach((c) => (map[c.id] = []));
    for (const task of items) {
      const key = map[task.status] ? task.status : "pending";
      map[key].push(task);
    }
    return map;
  }, [items]);

  const formatDate = (s: string) => {
    if (!s) return "";
    try {
      return new Date(s).toLocaleString(
        i18n.language === "ar" ? "ar-EG" : "en-US",
        {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return s;
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const fromStatus = e.dataTransfer.getData("text/from-status");
    if (id && fromStatus !== columnId) moveM.mutate({ id, status: columnId });
  };

  const sharedFormProps = {
    branches,
    employees,
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("kanban.title", "Kanban Board")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("kanban.subtitle", "Drag and drop tasks across stages")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw
              className={cn("me-2 h-4 w-4", q.isFetching && "animate-spin")}
            />
            {t("common.refresh", "Refresh")}
          </Button>
          {can.create && (
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="me-2 h-4 w-4" />
              {t("kanban.newTask", "New Task")}
            </Button>
          )}
        </div>
      </header>

      {/* Stats bar */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Move className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {t("kanban.hint", "Drag and drop to update task status")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className="gap-1"
            >
              {t("kanban.loaded", "{{loaded}} / {{total}} loaded", {
                loaded,
                total,
              })}
            </Badge>
            {COLUMNS.map((c) => {
              const remain = byStatus[c.id] ?? grouped[c.id]?.length ?? 0;
              return (
                <Badge
                  key={c.id}
                  variant="outline"
                  className="gap-1"
                >
                  <span className="font-medium capitalize">{c.label}</span>
                  <span className="opacity-70">{remain}</span>
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Board columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const colTasks = grouped[col.id] ?? [];
          const remain = byStatus[col.id] ?? colTasks.length;
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
                  <span>{col.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-muted-foreground"
                    title="loaded"
                  >
                    {colTasks.length}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-bold",
                      col.badgeTone
                    )}
                    title="total"
                  >
                    {remain}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2">
                {q.isLoading ? (
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
                      {t("kanban.dropHere", "Drop tasks here")}
                    </div>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <BoardCard
                      key={task.id}
                      task={task}
                      formatDate={formatDate}
                      onEdit={can.update ? () => setEditTask(task) : undefined}
                      onDelete={
                        can.delete ? () => setDeleteTask(task) : undefined
                      }
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div
        ref={sentinelRef}
        className="flex items-center justify-center py-6"
      >
        {q.isFetchingNextPage ? (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("kanban.loadingMore", "Loading more…")}
          </div>
        ) : q.hasNextPage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.fetchNextPage()}
          >
            {t("kanban.loadMore", "Load more")}
          </Button>
        ) : items.length > 0 ? (
          <span className="text-xs text-muted-foreground">
            {t("kanban.allLoaded", "All tasks loaded")}
          </span>
        ) : null}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {createOpen && (
        <TaskForm
          mode="create"
          {...sharedFormProps}
          onSubmit={(p) => createM.mutate(p)}
          onClose={() => setCreateOpen(false)}
          isSubmitting={createM.isPending}
        />
      )}

      {editTask && (
        <TaskForm
          mode="edit"
          initial={editTask}
          {...sharedFormProps}
          onSubmit={(p) => updateM.mutate(p as TaskPayload & { id: string })}
          onClose={() => setEditTask(null)}
          isSubmitting={updateM.isPending}
        />
      )}

      {deleteTask && (
        <DeleteConfirm
          task={deleteTask}
          onConfirm={() => deleteM.mutate(deleteTask.id)}
          onCancel={() => setDeleteTask(null)}
          isDeleting={deleteM.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board Card
// ---------------------------------------------------------------------------

function BoardCard({
  task,
  formatDate,
  onEdit,
  onDelete,
}: {
  task: TaskItem;
  formatDate: (s: string) => string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
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
            {task.priority}
          </Badge>
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-mono lowercase"
          >
            {task.type}
          </Badge>
          {task.isDraft && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] border-amber-400/40 bg-amber-400/10 text-amber-600"
            >
              draft
            </Badge>
          )}
          {isOverdue ? (
            <Badge
              variant="outline"
              className="ms-auto h-5 gap-1 border-destructive/30 bg-destructive/10 px-1.5 text-[10px] text-destructive"
            >
              <AlertTriangle className="h-3 w-3" />
              Overdue
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {task.title}
        </p>
        {task.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
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
          {/* Edit + Delete buttons — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEdit}
                aria-label="Edit task"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onDelete}
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default KanbanPageRoute;
