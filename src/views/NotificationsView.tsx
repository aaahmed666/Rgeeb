"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCheck,
  RefreshCw,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Camera,
  MapPin,
  ShieldAlert,
  ArrowLeftRight,
  Clock,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  notificationsService,
  type NotificationItem,
} from "@/services/notificationsService";

type Tab = "all" | "unread" | "warning" | "detections" | "tasks";

const PER_PAGE = 20;

export default function NotificationsView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<Tab>("all");
  const [page, setPage] = React.useState(1);

  const listQ = useQuery({
    queryKey: ["notifications", "list", page],
    queryFn: () => notificationsService.list(page, PER_PAGE),
    refetchInterval: 30_000,
  });

  const unreadQ = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 30_000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(t("notifications.allRead", "All notifications marked as read"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Reset page when switching tabs
  React.useEffect(() => {
    setPage(1);
  }, [tab]);

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;
  const lastPage = listQ.data?.lastPage ?? 1;
  const unread = unreadQ.data ?? 0;

  const filtered = React.useMemo(() => {
    switch (tab) {
      case "unread":
        return items.filter((i) => !i.readAt);
      case "warning":
        return items.filter(
          (i) => i.severity === "warning" || i.severity === "critical"
        );
      case "detections":
        return items.filter((i) => i.source === "detection");
      case "tasks":
        return items.filter((i) => i.source === "task" || i.taskId != null);
      default:
        return items;
    }
  }, [items, tab]);

  // Group by date
  const grouped = React.useMemo(() => {
    const groups = new Map<string, NotificationItem[]>();
    for (const n of filtered) {
      const label = dateGroupLabel(n.createdAt);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(n);
    }
    return groups;
  }, [filtered]);

  const tabCounts: Record<Tab, number> = React.useMemo(
    () => ({
      all: items.length,
      unread: items.filter((i) => !i.readAt).length,
      warning: items.filter((i) => i.severity !== "info").length,
      detections: items.filter((i) => i.source === "detection").length,
      tasks: items.filter((i) => i.source === "task" || i.taskId != null)
        .length,
    }),
    [items]
  );

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold sm:text-xl">
              {t("notifications.title", "Notification Center")}
            </h1>
            {unread > 0 && (
              <Badge className="border-red-500/30 bg-red-500/15 text-red-600">
                {unread.toLocaleString()} {t("notifications.unread", "unread")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("notifications.subtitle", "All alerts and system notifications")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className="gap-1.5"
            >
              <Bell className="h-3 w-3" />
              {total.toLocaleString()} {t("notifications.total", "Total")}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border-sky-500/30 text-sky-600"
            >
              <BellOff className="h-3 w-3" />
              {unread} {t("notifications.unread", "Unread")}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unread === 0}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAllRead", "Mark all read")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              listQ.refetch();
              unreadQ.refetch();
            }}
            aria-label={t("tasksUi.refresh")}
          >
            <RefreshCw
              className={cn("h-4 w-4", listQ.isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
      >
        <TabsList className="bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" />
            {t("notifications.all", "All")}
            <TabCount n={tabCounts.all} />
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="gap-1.5"
          >
            <BellOff className="h-3.5 w-3.5" />
            {t("notifications.unread", "Unread")}
            <TabCount
              n={tabCounts.unread}
              active
            />
          </TabsTrigger>
          <TabsTrigger
            value="warning"
            className="gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("notifications.warnings", "Warnings")}
            <TabCount
              n={tabCounts.warning}
              warn
            />
          </TabsTrigger>
          <TabsTrigger
            value="detections"
            className="gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            {t("notifications.detections", "Detections")}
            <TabCount n={tabCounts.detections} />
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="gap-1.5"
          >
            <ListChecks className="h-3.5 w-3.5" />
            {t("notifications.tasks", "Tasks")}
            <TabCount n={tabCounts.tasks} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      <Card className="overflow-hidden">
        {listQ.isLoading ? (
          <ul className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="h-16 animate-pulse bg-muted/40"
              />
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {t("notifications.empty", "No notifications")}
          </p>
        ) : (
          Array.from(grouped.entries()).map(([dateLabel, group]) => (
            <div key={dateLabel}>
              <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {dateLabel}
              </div>
              <ul className="divide-y">
                {group.map((n) => (
                  <NotificationRow
                    key={n.id}
                    item={n}
                    onRead={() => !n.readAt && markOne.mutate(n.id)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </Card>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {t("notifications.pageInfo", "Page {{page}} of {{lastPage}}", {
              page,
              lastPage,
            })}
          </p>
          <div className="inline-flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={t("tasksUi.previous")}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <span className="px-3 text-sm">
              {page} / {lastPage}
            </span>
            <Button
              size="icon"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              aria-label={t("tasksUi.next")}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function TabCount({
  n,
  active,
  warn,
}: {
  n: number;
  active?: boolean;
  warn?: boolean;
}) {
  if (!n) return null;
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
        warn
          ? "bg-amber-500/15 text-amber-600"
          : active
            ? "bg-sky-500/15 text-sky-600"
            : "bg-muted text-muted-foreground"
      )}
    >
      {n}
    </span>
  );
}

const SEV: Record<
  NotificationItem["severity"],
  { row: string; icon: string; dot: string }
> = {
  info: {
    row: "border-l-slate-300",
    icon: "bg-slate-500/10 text-slate-500",
    dot: "bg-slate-400",
  },
  warning: {
    row: "border-l-amber-400",
    icon: "bg-amber-500/10 text-amber-600",
    dot: "bg-amber-500",
  },
  critical: {
    row: "border-l-red-500",
    icon: "bg-red-500/10 text-red-600",
    dot: "bg-red-500",
  },
};

/** Parse camera and branch from the body string: "TYPE at Camera (Branch) — Score: XX%" */
function parseBody(body: string): {
  camera?: string;
  branch?: string;
  score?: string;
  rest: string;
} {
  const match = body.match(
    /at\s+(.+?)\s+\((.+?)\)\s*(?:—\s*Score:\s*(\d+%))?/i
  );
  if (!match) return { rest: body };
  return { camera: match[1], branch: match[2], score: match[3], rest: body };
}

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("ppe") || t.includes("violation"))
    return <ShieldAlert className="h-4 w-4" />;
  if (t.includes("crossing")) return <ArrowLeftRight className="h-4 w-4" />;
  if (t.includes("wait")) return <Clock className="h-4 w-4" />;
  if (t.includes("task")) return <ListChecks className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  const sev = SEV[item.severity];
  const { camera, branch, score } = parseBody(item.body);
  const isUnread = !item.readAt;

  return (
    <li
      className={cn(
        "flex cursor-pointer items-start gap-3 border-l-4 px-4 py-3 transition-colors hover:bg-muted/30",
        isUnread ? sev.row : "border-l-transparent",
        !isUnread && "opacity-70"
      )}
      onClick={onRead}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          sev.icon
        )}
      >
        {typeIcon(item.type)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide leading-snug">
            {item.title.replace(/_/g, " ")}
          </span>
          {isUnread && (
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sev.dot)}
            />
          )}
        </div>

        {/* Camera / Branch metadata pills */}
        {(camera || branch) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {camera && (
              <span className="inline-flex items-center gap-1">
                <Camera className="h-3 w-3" /> {camera}
              </span>
            )}
            {branch && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {branch}
              </span>
            )}
            {score && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold",
                  item.severity === "warning"
                    ? "border-amber-500/30 text-amber-600"
                    : item.severity === "critical"
                      ? "border-red-500/30 text-red-600"
                      : "border-slate-500/30 text-slate-500"
                )}
              >
                {score}
              </Badge>
            )}
          </div>
        )}

        {/* Source / channel tag */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {item.source !== "system" && (
            <span className="capitalize opacity-60">{item.source}</span>
          )}
          {item.channel !== "in_app" && (
            <span className="capitalize opacity-60">· {item.channel}</span>
          )}
        </div>
      </div>

      {/* Time + read state */}
      <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] text-muted-foreground">
        <span>{relativeTime(item.createdAt)}</span>
        {item.readAt ? (
          <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <span className="text-[10px] text-sky-500 font-medium">New</span>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function dateGroupLabel(iso: string): string {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Earlier";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay.getTime() === today.getTime()) return "Today";
  if (itemDay.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
