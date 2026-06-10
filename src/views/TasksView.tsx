"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Columns,
  Eye,
  ImageIcon,
  Inbox,
  LayoutGrid,
  List,
  ListChecks,
  MapPin,
  MoreHorizontal,
  Move,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { toast } from "sonner";
import {
  tasksService,
  type TaskItem,
  type TaskSummary } from "@/services/tasksService";
import { TaskBoard } from "@/views/TaskBoard";

const ALL = "__all__";
const PER_PAGE = 15;
const MAX_PAGE_BUTTONS = 7; // odd number — keeps current centred

const STATUSES = [
  "new",
  "pending",
  "assigned",
  "in_progress",
  "pending_verification",
  "completed",
  "closed",
  "on_hold",
  "cancelled",
] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const TYPES = [
  "violation_response",
  "ai_generated",
  "manual",
  "maintenance",
] as const;

// ─── Numbered Pagination ──────────────────────────────────────────────────────

function NumberedPagination({
  page,
  totalPages,
  total,
  start,
  end,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (p: number) => void;
}) {
  const { t } = useTranslation();

  // Build the array of page numbers / ellipses to render
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] =
    React.useMemo(() => {
      if (totalPages <= MAX_PAGE_BUTTONS) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      const half = Math.floor(MAX_PAGE_BUTTONS / 2);
      let start = Math.max(2, page - half);
      let end = Math.min(totalPages - 1, page + half);

      // Clamp so we always show MAX_PAGE_BUTTONS - 2 middle pages
      if (page - 1 <= half)
        end = Math.min(totalPages - 1, MAX_PAGE_BUTTONS - 2);
      if (totalPages - page <= half)
        start = Math.max(2, totalPages - MAX_PAGE_BUTTONS + 3);

      const result: (number | "ellipsis-start" | "ellipsis-end")[] = [1];
      if (start > 2) result.push("ellipsis-start");
      for (let i = start; i <= end; i++) result.push(i);
      if (end < totalPages - 1) result.push("ellipsis-end");
      result.push(totalPages);
      return result;
    }, [page, totalPages]);

  if (totalPages <= 1) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("tasks.pageInfo", "{{start}}–{{end}} of {{total}}", {
          start,
          end,
          total,
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {t("tasks.pageInfo", "{{start}}–{{end}} of {{total}}", {
          start,
          end,
          total,
        })}
      </p>

      <nav
        className="inline-flex items-center gap-1"
        aria-label="Pagination"
      >
        {/* Prev */}
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === "ellipsis-start" || p === "ellipsis-end" ? (
            <span
              key={p}
              className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
              aria-hidden
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={`page-${p}`}
              size="icon"
              variant={p === page ? "default" : "outline"}
              className="h-8 w-8 text-sm"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </nav>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function TasksView() {
  const { t, i18n } = useTranslation();
  const can = usePermission("tasks");
  const qc = useQueryClient();

  const [page, setPage] = React.useState(1);
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } = useDebounceSearch("", 300);
  const [status, setStatus] = React.useState(ALL);
  const [type, setType] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"table" | "board">("table");
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<TaskItem | null>(null);
  const EMPTY_TASK = {
    name: "", description: "", priority: "medium", type: "manual", status: "pending",
    scheduled_date: "", branch_id: "", department_id: "",
    time: "",
    recurring_every_days: "",
    start_date: "", end_date: "",
    assigned_user_ids: [] as string[],
    is_draft: false,
  };
  const [taskForm, setTaskForm] = React.useState<typeof EMPTY_TASK>(EMPTY_TASK);

  function openCreateTask() { setEditingTask(null); setTaskForm(EMPTY_TASK); setTaskOpen(true); }

  // Auto-open create dialog when navigated with ?action=create
  const searchParams = useSearchParams();
  React.useEffect(() => {
    if (searchParams?.get("action") === "create") {
      openCreateTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  function openEditTask(t: TaskItem) {
    setEditingTask(t);
    setTaskForm({
      name: t.title,
      description: t.description ?? "",
      priority: t.priority,
      type: t.type,
      status: t.status,
      scheduled_date: t.scheduledDate ?? t.dueDate ?? "",
      branch_id: t.branchIds?.[0] ?? "",
      department_id: t.departmentId ?? "",
      time: t.time ?? "",
      recurring_every_days: t.recurringEveryDays ? String(t.recurringEveryDays) : "",
      start_date: t.startDate ?? "",
      end_date: t.endDate ?? "",
      assigned_user_ids: t.assignedUserIds ?? (t.assignedTo?.id ? [t.assignedTo.id] : []),
      is_draft: t.isDraft ?? false,
    });
    setTaskOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof tasksService.create>[0] = {
        name: taskForm.name,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        type: taskForm.type,
        status: taskForm.status,
        scheduled_date: taskForm.scheduled_date || undefined,
        branch_ids: taskForm.branch_id ? [taskForm.branch_id] : undefined,
        department_id: taskForm.department_id || undefined,
        time: taskForm.time || undefined,
        // Recurring fields — only send when type is "recurring"
        ...(taskForm.type === "recurring" && taskForm.recurring_every_days
          ? { recurring_every_days: Number(taskForm.recurring_every_days) }
          : {}),
        ...(taskForm.type === "recurring" && taskForm.start_date
          ? { start_date: taskForm.start_date }
          : {}),
        ...(taskForm.type === "recurring" && taskForm.end_date
          ? { end_date: taskForm.end_date }
          : {}),
        assigned_user_ids: taskForm.assigned_user_ids.length ? taskForm.assigned_user_ids : undefined,
        is_draft: taskForm.is_draft ? 1 : 0,
      };
      return editingTask
        ? tasksService.update({ ...payload, id: editingTask.id })
        : tasksService.create(payload);
    },
    onSuccess: () => {
      invalidate();
      setTaskOpen(false);
      toast.success(editingTask ? t("tasks.updateSuccess", "Task updated") : t("tasks.createSuccess", "Task created"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filters = React.useMemo(
    () => ({
      page,
      perPage: PER_PAGE,
      search: debouncedSearch || undefined,
      status: status === ALL ? undefined : status,
      type: type === ALL ? undefined : type,
      priority: priority === ALL ? undefined : priority,
      branchId: branchId ?? undefined,
    }),
    [page, debouncedSearch, status, type, priority, branchId]
  );

  const dashQ = useQuery({
    queryKey: ["tasks", "dashboard"],
    queryFn: () => tasksService.dashboard(),
    refetchInterval: 30000,
  });
  const dataQ = useQuery({
    queryKey: ["tasks", "list", filters],
    queryFn: () => tasksService.list(filters),
    refetchInterval: 20000,
  });

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type, priority, branchId]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks", "list"] });
    qc.invalidateQueries({ queryKey: ["tasks", "dashboard"] });
  };

  const deleteM = useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast.success(t("tasks.deleteSuccess", "Task deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusM = useMutation({
    mutationFn: (p: { id: string; status: string }) =>
      tasksService.updateStatus(p.id, p.status),
    onSuccess: () => {
      invalidate();
      toast.success(t("tasks.statusUpdated", "Status updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = dataQ.data?.items ?? [];
  const total = dataQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const rangeStart = items.length ? (page - 1) * PER_PAGE + 1 : 0;
  const rangeEnd = Math.min(page * PER_PAGE, total);

  const summary = dashQ.data ??
    dataQ.data?.summary ?? {
      total: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    };

  const locale = i18n.language === "ar" ? "ar" : "en";
  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ── Column definitions for shared DataTable ────────────────────────────────
  const columns: DataTableColumn<TaskItem>[] = [
    {
      key: "title",
      header: t("tasks.col.title", "Title"),
      headClassName: "uppercase min-w-[280px]",
      render: (task) => (
        <div className="flex items-center gap-3">
          {task.image ? (
            <img
              src={task.image}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <span className="line-clamp-2 max-w-[260px] text-sm font-medium">
            {task.title}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: t("tasks.col.type", "Type"),
      headClassName: "uppercase w-[160px]",
      render: (task) => (
        <Badge
          variant="outline"
          className="text-xs capitalize"
        >
          {task.type.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: t("tasks.col.priority", "Priority"),
      headClassName: "uppercase w-[100px]",
      render: (task) => (
        <Badge
          className={cn("capitalize", priorityTone(task.priority))}
          variant="outline"
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("tasks.col.status", "Status"),
      headClassName: "uppercase w-[155px]",
      cellClassName: "w-[155px]",
      render: (task) => (
        <StatusDropdown
          status={task.status}
          onSelect={(s) => statusM.mutate({ id: task.id, status: s })}
        />
      ),
    },
    {
      key: "assignedTo",
      header: t("tasks.col.assignedTo", "Assigned To"),
      headClassName: "uppercase w-[160px]",
      render: (task) => {
        const initial = task.assignedTo?.name?.charAt(0)?.toUpperCase() ?? "?";
        return task.assignedTo ? (
          <span className="inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initial}
            </span>
            <span className="text-sm">{task.assignedTo.name}</span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "branch",
      header: t("tasks.col.branch", "Branch"),
      headClassName: "uppercase w-[130px]",
      render: (task) => (
        <span className="text-sm">{task.branch?.name ?? "—"}</span>
      ),
    },
    {
      key: "dueDate",
      header: t("tasks.col.dueDate", "Due Date"),
      headClassName: "uppercase w-[110px]",
      render: (task) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(task.dueDate)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("tasks.col.actions", "Actions"),
      headClassName: "uppercase text-end w-[80px]",
      cellClassName: "text-end w-[80px]",
      render: (task) => (
        <div className="inline-flex items-center justify-end gap-0.5">
          {can.update && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Edit"
            onClick={() => openEditTask(task)}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          )}
          {can.delete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeleteId(task.id)}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">
            {t("tasks.managementTitle", "Task Management")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("tasks.subtitle", "Track, assign and resolve operational tasks")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted/30 p-1">
            <Button
              size="sm"
              variant={view === "table" ? "default" : "ghost"}
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={view === "board" ? "default" : "ghost"}
              onClick={() => setView("board")}
              aria-label="Board view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dataQ.refetch()}
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn("h-4 w-4", dataQ.isFetching && "animate-spin")}
            />
          </Button>
          {can.create && (
          <Button size="sm" className="gap-1.5" onClick={openCreateTask}>
            <Plus className="h-4 w-4" />
            {t("tasks.newTask", "New Task")}
          </Button>
          )}
        </div>
      </header>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          tone="primary"
          label={t("tasks.totalTasks", "Total Tasks")}
          value={summary.total}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          tone="warn"
          label={t("tasks.inProgress", "In Progress")}
          value={summary.inProgress}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="success"
          label={t("tasks.completed", "Completed")}
          value={summary.completed}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
          label={t("tasks.overdue", "Overdue")}
          value={summary.overdue}
        />
      </div>

      {/* ── Dashboard Breakdown ── */}
      {dashQ.data && <DashboardBreakdown summary={dashQ.data} />}

      {/* ── Filters ── */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="lg:col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("tasks.search", "Search")}
              </label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("tasks.searchPlaceholder", "Search tasks...")}
                  className="ps-9"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("tasks.status", "Status")}
              </label>
              <FilterSelect
                value={status}
                onChange={setStatus}
                placeholder={t("tasks.all", "All Statuses")}
                options={STATUSES.map((s) => ({
                  value: s,
                  label: statusLabel(s),
                }))}
                allLabel={t("tasks.allStatuses", "All Statuses")}
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("tasks.type", "Type")}
              </label>
              <FilterSelect
                value={type}
                onChange={setType}
                placeholder={t("tasks.allTypes", "All Types")}
                options={TYPES.map((s) => ({
                  value: s,
                  label: s
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" "),
                }))}
                allLabel={t("tasks.allTypes", "All Types")}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("tasks.priority", "Priority")}
              </label>
              <FilterSelect
                value={priority}
                onChange={setPriority}
                placeholder={t("tasks.allPriorities", "All Priorities")}
                options={PRIORITIES.map((s) => ({
                  value: s,
                  label: s.charAt(0).toUpperCase() + s.slice(1),
                }))}
                allLabel={t("tasks.allPriorities", "All Priorities")}
              />
            </div>

            {/* Branch */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("tasks.branch", "Branch")}
              </label>
              <AsyncPaginatedSelect
                endpoint="/customer/branches"
                extraParams={{ active: 1 }}
                value={branchId}
                onChange={setBranchId}
                placeholder={t("tasks.allBranches", "All Branches")}
                isClearable
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table / Board ── */}
      {view === "table" ? (
        <>
          <DataTable<TaskItem>
            columns={columns}
            data={items as (TaskItem & { id: string | number })[]}
            isLoading={dataQ.isLoading}
            isError={dataQ.isError}
            errorMessage={t("tasks.loadError", "Failed to load tasks")}
            emptyMessage={t("tasks.empty", "No tasks found")}
          />

          <NumberedPagination
            page={page}
            totalPages={totalPages}
            total={total}
            start={rangeStart}
            end={rangeEnd}
            onPageChange={setPage}
          />
        </>
      ) : (
        <TaskBoard
          tasks={items}
          isLoading={dataQ.isLoading}
          summary={summary}
          formatDate={formatDate}
          onMove={(id, newStatus) => statusM.mutate({ id, status: newStatus })}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("tasks.deleteTitle", "Delete task?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("tasks.deleteDesc", "This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteM.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create / Edit Task Dialog ── */}
      <Dialog open={taskOpen} onOpenChange={(o) => { if (!saveMutation.isPending) setTaskOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? t("tasks.editTask", "Edit Task") : t("tasks.newTask", "New Task")}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto py-2 pr-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>{t("tasks.form.name", "Task Name")} <span className="text-destructive">*</span></Label>
              <Input
                value={taskForm.name}
                onChange={(e) => setTaskForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("tasks.form.namePlaceholder", "Enter task name")}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>{t("tasks.form.description", "Description")}</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("tasks.form.descPlaceholder", "Task description...")}
                rows={2}
              />
            </div>

            {/* Priority + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("tasks.form.priority", "Priority")}</Label>
                <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tasks.form.type", "Type")}</Label>
                <Select value={taskForm.type} onValueChange={(v) => setTaskForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((tp) => <SelectItem key={tp} value={tp}>{tp.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status + Scheduled Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("tasks.form.status", "Status")}</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tasks.form.scheduledDate", "Scheduled Date")}</Label>
                <Input type="date" value={taskForm.scheduled_date} onChange={(e) => setTaskForm((f) => ({ ...f, scheduled_date: e.target.value }))} />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <Label>{t("tasks.form.time", "Time")}</Label>
              <Input type="time" value={taskForm.time} onChange={(e) => setTaskForm((f) => ({ ...f, time: e.target.value }))} />
            </div>

            {/* Recurring fields — only shown when type is "recurring" */}
            {taskForm.type === "recurring" && (
              <div className="rounded-lg border border-dashed border-amber-400/60 bg-amber-500/5 p-3 space-y-3">
                <p className="text-xs font-semibold text-amber-600">{t("tasks.form.recurringSettings", "Recurring Settings")}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("tasks.form.everyDays", "Every (days)")}</Label>
                    <Input type="number" min={1} value={taskForm.recurring_every_days} onChange={(e) => setTaskForm((f) => ({ ...f, recurring_every_days: e.target.value }))} placeholder="7" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("tasks.form.startDate", "Start Date")}</Label>
                    <Input type="date" value={taskForm.start_date} onChange={(e) => setTaskForm((f) => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("tasks.form.endDate", "End Date")}</Label>
                    <Input type="date" value={taskForm.end_date} onChange={(e) => setTaskForm((f) => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Branch */}
            <div className="space-y-1.5">
              <Label>{t("tasks.form.branch", "Branch")}</Label>
              <AsyncPaginatedSelect
                endpoint="/customer/branches"
                extraParams={{ active: 1 }}
                labelKey="name"
                valueKey="id"
                value={taskForm.branch_id || null}
                onChange={(opt) => setTaskForm((f) => ({ ...f, branch_id: opt ?? "" }))}
                placeholder={t("common.selectBranch", "Select branch")}
                isClearable
              />
            </div>

            {/* Assign To (multi-employee) */}
            <div className="space-y-1.5">
              <Label>{t("tasks.form.assignTo", "Assign To")}</Label>
              <AsyncPaginatedSelect
                endpoint="/customer/employees"
                labelKey="name_en"
                valueKey="id"
                value={taskForm.assigned_user_ids[0] ?? null}
                onChange={(v) => setTaskForm((f) => ({ ...f, assigned_user_ids: v ? [v] : [] }))}
                placeholder={t("tasks.form.selectEmployee", "Select employee")}
                isClearable
              />
              <p className="text-[10px] text-muted-foreground">{t("tasks.form.assignNote", "For multi-assign, use the full task editor")}</p>
            </div>

            {/* Save as draft toggle */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <input
                id="is_draft"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={taskForm.is_draft}
                onChange={(e) => setTaskForm((f) => ({ ...f, is_draft: e.target.checked }))}
              />
              <label htmlFor="is_draft" className="text-sm font-medium cursor-pointer select-none">
                {t("tasks.form.saveAsDraft", "Save as draft")}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)} disabled={saveMutation.isPending}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!taskForm.name.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {editingTask ? t("common.save", "Save") : t("tasks.createTask", "Create Task")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityTone(p: string) {
  if (p === "urgent") return "bg-destructive text-destructive-foreground";
  if (p === "high")
    return "bg-orange-500/15 text-orange-600 border-orange-500/30";
  if (p === "medium") return "bg-cyan-500/15 text-cyan-600 border-cyan-500/30";
  return "bg-muted text-muted-foreground";
}

function statusTone(s: string) {
  if (s === "completed")
    return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (s === "in_progress")
    return "bg-blue-500/15 text-blue-600 border-blue-500/30";
  if (s === "assigned")
    return "bg-violet-500/15 text-violet-600 border-violet-500/30";
  if (s === "cancelled")
    return "bg-destructive/10 text-destructive border-destructive/30";
  return "bg-muted text-muted-foreground";
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "primary" | "warn" | "success" | "danger";
}) {
  const tones: Record<string, string> = {
    primary: "bg-indigo-500/10 text-indigo-600",
    warn: "bg-amber-500/10 text-amber-600",
    success: "bg-emerald-500/10 text-emerald-600",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            tones[tone]
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── FilterSelect (simple enum selects) ──────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  allLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

const ALL_STATUS_DOTS: Record<string, string> = {
  pending: "bg-slate-500",
  assigned: "bg-violet-500",
  in_progress: "bg-amber-500",
  pending_verification: "bg-orange-500",
  completed: "bg-emerald-500",
  closed: "bg-slate-500",
  on_hold: "bg-rose-500",
  cancelled: "bg-destructive",
};

function StatusDropdown({
  status,
  onSelect,
}: {
  status: string;
  onSelect: (s: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition hover:opacity-80",
            statusTone(status)
          )}
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              ALL_STATUS_DOTS[status] ?? "bg-slate-400"
            )}
          />
          {statusLabel(status)}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(ALL_STATUS_DOTS).map(([val, dot]) => (
          <DropdownMenuItem
            key={val}
            onClick={() => onSelect(val)}
            className="gap-2 capitalize"
          >
            <span className={cn("h-2 w-2 rounded-full", dot)} />
            {statusLabel(val)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Dashboard Breakdown ──────────────────────────────────────────────────────

function BreakdownBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium capitalize">
          {label.replace(/_/g, " ")}
        </span>
        <span className="text-muted-foreground">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DashboardBreakdown({ summary }: { summary: TaskSummary }) {
  const { t } = useTranslation();
  const total = summary.total || 1;
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("tasks.breakdown", "Task Breakdown")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(summary.byStatus ?? {}).map(([k, v]) => (
            <BreakdownBar
              key={k}
              label={k}
              value={v}
              total={total}
              tone={
                k === "completed"
                  ? "bg-emerald-500"
                  : k === "in_progress"
                    ? "bg-blue-500"
                    : k === "cancelled"
                      ? "bg-destructive"
                      : "bg-slate-400"
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
