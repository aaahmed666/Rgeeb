"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Car,
  Clock,
  UtensilsCrossed,
  Receipt,
  CircleCheck,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { cn, toLocalISODate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* API shape (mirrors the OLD project's DriveThruData)                 */
/* ------------------------------------------------------------------ */

interface DriveThruKpis {
  total_cars: number;
  prev_total_cars: number;
  avg_total_time: number;
  prev_avg_total_time: number;
  avg_service_time: number;
  avg_order_time: number;
  sla_percent: number;
  sla_met: number;
  sla_total: number;
}

interface HourlyDatum {
  hour: number;
  count: number;
  avg_time: number;
}

interface RecentCar {
  id: number | string;
  car_id: string;
  total_time: number;
  zone_durations: { entry?: number; window?: number } & Record<string, number>;
  sla_target: number;
  sla_met: boolean;
  score: number;
  image: string | null;
  detected_at: string;
  camera: string;
  branch: string;
}

interface QueueCar {
  car_id: string;
  total_time: number;
  sla_met: boolean;
}

interface DriveThruData {
  kpis: DriveThruKpis;
  hourly: HourlyDatum[];
  recent_cars: RecentCar[];
  queue_cars: QueueCar[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function num(v: unknown, def = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : def;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }
  return def;
}

/** seconds → "m:ss" (matches the OLD formatTime). */
function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(num(seconds)));
  if (s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

const EMPTY_HOURS: HourlyDatum[] = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  count: 0,
  avg_time: 0,
}));

/** Normalize the raw dashboard payload into DriveThruData with safe defaults. */
function normalize(raw: unknown): DriveThruData {
  const data = ((raw as Record<string, unknown>)?.data ?? raw ?? {}) as Record<
    string,
    unknown
  >;
  const k = (data.kpis ?? {}) as Record<string, unknown>;

  const kpis: DriveThruKpis = {
    total_cars: num(k.total_cars),
    prev_total_cars: num(k.prev_total_cars),
    avg_total_time: num(k.avg_total_time),
    prev_avg_total_time: num(k.prev_avg_total_time),
    avg_service_time: num(k.avg_service_time),
    avg_order_time: num(k.avg_order_time),
    sla_percent: num(k.sla_percent),
    sla_met: num(k.sla_met),
    sla_total: num(k.sla_total),
  };

  const hourly: HourlyDatum[] = Array.isArray(data.hourly)
    ? (data.hourly as Record<string, unknown>[]).map((h) => ({
        hour: num(h.hour),
        count: num(h.count),
        avg_time: num(h.avg_time),
      }))
    : [];

  const recent_cars: RecentCar[] = Array.isArray(data.recent_cars)
    ? (data.recent_cars as Record<string, unknown>[]).map((c, i) => ({
        id: (c.id as number | string) ?? (c.car_id as string) ?? `row-${i}`,
        car_id: String(c.car_id ?? "—"),
        total_time: num(c.total_time),
        zone_durations: (c.zone_durations ?? {}) as RecentCar["zone_durations"],
        sla_target: num(c.sla_target, 180),
        sla_met: Boolean(c.sla_met),
        score: num(c.score),
        image: (c.image as string) ?? null,
        detected_at: String(c.detected_at ?? ""),
        camera: String(c.camera ?? "—"),
        branch: String(c.branch ?? "—"),
      }))
    : [];

  const queue_cars: QueueCar[] = Array.isArray(data.queue_cars)
    ? (data.queue_cars as Record<string, unknown>[]).map((q) => ({
        car_id: String(q.car_id ?? "—"),
        total_time: num(q.total_time),
        sla_met: Boolean(q.sla_met),
      }))
    : [];

  return { kpis, hourly, recent_cars, queue_cars };
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex-1 min-w-[150px] rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {title}
      </p>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold leading-none">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SlaGauge({ percent, t }: { percent: number; t: TFunction }) {
  const pct = Math.min(100, Math.max(0, num(percent)));
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const color =
    pct >= 90 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";
  const label =
    pct >= 90
      ? t("driveThru.excellent", "Excellent")
      : pct >= 70
        ? t("driveThru.good", "Good")
        : t("driveThru.needsImprovement", "Needs Improvement");

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">
          {t("driveThru.slaAchievement", "SLA Achievement")}
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center py-2">
        <svg viewBox="0 0 128 128" className="h-32 w-32">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            className="text-muted/30"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform="rotate(-90 64 64)"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <text
            x="64"
            y="60"
            textAnchor="middle"
            className="fill-foreground"
            fontSize="22"
            fontWeight="800"
          >
            {pct}%
          </text>
          <text
            x="64"
            y="80"
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="9"
          >
            SLA
          </text>
        </svg>
        <span className="mt-2 text-sm font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main view                                                          */
/* ------------------------------------------------------------------ */

export default function DriveThruView() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const monthAgo = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);
  const [dateRange, setDateRange] = React.useState<DateRange | null>([
    monthAgo,
    new Date(),
  ]);
  const [branchId, setBranchId] = React.useState("all");
  const [deleteTarget, setDeleteTarget] = React.useState<
    string | number | null
  >(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deletedIds, setDeletedIds] = React.useState<Set<string | number>>(
    () => new Set()
  );

  const today = toLocalISODate(new Date());
  const from = dateRange ? toLocalISODate(dateRange[0]) : today;
  const to = dateRange ? toLocalISODate(dateRange[1]) : today;

  const dash = useQuery({
    queryKey: ["drive-thru-dashboard", from, to, branchId],
    queryFn: async () => {
      // Parity with the OLD project: GET /customer/drive-thru/dashboard with
      // `date_from` / `date_to` (and optional branch_id). No page/per_page.
      const query: Record<string, string | number> = {
        date_from: from,
        date_to: to,
      };
      if (branchId !== "all") query.branch_id = branchId;
      const raw = await apiFetch<unknown>(endpoints.driveThru.dashboard, {
        query,
      });
      return normalize(raw);
    },
  });

  const data = dash.data;
  const kpis = data?.kpis;
  const hourly = data?.hourly ?? [];
  const recentCars = data?.recent_cars ?? [];
  const queueCars = data?.queue_cars ?? [];

  const refresh = () => {
    setDeletedIds(new Set());
    qc.invalidateQueries({ queryKey: ["drive-thru-dashboard"] });
  };

  /* ── Hourly chart buckets ─────────────────────────────────────────── */
  const perHour = React.useMemo(() => {
    const buckets = EMPTY_HOURS.map((h) => ({ ...h }));
    for (const h of hourly) {
      const hr = num(h.hour);
      if (hr >= 0 && hr <= 23) {
        buckets[hr].count = num(h.count);
        buckets[hr].avg_time = num(h.avg_time);
      }
    }
    return buckets;
  }, [hourly]);
  const maxBar = Math.max(...perHour.map((h) => h.count), 1);
  const chartTotal = perHour.reduce((sum, h) => sum + h.count, 0);
  const currentHour = new Date().getHours();

  /* ── Zone performance averages ────────────────────────────────────── */
  const zone = React.useMemo(() => {
    const entry: number[] = [];
    const win: number[] = [];
    for (const c of recentCars) {
      if (c.zone_durations?.entry != null) entry.push(num(c.zone_durations.entry));
      if (c.zone_durations?.window != null)
        win.push(num(c.zone_durations.window));
    }
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return { avgEntry: avg(entry), avgWindow: avg(win), count: recentCars.length };
  }, [recentCars]);
  const zoneMax = Math.max(zone.avgEntry, zone.avgWindow, 1);

  /* ── Delete a car detection ───────────────────────────────────────── */
  const confirmDelete = React.useCallback(async () => {
    if (deleteTarget == null) return;
    setDeleting(true);
    try {
      await apiFetch(endpoints.detections.delete, {
        method: "POST",
        body: { id: deleteTarget },
      });
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(deleteTarget);
        return next;
      });
      toast.success(
        t("detectionFeed.detectionDeleted", "Detection deleted successfully")
      );
      setDeleteTarget(null);
      await dash.refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("common.error", "Something went wrong")
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, t, dash]);

  const visibleCars = React.useMemo(
    () => recentCars.filter((c) => !deletedIds.has(c.id)),
    [recentCars, deletedIds]
  );

  const locale = i18n.language === "ar" ? "ar" : "en";
  const formatDateTime = (raw: string) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const kpiCards = [
    {
      title: t("driveThru.driveThruCars", "DRIVE THRU CARS"),
      value: kpis?.total_cars ?? 0,
      subtitle: `${t("driveThru.previous", "Previous:")} ${kpis?.prev_total_cars ?? 0}`,
      icon: <Car className="h-5 w-5" />,
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
    },
    {
      title: t("driveThru.totalAvg", "TOTAL AVG"),
      value: formatTime(kpis?.avg_total_time ?? 0),
      subtitle: `${t("driveThru.previous", "Previous:")} ${formatTime(kpis?.prev_avg_total_time ?? 0)}`,
      icon: <Clock className="h-5 w-5" />,
      iconBg: "#e0e7ff",
      iconColor: "#4f46e5",
    },
    {
      title: t("driveThru.serviceAvg", "SERVICE AVG"),
      value: formatTime(kpis?.avg_service_time ?? 0),
      subtitle: t("driveThru.windowServiceTime", "Window service time"),
      icon: <UtensilsCrossed className="h-5 w-5" />,
      iconBg: "#fce7f3",
      iconColor: "#db2777",
    },
    {
      title: t("driveThru.orderAvg", "ORDER AVG"),
      value: formatTime(kpis?.avg_order_time ?? 0),
      subtitle: t("driveThru.entryOrderingTime", "Entry/ordering time"),
      icon: <Receipt className="h-5 w-5" />,
      iconBg: "#ffe4e6",
      iconColor: "#e11d48",
    },
    {
      title: t("driveThru.slaMet", "SLA MET"),
      value: kpis?.sla_met ?? 0,
      subtitle: `${t("driveThru.of", "of")} ${kpis?.sla_total ?? 0} ${t("driveThru.cars", "cars")}`,
      icon: <CircleCheck className="h-5 w-5" />,
      iconBg: "#ede9fe",
      iconColor: "#7c3aed",
    },
    {
      title: t("driveThru.slaRate", "SLA RATE"),
      value: `${kpis?.sla_percent ?? 0}%`,
      subtitle:
        (kpis?.sla_percent ?? 0) >= 90
          ? t("driveThru.excellent", "Excellent")
          : (kpis?.sla_percent ?? 0) >= 70
            ? t("driveThru.good", "Good")
            : t("driveThru.needsImprovement", "Needs Improvement"),
      icon: <Target className="h-5 w-5" />,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
    },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <ConfirmDeleteDialog
        open={deleteTarget != null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        isLoading={deleting}
        title={t("driveThru.deleteTitle", "Delete detection?")}
        description={t(
          "driveThru.deleteDescription",
          "This will permanently remove this car detection."
        )}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">
              {t("driveThru.title", "Drive Thru Monitor")}
            </h1>
            <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {t("serviceMonitor.live", "Live")}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t(
              "driveThru.subtitle",
              "Live metrics & queue status for your drive thru lanes"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[240px] max-w-full">
            <SharedDateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
          <div className="w-[180px] max-w-full">
            <AsyncPaginatedSelect
              endpoint="/customer/branches"
              labelKey="name"
              valueKey="id"
              extraParams={{ active: 1 }}
              value={branchId === "all" ? null : branchId}
              onChange={(v) => setBranchId(v ?? "all")}
              placeholder={t("serviceMonitor.allBranches", "All Branches")}
              isClearable
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={refresh}
          >
            <RefreshCw
              className={cn("h-4 w-4", dash.isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {/* ── Date info banner ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 dark:bg-cyan-950/30 dark:border-cyan-800 px-4 py-2.5 text-sm text-cyan-700 dark:text-cyan-300">
        <Clock className="h-4 w-4 shrink-0" />
        {t(
          "serviceMonitor.viewingRange",
          "Showing data from {{from}} to {{to}}",
          { from, to }
        )}
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        {kpiCards.map((c) => (
          <KpiCard key={c.title} {...c} />
        ))}
      </div>

      {/* ── SLA gauge + Queue + Hourly ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SlaGauge percent={kpis?.sla_percent ?? 0} t={t} />

        {/* Queue status */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Car className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">
              {t("driveThru.queueStatus", "Queue Status")}
            </h2>
            <Badge variant="outline" className="ml-auto text-xs">
              {queueCars.length} {t("driveThru.inLane", "in lane")}
            </Badge>
          </div>
          {queueCars.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("driveThru.queueEmpty", "No cars currently in the lane")}
            </p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {queueCars.map((q, i) => (
                <div
                  key={`${q.car_id}-${i}`}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        q.sla_met ? "bg-emerald-500" : "bg-rose-500"
                      )}
                    />
                    {q.car_id}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      q.sla_met ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {formatTime(q.total_time)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cars per hour */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              {t("driveThru.carsPerHour", "Cars Per Hour")}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted rounded px-2 py-0.5">
              {chartTotal.toLocaleString()} {t("common.total", "total")}
            </span>
          </div>
          <div className="flex items-end gap-px h-28">
            {perHour.map((h, i) => {
              const isNow = h.hour === currentHour;
              const pct = (h.count / maxBar) * 100;
              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      isNow ? "bg-emerald-500" : "bg-blue-600",
                      h.count === 0 && "bg-muted"
                    )}
                    style={{ height: `${Math.max(2, pct)}%` }}
                    title={`${h.hour}:00 — ${h.count} (${formatTime(h.avg_time)})`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-px mt-1">
            {perHour
              .filter((_, i) => i % 3 === 0)
              .map((h, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-[9px] text-muted-foreground"
                  style={{ flexBasis: `${(3 / 24) * 100}%` }}
                >
                  {h.hour === 0
                    ? "12AM"
                    : h.hour === 12
                      ? "12PM"
                      : h.hour < 12
                        ? `${h.hour}AM`
                        : `${h.hour - 12}PM`}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Zone performance ───────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            {t("driveThru.zonePerformance", "Zone Performance")}
          </h2>
          <Badge variant="outline" className="ml-auto text-xs">
            {zone.count} {t("driveThru.carsAnalyzed", "cars analyzed")}
          </Badge>
        </div>
        <div className="space-y-4">
          {[
            {
              label: t("driveThru.orderZone", "Order Zone"),
              value: zone.avgEntry,
              color: "#f59e0b",
            },
            {
              label: t("driveThru.serviceWindow", "Service Window"),
              value: zone.avgWindow,
              color: "#10b981",
            },
          ].map((z) => (
            <div key={z.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{z.label}</span>
                <span className="font-semibold">{formatTime(z.value)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (z.value / zoneMax) * 100)}%`,
                    backgroundColor: z.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent cars ────────────────────────────────────────────────── */}
      <DataTable
        title={t("driveThru.recentCars", "Recent Cars")}
        data={visibleCars}
        isLoading={dash.isLoading}
        emptyMessage={t("driveThru.noCars", "No cars detected today")}
        skeletonRows={5}
        columns={[
          {
            key: "image",
            header: t("driveThru.colImage", "Image"),
            headClassName: "w-24",
            render: (c) =>
              c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image}
                  alt=""
                  className="h-12 w-16 rounded object-cover border"
                />
              ) : (
                <div className="h-12 w-16 rounded border bg-muted flex items-center justify-center">
                  <Car className="h-4 w-4 opacity-30" />
                </div>
              ),
          },
          {
            key: "car_id",
            header: t("driveThru.colCarId", "Car ID"),
            render: (c) => (
              <span className="font-medium">{c.car_id}</span>
            ),
          },
          {
            key: "camera",
            header: t("driveThru.colCamera", "Camera"),
            render: (c) => (
              <span className="text-xs text-muted-foreground">{c.camera}</span>
            ),
          },
          {
            key: "entry",
            header: t("driveThru.colEntry", "Entry"),
            render: (c) => (
              <span className="text-sm">
                {formatTime(c.zone_durations?.entry ?? 0)}
              </span>
            ),
          },
          {
            key: "window",
            header: t("driveThru.colWindow", "Window"),
            render: (c) => (
              <span className="text-sm">
                {formatTime(c.zone_durations?.window ?? 0)}
              </span>
            ),
          },
          {
            key: "total",
            header: t("driveThru.colTotal", "Total"),
            render: (c) => (
              <span className="font-semibold">{formatTime(c.total_time)}</span>
            ),
          },
          {
            key: "sla",
            header: t("driveThru.colSla", "SLA"),
            render: (c) => (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  c.sla_met
                    ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-600"
                    : "border-rose-300/60 bg-rose-500/10 text-rose-600"
                )}
              >
                {c.sla_met
                  ? t("driveThru.met", "MET")
                  : t("driveThru.missed", "MISSED")}
              </Badge>
            ),
          },
          {
            key: "time",
            header: t("driveThru.colTime", "Time"),
            render: (c) => (
              <span className="text-xs text-muted-foreground">
                {formatDateTime(c.detected_at)}
              </span>
            ),
          },
          {
            key: "actions",
            header: t("driveThru.colActions", "Actions"),
            headClassName: "w-16 text-center",
            render: (c) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                onClick={() => setDeleteTarget(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
