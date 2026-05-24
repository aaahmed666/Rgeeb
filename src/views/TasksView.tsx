"use client";

import * as React from "react";
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
  Zap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { cn } from "@/lib/utils";
import { tasksService, type TaskItem } from "@/services/tasksService";

const ALL = "__all__";
const PER_PAGE = 15;
const MAX_PAGE_BUTTONS = 7; // odd number — keeps current centred

const STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
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
  const qc = useQueryClient();

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState(ALL);
  const [type, setType] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"table" | "board">("table");

  const filters = React.useMemo(
    () => ({
      page,
      perPage: PER_PAGE,
      search: search || undefined,
      status: status === ALL ? undefined : status,
      type: type === ALL ? undefined : type,
      priority: priority === ALL ? undefined : priority,
      branchId: branchId ?? undefined,
    }),
    [page, search, status, type, priority, branchId]
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
  }, [search, status, type, priority, branchId]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks", "list"] });
    qc.invalidateQueries({ queryKey: ["tasks", "dashboard"] });
  };

  const deleteM = useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
    },
  });

  const statusM = useMutation({
    mutationFn: (p: { id: string; status: string }) =>
      tasksService.updateStatus(p.id, p.status),
    onSuccess: invalidate,
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeleteId(task.id)}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
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
                  onChange={(e) => setSearch(e.target.value)}
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

// ─── Kanban Board ─────────────────────────────────────────────────────────────

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

function TaskBoard({
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
  const [dragOver, setDragOver] = React.useState<string | null>(null);
  const total = tasks.length || summary.total;
  const completedPct =
    total > 0 ? Math.round((summary.completed / total) * 100) : 0;

  const grouped = React.useMemo(() => {
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
  const tone =
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
            className={cn("h-5 px-1.5 text-[10px] capitalize", tone)}
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

// ─── Status Dropdown ──────────────────────────────────────────────────────────

const ALL_STATUSES = [
  { value: "new", dot: "bg-blue-500" },
  { value: "assigned", dot: "bg-violet-500" },
  { value: "in_progress", dot: "bg-amber-500" },
  { value: "pending_verification", dot: "bg-orange-500" },
  { value: "completed", dot: "bg-emerald-500" },
  { value: "closed", dot: "bg-slate-500" },
  { value: "on_hold", dot: "bg-rose-500" },
  { value: "cancelled", dot: "bg-destructive" },
] as const;

function statusLabel(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * StatusDropdown — compact icon trigger used inside the Actions column.
 * Shows the current status dot + label and a small caret.
 * Selecting a new status calls onSelect(newStatus).
 */
function StatusDropdown({
  status,
  onSelect,
}: {
  status: string;
  onSelect: (s: string) => void;
}) {
  const meta = ALL_STATUSES.find((s) => s.value === status);
  const dot = meta?.dot ?? "bg-slate-400";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
            "transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            statusTone(status)
          )}
          aria-label="Change status"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
          <span className="whitespace-nowrap">{statusLabel(status)}</span>
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48"
      >
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            className={cn(
              "flex items-center gap-2 text-sm",
              s.value === status && "font-semibold bg-accent"
            )}
            onSelect={() => s.value !== status && onSelect(s.value)}
          >
            <span className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
            {statusLabel(s.value)}
            {s.value === status && (
              <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── StatusBadge (read-only pill shown in the Status column) ─────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = ALL_STATUSES.find((s) => s.value === status);
  const dot = meta?.dot ?? "bg-slate-400";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusTone(status)
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      {statusLabel(status)}
    </span>
  );
}

// ─── Dashboard Breakdown ──────────────────────────────────────────────────────

const STATUS_META: Record<string, { dot: string; bg: string; text: string }> = {
  new: { dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-600" },
  assigned: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-600",
  },
  in_progress: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
  },
  pending_verification: {
    dot: "bg-orange-500",
    bg: "bg-orange-500/10",
    text: "text-orange-600",
  },
  completed: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
  },
  closed: {
    dot: "bg-slate-500",
    bg: "bg-slate-500/10",
    text: "text-slate-600",
  },
  on_hold: { dot: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-600" },
  cancelled: { dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-600" },
};

const TYPE_META: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string }
> = {
  violation_response: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    bg: "bg-rose-500/10",
    text: "text-rose-600",
  },
  ai_generated: {
    icon: <Zap className="h-3.5 w-3.5" />,
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
  },
  manual: {
    icon: <Pencil className="h-3.5 w-3.5" />,
    bg: "bg-slate-500/10",
    text: "text-slate-600",
  },
  recurring: {
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    bg: "bg-teal-500/10",
    text: "text-teal-600",
  },
  maintenance: {
    icon: <Activity className="h-3.5 w-3.5" />,
    bg: "bg-cyan-500/10",
    text: "text-cyan-600",
  },
};

const PRIORITY_META: Record<string, { bar: string; text: string; bg: string }> =
  {
    critical: { bar: "bg-red-600", text: "text-red-600", bg: "bg-red-600/10" },
    urgent: {
      bar: "bg-destructive",
      text: "text-destructive",
      bg: "bg-destructive/10",
    },
    high: {
      bar: "bg-orange-500",
      text: "text-orange-600",
      bg: "bg-orange-500/10",
    },
    medium: { bar: "bg-cyan-500", text: "text-cyan-600", bg: "bg-cyan-500/10" },
    low: { bar: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-400/10" },
  };

function BreakdownBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DashboardBreakdown({
  summary,
}: {
  summary: import("@/services/tasksService").TaskSummary;
}) {
  const { byStatus, byType, byPriority, total } = summary;

  const statusEntries = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const typeEntries = Object.entries(byType)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const priorityEntries = Object.entries(byPriority)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const maxType = Math.max(...typeEntries.map(([, v]) => v), 1);
  const maxPriority = Math.max(...priorityEntries.map(([, v]) => v), 1);

  if (
    statusEntries.length === 0 &&
    typeEntries.length === 0 &&
    priorityEntries.length === 0
  )
    return null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── By Status ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <CircleDot className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">By Status</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {statusEntries.length} types
            </span>
          </div>
          <div className="divide-y">
            {statusEntries.map(([key, count]) => {
              const m = STATUS_META[key] ?? {
                dot: "bg-slate-400",
                bg: "bg-slate-400/10",
                text: "text-slate-600",
              };
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                      m.bg,
                      m.text
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                  </span>
                  <span className="flex-1 text-sm capitalize">
                    {statusLabel(key)}
                  </span>
                  <span
                    className={cn("text-xs font-semibold tabular-nums", m.text)}
                  >
                    {count.toLocaleString()}
                  </span>
                  <span className="w-9 text-end text-[11px] text-muted-foreground">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── By Type ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <Tag className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">By Type</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {typeEntries.length} types
            </span>
          </div>
          <div className="divide-y">
            {typeEntries.map(([key, count]) => {
              const m = TYPE_META[key] ?? {
                icon: <Activity className="h-3.5 w-3.5" />,
                bg: "bg-slate-500/10",
                text: "text-slate-600",
              };
              const label = key
                .split("_")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              return (
                <div
                  key={key}
                  className="px-4 py-2.5 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        m.bg,
                        m.text
                      )}
                    >
                      {m.icon}
                    </span>
                    <span className="flex-1 text-sm">{label}</span>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        m.text
                      )}
                    >
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <BreakdownBar
                    value={count}
                    max={maxType}
                    color={m.text
                      .replace("text-", "bg-")
                      .replace("-600", "-500")}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── By Priority ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">By Priority</span>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {priorityEntries.length} levels
            </span>
          </div>
          <div className="divide-y">
            {priorityEntries.map(([key, count]) => {
              const m = PRIORITY_META[key] ?? {
                bar: "bg-slate-400",
                text: "text-slate-500",
                bg: "bg-slate-400/10",
              };
              return (
                <div
                  key={key}
                  className="px-4 py-2.5 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-wide",
                        m.bg,
                        m.text
                      )}
                    >
                      {key.charAt(0)}
                    </span>
                    <span className="flex-1 text-sm capitalize">{key}</span>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        m.text
                      )}
                    >
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <BreakdownBar
                    value={count}
                    max={maxPriority}
                    color={m.bar}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
