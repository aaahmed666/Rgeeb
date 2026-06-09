"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Database,
  CheckCircle2,
  Copy,
  PercentCircle,
  Plus,
  Pencil,
  Trash2,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DataTable } from "@/components/ui/data-table";
import { fetchAiServices } from "@/services/taskRulesService";
import {
  createTaskRule,
  deleteTaskRule,
  fetchTaskRuleStats,
  fetchTaskRules,
  updateTaskRule,
  type RulePriority,
  type RuleTaskType,
  type TaskRule,
  type TaskRuleInput,
} from "@/services/taskRulesService";

const PRIORITY_TONE: Record<RulePriority, string> = {
  low: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50",
  medium:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50",
  high: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50",
  critical:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50",
};

const TASK_TYPE_TONE: Record<string, string> = {
  ai_generated:
    "border-cyan-200 text-cyan-700 dark:border-cyan-900/50 dark:text-cyan-300",
  violation_response:
    "border-red-200 text-red-700 dark:border-red-900/50 dark:text-red-300",
  manual:
    "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
};

export default function AiTaskRulesView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const can = usePermission("ai_task_rules");
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TaskRule | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskRule | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);

  const rulesQ = useQuery({
    queryKey: ["task-rules"],
    queryFn: fetchTaskRules,
  });
  const statsQ = useQuery({
    queryKey: ["task-rules-stats"],
    queryFn: fetchTaskRuleStats,
  });
  const servicesQ = useQuery({
    queryKey: ["ai-services"],
    queryFn: fetchAiServices,
  });

  const rules = rulesQ.data ?? [];
  const stats = statsQ.data;

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => r.serviceName.toLowerCase().includes(q));
  }, [rules, debouncedSearch]);

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateTaskRule(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteTaskRule(id),
    onSuccess: () => {
      toast.success(t("rules.deleted", "Rule deleted"));
      qc.invalidateQueries({ queryKey: ["task-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeCount = rules.filter((r) => r.enabled).length;

  // Permission read guard
  if (!hasPermission("ai_task_rules")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground">{t("common.noPermission", "You don\'t have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 p-3 text-white shadow-lg">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold sm:text-xl">
            {t("rules.title", "AI Task Generation Rules")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "rules.subtitle",
              "Configure which AI detections automatically create tasks. Each rule maps a service to task creation settings."
            )}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Database}
          tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
          label={t("rules.totalProcessed", "Total Processed")}
          value={stats?.totalProcessed ?? "—"}
        />
        <StatCard
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
          label={t("rules.tasksCreated", "Tasks Created")}
          value={stats?.tasksCreated ?? "—"}
        />
        <StatCard
          icon={Copy}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
          label={t("rules.deduplicated", "Deduplicated")}
          value={stats?.deduplicated ?? "—"}
        />
        <StatCard
          icon={PercentCircle}
          tone="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
          label={t("rules.dedupRate", "Dedup Rate")}
          value={stats ? `${stats.dedupRate.toFixed(1)}%` : "—"}
        />
      </div>

      <Card className="border-border/60 shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-sm font-semibold">
            {t("rules.active", "Active Rules")} ({activeCount}/{rules.length})
          </div>
          {can.create && (
          <Button
            className="gap-2"
            onClick={() => setEditing("new")}
          >
            <Plus className="h-4 w-4" />
            {t("rules.addRule", "Add Rule")}
          </Button>
          )}
        </div>
        <CardContent className="p-0">
          <DataTable
            data={filtered}
            isLoading={rulesQ.isLoading}
            isError={rulesQ.isError}
            errorMessage={rulesQ.error instanceof Error ? rulesQ.error.message : undefined}
            emptyMessage={t("rules.empty", "No rules yet")}
            columns={[
              {
                key: "enabled",
                header: t("rules.col.enabled", "Enabled"),
                render: (r) => (
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => toggle.mutate({ id: r.id, enabled: v })}
                  />
                ),
              },
              {
                key: "serviceName",
                header: t("rules.col.service", "Service"),
                render: (r) => (
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-violet-500">⚛</span>
                    {r.serviceName}
                  </div>
                ),
              },
              {
                key: "taskType",
                header: t("rules.col.taskType", "Task Type"),
                render: (r) => (
                  <Badge variant="outline" className={cn("rounded-full font-mono text-xs", TASK_TYPE_TONE[r.taskType] ?? TASK_TYPE_TONE.manual)}>
                    {r.taskType}
                  </Badge>
                ),
              },
              {
                key: "priority",
                header: t("rules.col.priority", "Priority"),
                render: (r) => (
                  <Badge variant="outline" className={cn("rounded-full capitalize", PRIORITY_TONE[r.priority])}>
                    {r.priority}
                  </Badge>
                ),
              },
              {
                key: "slaMinutes",
                header: t("rules.col.sla", "SLA (min)"),
                render: (r) => <span className="tabular-nums">{r.slaMinutes} min</span>,
              },
              {
                key: "dedupMinutes",
                header: t("rules.col.dedup", "Dedup (min)"),
                render: (r) => <span className="tabular-nums">{r.dedupMinutes} min</span>,
              },
              {
                key: "autoAssign",
                header: t("rules.col.autoAssign", "Auto-Assign"),
                render: (r) => (
                  <Badge variant="outline" className={cn("rounded-full", r.autoAssign ? "border-emerald-200 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300" : "border-slate-200 text-slate-500 dark:border-slate-700")}>
                    {r.autoAssign ? t("common.yes", "Yes") : t("common.no", "No")}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: t("rules.col.actions", "Actions"),
                headClassName: "text-end",
                cellClassName: "text-end",
                render: (r) => (
                  <div className="flex justify-end gap-1">
                    {can.update && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can.delete && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-muted/30">
        <CardContent className="flex gap-3 p-4 sm:p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <div className="text-sm font-semibold">
              {t("rules.howTitle", "How it works")}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "rules.howDesc",
                "When an AI worker sends a detection event, the system checks if a rule exists for that service. If enabled, a task is automatically created with the configured priority, SLA deadline, and assignee. Deduplication prevents duplicate tasks within the configured time window."
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <RuleDialog
          rule={editing === "new" ? null : editing}
          services={servicesQ.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("rules.confirmDeleteTitle", "Delete Rule")}
        description={t(
          "rules.confirmDeleteDesc",
          "Are you sure you want to delete this rule? This action cannot be undone."
        )}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={() => {
          if (deleteTarget) del.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            tone
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleDialog({
  rule,
  services,
  onClose,
}: {
  rule: TaskRule | null;
  services: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<TaskRuleInput>(() => ({
    service_id: rule?.serviceId ?? services[0]?.id ?? "",
    enabled: rule?.enabled ?? true,
    task_type: rule?.taskType ?? "ai_generated",
    priority: rule?.priority ?? "medium",
    sla_minutes: rule?.slaMinutes ?? 30,
    dedup_minutes: rule?.dedupMinutes ?? 30,
    auto_assign: rule?.autoAssign ?? true,
  }));

  const mut = useMutation({
    mutationFn: () =>
      rule ? updateTaskRule(rule.id, form) : createTaskRule(form),
    onSuccess: () => {
      toast.success(
        rule
          ? t("rules.updated", "Rule updated")
          : t("rules.created", "Rule created")
      );
      qc.invalidateQueries({ queryKey: ["task-rules"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const taskTypes: RuleTaskType[] = [
    "ai_generated",
    "violation_response",
    "manual",
  ];
  const priorities: RulePriority[] = ["low", "medium", "high", "critical"];

  const serviceOptions = useMemo(() => {
    if (!rule) return services;
    const exists = services.some((s) => s.id === rule.serviceId);
    return exists
      ? services
      : [{ id: rule.serviceId, name: rule.serviceName }, ...services];
  }, [services, rule]);

  return (
    <Dialog
      open
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {rule
              ? t("rules.editTitle", "Edit Rule")
              : t("rules.newTitle", "New Rule")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>{t("rules.col.service", "Service")}</Label>
            <AsyncPaginatedSelect
              endpoint="/customer/services"
              labelKey="name"
              valueKey="id"
              value={form.service_id || null}
              onChange={(v) => setForm({ ...form, service_id: v ?? "" })}
              placeholder={t("rules.pickService", "Pick a service")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("rules.col.taskType", "Task Type")}</Label>
              <Select
                value={form.task_type}
                onValueChange={(v) =>
                  setForm({ ...form, task_type: v as RuleTaskType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                    >
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("rules.col.priority", "Priority")}</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm({ ...form, priority: v as RulePriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className="capitalize"
                    >
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("rules.col.sla", "SLA (min)")}</Label>
              <Input
                type="number"
                min={0}
                value={form.sla_minutes}
                onChange={(e) =>
                  setForm({ ...form, sla_minutes: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("rules.col.dedup", "Dedup (min)")}</Label>
              <Input
                type="number"
                min={0}
                value={form.dedup_minutes}
                onChange={(e) =>
                  setForm({ ...form, dedup_minutes: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">
                {t("rules.col.autoAssign", "Auto-Assign")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t(
                  "rules.autoAssignHint",
                  "Assign to the best available worker"
                )}
              </p>
            </div>
            <Switch
              checked={form.auto_assign}
              onCheckedChange={(v) => setForm({ ...form, auto_assign: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">
              {t("rules.col.enabled", "Enabled")}
            </Label>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm({ ...form, enabled: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={!form.service_id || mut.isPending}
            onClick={() => mut.mutate()}
            className="gap-2"
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
