"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  UserCheck,
  UserCog,
  ArrowUp,
  Shuffle,
  Siren,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { toast } from "sonner";
import {
  escalationService,
  type EscalationLogItem,
  type EscalationRule,
  type EscalationRuleInput,
  type NotificationItem,
} from "@/services/escalationService";

export default function EscalationAlertsView() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const isRtl = i18n.dir() === "rtl";
  const qc = useQueryClient();
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);

  const rulesQ = useQuery({
    queryKey: ["escalation", "rules"],
    queryFn: () => escalationService.rules(),
    refetchInterval: 60_000,
  });
  const notificationsQ = useQuery({
    queryKey: ["escalation", "notifications"],
    queryFn: () => escalationService.notifications(20),
    refetchInterval: 20_000,
  });
  const logQ = useQuery({
    queryKey: ["escalation", "log"],
    queryFn: () => escalationService.log(),
    refetchInterval: 30_000,
  });

  const toggleM = useMutation({
    mutationFn: ({ rule, active }: { rule: EscalationRule; active: boolean }) =>
      // The PATCH /escalation/rules/{id} endpoint does not exist (404). Like the
      // OLD project (saveEscalationRule({ ...rule, enabled })), toggling resends
      // the full rule to POST /escalation/save-rule with the flipped flag.
      escalationService.saveRule({
        id: rule.id,
        name: rule.name,
        level: parseLevel(rule.level),
        trigger_minutes: parseTriggerMinutes(rule.trigger),
        action:
          rule.actionType ||
          ACTION_OPTIONS.find((o) => o.label === rule.action)?.key ||
          rule.action ||
          "notify_manager",
        enabled: active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalation", "rules"] });
      toast.success(t("escalation.ruleUpdated", "Rule updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => escalationService.deleteRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalation", "rules"] });
      toast.success(t("escalation.ruleDeleted", "Rule deleted"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refresh = () => {
    rulesQ.refetch();
    notificationsQ.refetch();
    logQ.refetch();
  };

  // Permission read guard
  if (!hasPermission("escalation_alerts")) {
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
    <div
      className="space-y-6 p-4 md:p-6"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <Siren className="h-6 w-6 text-primary" />
            {t("escalation.title", "Escalation & Notifications")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "escalation.subtitle",
              "Configure escalation rules and review the alert log."
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={
            rulesQ.isFetching || notificationsQ.isFetching || logQ.isFetching
          }
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              (rulesQ.isFetching ||
                notificationsQ.isFetching ||
                logQ.isFetching) &&
                "animate-spin"
            )}
          />
        </Button>
      </div>

      <Tabs
        defaultValue="rules"
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="rules"
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            {t("escalation.tabRules", "Escalation Rules")}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {t("escalation.tabNotifications", "Notifications")}
            {notificationsQ.data && notificationsQ.data.length > 0 ? (
              <Badge
                variant="secondary"
                className="ms-1 h-5 px-1.5 text-[10px]"
              >
                {notificationsQ.data.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger
            value="log"
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            {t("escalation.tabLog", "Escalation Log")}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="rules"
          className="mt-4"
        >
          <RulesPanel
            rules={rulesQ.data ?? []}
            loading={rulesQ.isLoading}
            onToggle={(rule, active) => toggleM.mutate({ rule, active })}
            onDelete={(id) => deleteM.mutate(id)}
          />
        </TabsContent>

        <TabsContent
          value="notifications"
          className="mt-4"
        >
          <NotificationsPanel
            items={notificationsQ.data ?? []}
            loading={notificationsQ.isLoading}
          />
        </TabsContent>

        <TabsContent
          value="log"
          className="mt-4"
        >
          <LogPanel
            items={logQ.data ?? []}
            loading={logQ.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------------------- Rules --------------------------- */

/**
 * Action options — mirrors the OLD project's actionLabels map so the dialog
 * offers the same choices and the table can resolve a label/icon from the key.
 */
const ACTION_OPTIONS: { key: string; label: string }[] = [
  { key: "notify_assignee", label: "Remind Worker" },
  { key: "notify_manager", label: "Alert Manager" },
  { key: "reassign", label: "Reassign Task" },
  { key: "escalate_priority", label: "Bump Priority" },
  { key: "notify_admin", label: "Alert Admin" },
];

/** "L2" → 2, "2" → 2, fallback 1. */
function parseLevel(level: string): number {
  const n = parseInt(String(level).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** "+30 min" → 30, fallback 30. */
function parseTriggerMinutes(trigger: string): number {
  const n = parseInt(String(trigger).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : 30;
}

function RulesPanel({
  rules,
  loading,
  onToggle,
  onDelete,
}: {
  rules: EscalationRule[];
  loading: boolean;
  onToggle: (rule: EscalationRule, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EscalationRule | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (rule: EscalationRule) => {
    setEditing(rule);
    setDialogOpen(true);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">
          {t("escalation.rulesTitle", "Escalation Rules")}
        </h2>
        <Button
          size="sm"
          className="gap-2 shadow-sm shadow-primary/20"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4" />
          {t("escalation.addRule", "Add Rule")}
        </Button>
      </div>

      <DataTable
        data={rules}
        isLoading={loading}
        emptyMessage={t("escalation.noRules", "No rules configured yet.")}
        columns={[
          {
            key: "level",
            header: t("escalation.colLevel", "Level"),
            render: (r) => <LevelBadge level={r.level} />,
          },
          {
            key: "name",
            header: t("escalation.colName", "Name"),
            render: (r) => <span className="font-medium">{r.name}</span>,
          },
          {
            key: "trigger",
            header: t("escalation.colTrigger", "Trigger"),
            render: (r) => (
              <span className="text-muted-foreground">{r.trigger}</span>
            ),
          },
          {
            key: "action",
            header: t("escalation.colAction", "Action"),
            render: (r) => (
              <ActionLabel
                action={r.action}
                type={r.actionType}
              />
            ),
          },
          {
            key: "active",
            header: t("escalation.colActive", "Active"),
            render: (r) => (
              <Switch
                checked={r.active}
                onCheckedChange={(v) => onToggle(r, v)}
              />
            ),
          },
          {
            key: "actions",
            header: t("escalation.colActions", "Actions"),
            headClassName: "text-end",
            cellClassName: "text-end",
            render: (r) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(r)}
                >
                  <Pencil className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(r.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
      />
    </Card>
  );
}

/* --------------------------- Rule Dialog (create / edit) --------------------------- */

function RuleDialog({
  open,
  onOpenChange,
  rule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: EscalationRule | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = Boolean(rule);

  const [name, setName] = React.useState("");
  const [level, setLevel] = React.useState(1);
  const [triggerMinutes, setTriggerMinutes] = React.useState(30);
  const [action, setAction] = React.useState("notify_manager");
  const [enabled, setEnabled] = React.useState(true);

  // Reset / hydrate the form whenever the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    if (rule) {
      setName(rule.name ?? "");
      setLevel(parseLevel(rule.level));
      setTriggerMinutes(parseTriggerMinutes(rule.trigger));
      // Prefer the explicit action key; otherwise reverse-map from the label.
      const fromLabel = ACTION_OPTIONS.find(
        (o) => o.label === rule.action
      )?.key;
      setAction(rule.actionType || fromLabel || "notify_manager");
      setEnabled(rule.active);
    } else {
      setName("");
      setLevel(1);
      setTriggerMinutes(30);
      setAction("notify_manager");
      setEnabled(true);
    }
  }, [open, rule]);

  const mut = useMutation({
    mutationFn: () => {
      const input: EscalationRuleInput = {
        id: isEdit ? rule!.id : undefined,
        name,
        level,
        trigger_minutes: triggerMinutes,
        action,
        enabled,
      };
      return escalationService.saveRule(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalation", "rules"] });
      toast.success(
        isEdit
          ? t("escalation.ruleUpdated", "Rule updated")
          : t("escalation.ruleCreated", "Rule created")
      );
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Siren className="h-5 w-5 text-primary" />
            {isEdit
              ? t("escalation.editRule", "Edit Rule")
              : t("escalation.addRule", "Add Escalation Rule")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("escalation.ruleName", "Rule Name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(
                "escalation.ruleNamePlaceholder",
                "e.g. Level 1 - Notify Supervisor"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("escalation.level", "Escalation Level")}</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t("escalation.triggerMinutes", "Trigger (min overdue)")}
              </Label>
              <Input
                type="number"
                min={0}
                value={triggerMinutes}
                onChange={(e) => setTriggerMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("escalation.colAction", "Action")}</Label>
            <Select
              value={action}
              onValueChange={setAction}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.key}
                    value={o.key}
                  >
                    {t(`escalation.action.${o.key}`, o.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="cursor-pointer">
              {t("escalation.colActive", "Active")}
            </Label>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            className="gap-2"
            disabled={!name || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LevelBadge({ level }: { level: string }) {
  const lvl = String(level).toUpperCase();
  const tone =
    lvl === "L1"
      ? "bg-sky-500/15 text-sky-600 border-sky-500/30"
      : lvl === "L2"
        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
        : "bg-rose-500/15 text-rose-600 border-rose-500/30";
  return (
    <Badge
      variant="outline"
      className={cn("font-semibold", tone)}
    >
      {lvl}
    </Badge>
  );
}

function ActionLabel({ action, type }: { action: string; type?: string }) {
  const key = (type ?? action ?? "").toLowerCase();
  const Icon = key.includes("admin")
    ? UserCog
    : key.includes("manager") || key.includes("supervisor")
      ? UserCheck
      : key.includes("priority") || key.includes("bump")
        ? ArrowUp
        : key.includes("reassign")
          ? Shuffle
          : key.includes("remind")
            ? BellRing
            : Bell;

  const color = key.includes("admin")
    ? "text-rose-500"
    : key.includes("manager") || key.includes("supervisor")
      ? "text-amber-500"
      : key.includes("priority") || key.includes("bump")
        ? "text-orange-500"
        : key.includes("reassign")
          ? "text-violet-500"
          : "text-sky-500";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        color
      )}
    >
      <Icon className="h-4 w-4" />
      {action}
    </span>
  );
}

/* --------------------------- Notifications --------------------------- */

function NotificationsPanel({
  items,
  loading,
}: {
  items: NotificationItem[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <Card className="grid gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-md bg-muted/60"
          />
        ))}
      </Card>
    );
  }
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-12 text-center">
        <Bell className="h-10 w-10 text-muted-foreground" />
        <div className="font-medium">
          {t("escalation.noNotifications", "No notifications")}
        </div>
        <div className="text-sm text-muted-foreground">
          {t("escalation.noNotificationsHint", "You're all caught up.")}
        </div>
      </Card>
    );
  }
  return (
    <Card className="divide-y">
      {items.map((n) => (
        <div
          key={n.id}
          className="flex items-start gap-3 p-4"
        >
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              n.read
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            <BellRing className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{n.title}</span>
              {n.level ? <LevelBadge level={n.level} /> : null}
              {!n.read ? (
                <Badge className="h-5 bg-primary/15 px-1.5 text-[10px] text-primary hover:bg-primary/20">
                  {t("escalation.new", "NEW")}
                </Badge>
              ) : null}
            </div>
            {n.body ? (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {n.body}
              </p>
            ) : null}
            {n.createdAt ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDate(n.createdAt)}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </Card>
  );
}

/* --------------------------- Log --------------------------- */

function LogPanel({
  items,
  loading,
}: {
  items: EscalationLogItem[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">
          {t("escalation.logTitle", "Escalation Log")}
        </h2>
      </div>
      <DataTable
        data={items}
        isLoading={loading}
        emptyMessage={t("escalation.noLog", "No escalation events yet.")}
        columns={[
          {
            key: "level",
            header: t("escalation.colLevel", "Level"),
            render: (l) => (l.level ? <LevelBadge level={l.level} /> : "—"),
          },
          {
            key: "taskTitle",
            header: t("escalation.colTask", "Task"),
            render: (l) => (
              <span className="font-medium">
                {l.taskTitle ?? l.taskId ?? "—"}
              </span>
            ),
          },
          {
            key: "action",
            header: t("escalation.colAction", "Action"),
            render: (l) => l.action ?? "—",
          },
          {
            key: "recipient",
            header: t("escalation.colRecipient", "Recipient"),
            render: (l) => (
              <span className="text-muted-foreground">
                {l.recipient ?? "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: t("escalation.colStatus", "Status"),
            render: (l) => (
              <Badge
                variant="outline"
                className="text-xs capitalize"
              >
                {l.status ?? "—"}
              </Badge>
            ),
          },
          {
            key: "triggeredAt",
            header: t("escalation.colTime", "Time"),
            render: (l) => (
              <span className="text-xs text-muted-foreground">
                {l.triggeredAt ? formatDate(l.triggeredAt) : "—"}
              </span>
            ),
          },
        ]}
      />
    </Card>
  );
}

function formatDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
