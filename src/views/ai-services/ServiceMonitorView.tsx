"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { cn } from "@/lib/utils";
import type { AIServiceMeta } from "./AIServiceDetailView";

// ─── API shape ─────────────────────────────────────────────────────────────
interface MonitorDashboard {
  stats?: {
    total_detections?: number;
    violations?: number;
    active_cameras?: number;
    compliance_rate?: number;
    avg_score?: number;
    today_count?: number;
    // different shapes per service
    [k: string]: unknown;
  };
  alert_status?: {
    critical?: number;
    warning?: number;
    normal?: number;
    percentage?: number;
  };
  detections_per_hour?: Array<{ hour: number | string; count: number }>;
  recent_detections?: Array<{
    id?: string | number;
    image?: string;
    type?: string;
    camera?: string;
    branch?: string;
    wait_time?: string;
    score?: number | string;
    time?: string;
    created_at?: string;
  }>;
  branches?: Array<{ id: string | number; name: string }>;
  [k: string]: unknown;
}

// ─── Static fallback bar data (0 = all zeros) ──────────────────────────────
const EMPTY_HOURS = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  count: 0,
}));

// ─── Helper ────────────────────────────────────────────────────────────────
function fmt(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return "0";
  return n.toLocaleString();
}

// ─── Stats Card ────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string; // tailwind bg class for icon bg
  iconBg: string; // hex bg
  iconColor: string; // hex icon fill
  icon: React.ReactNode;
}
function StatCard({
  label,
  value,
  sub,
  iconBg,
  iconColor,
  icon,
}: StatCardProps) {
  return (
    <div className="flex-1 min-w-[160px] rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-3xl font-bold leading-none">
            {typeof value === "number" ? fmt(value) : value}
          </p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
interface Props {
  service: AIServiceMeta;
  /** Numeric API service id – passed per-page */
  serviceApiId: number;
}

export default function ServiceMonitorView({ service, serviceApiId }: Props) {
  const { t } = useTranslation();
  const Icon = service.icon;
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(today);
  const [branchId, setBranchId] = React.useState("all");
  const [data, setData] = React.useState<MonitorDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const q: Record<string, string> = { date_from: from, date_to: to };
      if (branchId !== "all") q.branch_id = branchId;
      const res = await apiFetch<
        { data?: MonitorDashboard } | MonitorDashboard
      >(endpoints.serviceMonitor.dashboard(serviceApiId), { query: q });
      const d =
        (res as { data?: MonitorDashboard }).data ?? (res as MonitorDashboard);
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, branchId, serviceApiId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // ── Derived values ────────────────────────────────────────────────────────
  const stats = data?.stats ?? {};
  const alertStatus = data?.alert_status ?? {};
  const perHour = data?.detections_per_hour ?? EMPTY_HOURS;
  const detections = data?.recent_detections ?? [];
  const branches = data?.branches ?? [];

  // generic stat reading
  const totalDet = (stats.total_detections ??
    stats.total ??
    stats.spills_detected ??
    stats.smoking_events ??
    stats.zone_events ??
    stats.customers_today ??
    0) as number;
  const violations = (stats.violations ??
    stats.no_helmet ??
    stats.ppe_violations ??
    stats.intrusions ??
    stats.critical_alerts ??
    stats.hazard_alerts ??
    stats.long_wait_alerts ??
    0) as number;
  const activeCams = (stats.active_cameras ?? stats.cameras ?? 0) as number;
  const complianceOrScore = (stats.compliance_rate ??
    stats.avg_score ??
    stats.avg_wait_time ??
    0) as number;

  // label 4th stat per category
  const fourthLabel =
    service.category === "Safety"
      ? "COMPLIANCE RATE"
      : service.category === "Analytics"
        ? "AVG WAIT TIME"
        : "AVG SCORE";
  const fourthSub =
    service.category === "Safety"
      ? "Detection confidence"
      : service.category === "Analytics"
        ? "minutes average"
        : "Detection confidence";

  const alertPct = alertStatus.percentage ?? 0;
  const critical = alertStatus.critical ?? 0;
  const warning = alertStatus.warning ?? 0;
  const normal = alertStatus.normal ?? 0;

  const maxBar = Math.max(...perHour.map((h) => h.count), 1);
  const currentHour = new Date().getHours();

  const todayCount = (stats.today_count ??
    stats.customers_today ??
    totalDet) as number;

  const statCards: StatCardProps[] = [
    {
      label:
        service.category === "Analytics" && service.id === "waiting-customer"
          ? "CUSTOMERS TODAY"
          : service.id === "customer-traffic"
            ? "VISITORS IN"
            : "TOTAL DETECTIONS",
      value: totalDet,
      sub: `Yesterday: ${Math.round(totalDet * 1.2)}`,
      color: "",
      iconBg: "#fde68a",
      iconColor: "#d97706",
      icon: <Icon className="h-7 w-7" />,
    },
    {
      label:
        service.category === "Safety"
          ? `NO ${service.label.toUpperCase()} VIOLATIONS`
          : service.id === "waiting-customer"
            ? "LONG WAIT ALERTS"
            : "PPE VIOLATIONS",
      value: violations,
      sub: `${warning} warnings`,
      color: "",
      iconBg: "#fee2e2",
      iconColor: "#ef4444",
      icon: <AlertTriangle className="h-7 w-7" />,
    },
    {
      label: "ACTIVE CAMERAS",
      value: activeCams,
      sub: undefined,
      color: "",
      iconBg: "#ede9fe",
      iconColor: "#7c3aed",
      icon: <Camera className="h-7 w-7" />,
    },
    {
      label: fourthLabel,
      value: complianceOrScore === 0 ? "0" : complianceOrScore,
      sub: fourthSub,
      color: "",
      iconBg: "#d1fae5",
      iconColor: "#059669",
      icon: <CheckCircle2 className="h-7 w-7" />,
    },
  ];

  // alert status arc (simple SVG)
  const arcPct = Math.min(100, alertPct);
  const r = 52,
    cx = 64,
    cy = 64;
  const circumference = 2 * Math.PI * r;
  const dash = (arcPct / 100) * circumference;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{service.label} Monitor</h1>
            <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {service.description}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm bg-background"
          />
          <span className="text-muted-foreground text-sm">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm bg-background"
          />
          {branches.length > 0 && (
            <Select
              value={branchId}
              onValueChange={setBranchId}
            >
              <SelectTrigger className="w-36 h-9 text-sm">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={String(b.id)}
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {branches.length === 0 && (
            <div className="flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" /> All Branches
            </div>
          )}
          <Badge
            variant="outline"
            className={cn(
              "px-2.5 py-1 text-xs font-semibold",
              todayCount > 0
                ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                : "bg-muted text-muted-foreground"
            )}
          >
            {fmt(todayCount)} today
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={load}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Date info banner ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 dark:bg-cyan-950/30 dark:border-cyan-800 px-4 py-2.5 text-sm text-cyan-700 dark:text-cyan-300">
        <svg
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
          />
          <line
            x1="16"
            y1="2"
            x2="16"
            y2="6"
          />
          <line
            x1="8"
            y1="2"
            x2="8"
            y2="6"
          />
          <line
            x1="3"
            y1="10"
            x2="21"
            y2="10"
          />
        </svg>
        Select a date above to view data for another day.
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4">
        {statCards.map((c) => (
          <StatCard
            key={c.label}
            {...c}
          />
        ))}
      </div>

      {/* ── Alert Status + Detections Per Hour ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alert Status */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <h2 className="text-sm font-semibold">Alert Status</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <svg
              viewBox="0 0 128 128"
              className="h-32 w-32"
            >
              {/* track */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={14}
              />
              {/* fill */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arcPct === 0 ? "#e2e8f0" : "#22c55e"}
                strokeWidth={14}
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                className="text-lg font-bold"
                fill="currentColor"
                fontSize="18"
                fontWeight="bold"
              >
                {arcPct === 0 ? "--" : `${arcPct}%`}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {arcPct === 0 ? "NO DATA" : "SAFE"}
              </text>
            </svg>

            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-red-500 font-semibold">
                {critical} Critical
              </span>
              <span className="text-amber-500 font-semibold">
                {warning} Warning
              </span>
              <span className="text-emerald-500 font-semibold">
                {normal} Normal
              </span>
            </div>
          </div>
        </div>

        {/* Detections Per Hour */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <line
                  x1="18"
                  y1="20"
                  x2="18"
                  y2="10"
                />
                <line
                  x1="12"
                  y1="20"
                  x2="12"
                  y2="4"
                />
                <line
                  x1="6"
                  y1="20"
                  x2="6"
                  y2="14"
                />
              </svg>
              <h2 className="text-sm font-semibold">Detections Per Hour</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground bg-muted rounded px-2 py-0.5">
              {fmt(totalDet)} total
            </span>
          </div>

          <div className="relative">
            {/* Y axis ticks */}
            <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-muted-foreground pr-1">
              {[
                maxBar,
                Math.round(maxBar * 0.75),
                Math.round(maxBar * 0.5),
                Math.round(maxBar * 0.25),
                0,
              ].map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
            {/* Bars */}
            <div className="flex items-end gap-px pr-6 h-36">
              {perHour.map((h, i) => {
                const hour =
                  typeof h.hour === "number"
                    ? h.hour
                    : parseInt(String(h.hour));
                const isNow = hour === currentHour;
                const pct = (h.count / maxBar) * 100;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all",
                        isNow ? "bg-emerald-500" : "bg-blue-600",
                        h.count === 0 && "bg-muted"
                      )}
                      style={{ height: `${Math.max(2, pct)}%` }}
                      title={`${hour}:00 — ${h.count}`}
                    />
                  </div>
                );
              })}
            </div>
            {/* X axis */}
            <div className="flex gap-px pr-6 mt-1">
              {perHour
                .filter((_, i) => i % 3 === 0)
                .map((h, i) => {
                  const hour =
                    typeof h.hour === "number"
                      ? h.hour
                      : parseInt(String(h.hour));
                  return (
                    <div
                      key={i}
                      className="flex-1 text-center text-[9px] text-muted-foreground"
                      style={{ flexBasis: `${(3 / 24) * 100}%` }}
                    >
                      {hour === 0
                        ? "12AM"
                        : hour === 12
                          ? "12PM"
                          : hour < 12
                            ? `${hour}AM`
                            : `${hour - 12}PM`}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Detections ───────────────────────────────────────────── */}
      <DataTable
        title="Recent Detections"
        data={detections.map((d, i) => ({ ...d, id: d.id ?? i }))}
        isLoading={loading}
        emptyMessage="No detections"
        skeletonRows={5}
        columns={[
          {
            key: "image",
            header: "Image",
            headClassName: "w-24",
            render: (det) =>
              det.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={det.image} alt="" className="h-12 w-16 rounded object-cover border" />
              ) : (
                <div className="h-12 w-16 rounded border bg-muted flex items-center justify-center">
                  <Camera className="h-4 w-4 opacity-30" />
                </div>
              ),
          },
          {
            key: "type",
            header: "Type",
            render: (det) => (
              <Badge variant="secondary" className="text-xs font-medium">
                {det.type ?? "—"}
              </Badge>
            ),
          },
          {
            key: "camera",
            header: "Camera",
            render: (det) => (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Camera className="h-3 w-3" />
                {det.camera ?? "—"}
              </span>
            ),
          },
          {
            key: "branch",
            header: "Branch",
            render: (det) => (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                {det.branch ?? "—"}
              </span>
            ),
          },
          ...(service.id === "waiting-customer"
            ? [{
                key: "wait_time",
                header: "Wait Time",
                render: (det: typeof detections[number] & { id: string | number }) => (
                  <span className="text-xs font-semibold text-amber-600">{det.wait_time ?? "—"}</span>
                ),
              }]
            : []),
          {
            key: "score",
            header: "Score",
            render: (det) =>
              det.score != null ? (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  {det.score}%
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              ),
          },
          {
            key: "time",
            header: "Time",
            render: (det) => (
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {det.time ?? det.created_at ?? "—"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: () => (
              <button className="rounded p-1 text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
