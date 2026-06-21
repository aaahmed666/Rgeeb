"use client";

/**
 * EventTimelineView — port of the old /apps/event-timeline page.
 * Shows a chronological timeline of AI detections/events, filterable
 * by branch, camera, service type, severity, and date range.
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bell,
  Camera,
  Clock,
  Filter,
  Flame,
  RefreshCw,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";
import type { DateRange } from "rsuite/DateRangePicker";

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
import { Skeleton } from "@/components/ui/skeleton";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Detection {
  id: string | number;
  type: string;
  score?: number;
  camera?: string;
  branch?: string;
  detected_at: string;
  image?: string | null;
  data?: Record<string, unknown>;
}

interface DetectionSeverity {
  label: string;
  color: string;
  bgColor: string;
  Icon: React.ElementType;
}

const SEVERITY_MAP: Record<string, DetectionSeverity> = {
  fire: { label: "Fire", color: "text-red-600", bgColor: "bg-red-500/10 border-red-500/30", Icon: Flame },
  smoke: { label: "Smoke", color: "text-orange-600", bgColor: "bg-orange-500/10 border-orange-500/30", Icon: Flame },
  ppe: { label: "PPE Violation", color: "text-rose-600", bgColor: "bg-rose-500/10 border-rose-500/30", Icon: ShieldAlert },
  crowd: { label: "Overcrowding", color: "text-amber-600", bgColor: "bg-amber-500/10 border-amber-500/30", Icon: AlertTriangle },
  attendance: { label: "Attendance", color: "text-emerald-600", bgColor: "bg-emerald-500/10 border-emerald-500/30", Icon: Clock },
  default: { label: "Event", color: "text-indigo-600", bgColor: "bg-indigo-500/10 border-indigo-500/30", Icon: Bell },
};

function getSeverity(type: string): DetectionSeverity {
  const lower = (type || "").toLowerCase();
  for (const [key, val] of Object.entries(SEVERITY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return SEVERITY_MAP.default;
}

function formatTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchDetections(params: Record<string, string | number | undefined>) {
  const query: Record<string, string | number | boolean | undefined | null> = { ...params };
  const raw = await apiFetch<unknown>(endpoints.detections.list, { query });
  const r = raw as Record<string, unknown>;
  const arr = Array.isArray(r?.data)
    ? (r.data as unknown[])
    : Array.isArray(r?.data && (r.data as Record<string, unknown>)?.data)
    ? ((r.data as Record<string, unknown>).data as unknown[])
    : Array.isArray(raw)
    ? (raw as unknown[])
    : [];
  return arr.map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    return {
      id: String(o.id ?? Math.random()),
      type: String(o.type ?? "event"),
      score: Number(o.score ?? 0),
      camera: String(o.camera ?? o.camera_name ?? "—"),
      branch: String(o.branch ?? o.branch_name ?? "—"),
      detected_at: String(o.detected_at ?? o.created_at ?? new Date().toISOString()),
      image: (o.image ?? o.detection_image ?? null) as string | null,
      data: (o.data ?? {}) as Record<string, unknown>,
    } satisfies Detection;
  });
}

// ─── Timeline item component ──────────────────────────────────────────────────

function TimelineItem({ det, isLast }: { det: Detection; isLast: boolean }) {
  const { t } = useTranslation();
  const sev = getSeverity(det.type);
  const Icon = sev.Icon;

  return (
    <div className="flex gap-4">
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${sev.bgColor}`}>
          <Icon className={`h-4 w-4 ${sev.color}`} />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className={`mb-6 flex-1 rounded-xl border ${sev.bgColor} p-3`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className={`text-sm font-semibold capitalize ${sev.color}`}>
              {det.type.replace(/_/g, " ")}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {det.camera && (
                <span className="flex items-center gap-1">
                  <Camera className="h-3 w-3" /> {det.camera}
                </span>
              )}
              {det.branch && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> {det.branch}
                </span>
              )}
              {det.score !== undefined && det.score > 0 && (
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  {Math.round(det.score * 100)}% conf.
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-medium">{formatTimeAgo(det.detected_at)}</p>
            <p className="opacity-70">{formatDateTime(det.detected_at)}</p>
          </div>
        </div>

        {/* Detection image thumbnail */}
        {det.image && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={det.image}
              alt={t("eventTimeline.detectionAlt")}
              className="max-h-32 rounded-lg object-cover shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const ALL = "__all__";

const COMMON_TYPES = [
  "attendance", "fire", "smoke", "ppe", "kitchen_ppe", "overcrowd",
  "person", "face_detection", "behavior", "gate", "license_plate",
];

export default function EventTimelineView() {
  const { t } = useTranslation();
  const today = React.useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = React.useState<DateRange | null>([today, today]);
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [typeFilter, setTypeFilter] = React.useState(ALL);
  const [search, setSearch] = React.useState("");

  const from = dateRange?.[0]?.toISOString().slice(0, 10) ?? today.toISOString().slice(0, 10);
  const to = dateRange?.[1]?.toISOString().slice(0, 10) ?? today.toISOString().slice(0, 10);

  const query = useQuery({
    queryKey: ["event-timeline", from, to, branchId, typeFilter],
    queryFn: () =>
      fetchDetections({
        date_from: from,
        date_to: to,
        branch_id: branchId ?? undefined,
        type: typeFilter !== ALL ? typeFilter : undefined,
        per_page: 100,
      }),
    staleTime: 30_000,
  });

  const detections = React.useMemo(() => {
    let list = query.data ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.type.toLowerCase().includes(q) ||
          d.camera?.toLowerCase().includes(q) ||
          d.branch?.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) =>
        new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );
  }, [query.data, search]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg">
              {t("eventTimeline.title", "Event Timeline")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("eventTimeline.subtitle", "Chronological log of all AI detections and events")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Filter className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />

            {/* Date range */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("common.dateRange", "Date Range")}
              </span>
              <SharedDateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={t("common.selectDateRange", "Select range")}
              />
            </div>

            {/* Branch */}
            <div className="flex flex-col gap-1" style={{ minWidth: 180 }}>
              <span className="text-xs font-medium text-muted-foreground">
                {t("common.branch", "Branch")}
              </span>
              <AsyncPaginatedSelect
                endpoint="/customer/branches"
                labelKey="name"
                valueKey="id"
                value={branchId}
                onChange={setBranchId}
                placeholder={t("common.allBranches", "All Branches")}
                isClearable
              />
            </div>

            {/* Event type */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("common.type", "Type")}
              </span>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("common.all", "All Types")}</SelectItem>
                  {COMMON_TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {tp.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {t("common.search", "Search")}
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-9 ps-8"
                  placeholder={t("common.searchPlaceholder", "Camera, branch...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {query.isFetching
            ? t("common.loading", "Loading...")
            : t("eventTimeline.found", "{{n}} events found", { n: detections.length })}
        </p>
        {detections.length > 0 && (
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {detections.filter((d) => getSeverity(d.type) !== SEVERITY_MAP.default).length}{" "}
              {t("eventTimeline.alerts", "Alerts")}
            </Badge>
          </div>
        )}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {query.isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <Skeleton className="h-20 flex-1 rounded-xl" />
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("errors.loadFailed", "Failed to load events. Please try again.")}
              </p>
              <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                {t("common.retry", "Retry")}
              </Button>
            </div>
          ) : detections.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <Bell className="h-8 w-8 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium text-muted-foreground">
                {t("eventTimeline.noEvents", "No events found for the selected filters")}
              </p>
            </div>
          ) : (
            <div className="ps-2">
              {detections.map((det, idx) => (
                <TimelineItem
                  key={det.id}
                  det={det}
                  isLast={idx === detections.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
