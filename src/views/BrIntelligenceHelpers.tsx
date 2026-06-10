"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  Flame,
  Heart,
  Info,
  LineChart,
  Medal,
  Sigma,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Activity,
  Grid3x3,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import type {
  HourlyPeak,
  EfficiencyRow,
  HeatmapPayload,
  TrendForecast,
  AiInsight,
  BranchHealth,
  ServiceMatrixCell,
} from "@/services/intelligenceService";
import { useTranslation } from "react-i18next";

/* ---------------- helpers ---------------- */

export function Section({
  id,
  icon,
  title,
  meta,
  children,
  openSection,
  setOpenSection,
  printVisible,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  openSection: string | null;
  setOpenSection: (id: string | null) => void;
  printVisible?: boolean;
}) {
  const open = openSection === id;
  // In print mode: only show if printVisible is true; hide if false
  // printVisible===undefined means not in print mode → use normal show/hide
  if (printVisible === false) return null;

  // In print mode render a clean non-Card wrapper that doesn't clip or break
  if (printVisible === true) {
    return (
      <div
        className="print-rtl rounded-xl border bg-card text-card-foreground shadow-sm"
        style={{ marginBottom: "12px", width: "100%", boxSizing: "border-box" }}
        data-section-id={id}
      >
        <div
          className="border-b px-5 pt-4 pb-1"
          style={{ textAlign: "right" }}
        >
          <h2 className="text-base font-bold">{title}</h2>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    );
  }

  return (
    <Card
      className="overflow-hidden"
      data-section-id={id}
    >
      {/* Accordion header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpenSection(open ? null : id)}
        onKeyDown={(e) => e.key === "Enter" && setOpenSection(open ? null : id)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-start"
      >
        <span className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-3">
          {meta}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition",
              open && "rotate-180"
            )}
          />
        </span>
      </div>
      {/* Content */}
      <div
        className={cn("px-5 py-4", !open && "hidden", open ? "border-t" : "")}
      >
        {children}
      </div>
    </Card>
  );
}

export function SummaryCard({
  icon,
  tint,
  value,
  label,
  valueClass,
}: {
  icon: React.ReactNode;
  tint: string;
  value: React.ReactNode;
  label: string;
  valueClass?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full",
            tint
          )}
        >
          {icon}
        </div>
        <div>
          {value === null ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className={cn("text-2xl font-bold tabular-nums", valueClass)}>
              {value}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80
      ? "stroke-emerald-500"
      : score >= 50
        ? "stroke-amber-500"
        : "stroke-rose-500";
  const textColor =
    score >= 80
      ? "text-emerald-600"
      : score >= 50
        ? "text-amber-600"
        : "text-rose-600";
  const pct = Math.max(0, Math.min(100, score));
  const circ = 2 * Math.PI * 18;
  return (
    <div className="relative h-12 w-12">
      <svg
        viewBox="0 0 44 44"
        className="h-12 w-12 -rotate-90"
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          className="stroke-slate-100"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          className={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-bold",
          textColor
        )}
      >
        {score >= 100 ? 100 : score.toFixed(1)}
      </span>
    </div>
  );
}

export function Bar({ value, good }: { value: number; good?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
        dir="ltr"
      >
        <div
          className={cn(
            "h-full",
            good ? (v >= 50 ? "bg-emerald-500" : "bg-rose-500") : "bg-sky-500"
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs",
          v >= 50 ? "text-emerald-600" : "text-rose-600"
        )}
      >
        {v}%
      </span>
    </div>
  );
}

export function RankCard({
  title,
  icon,
  items,
  valueClass,
  format,
}: {
  title: string;
  icon: React.ReactNode;
  items: { branch: string; value: number | string }[];
  valueClass?: string;
  format?: (v: number | string) => string | number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </p>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">—</p>
        ) : (
          items.map((it, i) => (
            <div
              key={it.branch ?? i}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <Medal
                  className={cn(
                    "h-4 w-4",
                    i === 0
                      ? "text-amber-500"
                      : i === 1
                        ? "text-slate-400"
                        : "text-orange-700"
                  )}
                />
                {it.branch}
              </span>
              <span className={cn("font-bold tabular-nums", valueClass)}>
                {format ? format(it.value) : it.value}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ClassCard({
  tone,
  icon,
  label,
  items,
}: {
  tone: "emerald" | "sky" | "amber" | "rose";
  icon: React.ReactNode;
  label: string;
  items: EfficiencyRow[];
}) {
  const { t } = useTranslation();
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
    sky: "border-sky-200 bg-sky-50/40 text-sky-700",
    amber: "border-amber-200 bg-amber-50/40 text-amber-700",
    rose: "border-rose-200 bg-rose-50/40 text-rose-700",
  }[tone];
  return (
    <div className={cn("rounded-lg border p-4", toneClass)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-xs opacity-80">
        {items.length} {t("intel.branches", "branches")}
      </p>
      <div className="mt-3 space-y-2 text-sm">
        {items.length === 0 ? (
          <p className="text-muted-foreground">—</p>
        ) : (
          items.map((it) => (
            <div
              key={it.branch}
              className="flex items-center justify-between text-slate-700"
            >
              <span>{it.branch}</span>
              <ScoreRing score={it.score} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Heatmap({ data }: { data: HeatmapPayload | null }) {
  const { t } = useTranslation();
  const cells = data?.cells ?? [];
  const dates = data?.dates ?? [];
  if (!cells.length || !dates.length) {
    return (
      <div className="rounded-xl bg-orange-50/40 py-12 text-center text-sm text-muted-foreground">
        {t("intel.noHeatmapData", "No heatmap data available")}
      </div>
    );
  }
  const color = (v: number, max: number) => {
    if (v === 0) return "transparent";
    const ratio = v / Math.max(1, max);
    if (ratio < 0.2) return "#10b981";
    if (ratio < 0.4) return "#84cc16";
    if (ratio < 0.6) return "#f59e0b";
    if (ratio < 0.8) return "#f97316";
    return "#ef4444";
  };
  const max = Math.max(1, ...cells.map((c) => c.value));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[80px_repeat(24,minmax(0,1fr))] gap-1 text-[10px] text-muted-foreground">
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div
              key={h}
              className="text-center"
            >
              {h}
            </div>
          ))}
          {dates.map((d) => (
            <RowOfHeatmap
              key={d}
              date={d}
              cells={cells}
              max={max}
              colorFn={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
export function RowOfHeatmap({
  date,
  cells,
  max,
  colorFn,
}: {
  date: string;
  cells: HeatmapPayload["cells"];
  max: number;
  colorFn: (v: number, max: number) => string;
}) {
  return (
    <>
      <div className="self-center text-end pr-2">{date}</div>
      {Array.from({ length: 24 }).map((_, h) => {
        const cell = cells.find((c) => c.date === date && c.hour === h);
        const v = cell?.value ?? 0;
        return (
          <div
            key={h}
            className="flex h-7 items-center justify-center rounded text-[10px] font-medium text-white"
            style={{ background: colorFn(v, max) }}
          >
            {v > 0 ? v : ""}
          </div>
        );
      })}
    </>
  );
}

export function HourlyChart({ data }: { data: HourlyPeak[] }) {
  const { t } = useTranslation();
  if (data.length === 0)
    return (
      <div className="rounded-xl bg-orange-50/40 py-12 text-center text-sm text-muted-foreground">
        {t("intel.noHourlyData", "No hourly data available for this period")}
      </div>
    );
  const max = Math.max(...data.map((d) => d.detections));
  const peakHour = data.reduce(
    (m, c) => (c.detections > m.detections ? c : m),
    data[0]
  ).hour;
  return (
    <div>
      <div className="flex h-48 items-end gap-1">
        {data.map((d) => {
          const isPeak = d.hour === peakHour;
          return (
            <div
              key={d.hour}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t",
                    isPeak
                      ? "bg-gradient-to-t from-orange-600 to-orange-400"
                      : "bg-gradient-to-t from-indigo-500 to-indigo-300"
                  )}
                  style={{ height: `${(d.detections / max) * 100}%` }}
                />
                <div
                  className="absolute bottom-0 w-full rounded-t bg-rose-400/70"
                  style={{ height: `${(d.violations / max) * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  isPeak ? "font-bold text-orange-600" : "text-muted-foreground"
                )}
              >
                {d.hour}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          Detections
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          Violations
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          Peak Hour
        </span>
      </div>
    </div>
  );
}

export function RadarSection({ rows }: { rows: EfficiencyRow[] }) {
  const { t } = useTranslation();
  if (rows.length === 0) return <Skeleton className="h-40 w-full" />;
  const metrics = [
    { key: "compliance", label: "intel.compliance" },
    { key: "score", label: "intel.score" },
    { key: "task_rate", label: "intel.tasks" },
    { key: "violation_rate", label: "analytics.violations" },
    { key: "detections", label: "intel.detections" },
  ] as const;
  const maxDet = Math.max(1, ...rows.map((r) => r.detections));
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {rows.map((r) => (
        <div
          key={r.branch}
          className="rounded-lg border p-3"
        >
          <p className="mb-2 font-semibold">{r.branch}</p>
          <div className="space-y-2">
            {metrics.map((m) => {
              const raw =
                m.key === "detections"
                  ? (r.detections / maxDet) * 100
                  : (r as unknown as Record<string, number>)[m.key];
              const v = Math.max(0, Math.min(100, raw));
              return (
                <div key={m.key}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t(m.label, m.label.split(".").pop() ?? m.label)}
                    </span>
                    <span className="tabular-nums">{Math.round(v)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${v}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- new section helpers ---------------- */

export function BranchComparisonSection({ rows }: { rows: EfficiencyRow[] }) {
  const { t } = useTranslation();
  const [selectedA, setSelectedA] = useState<string>("");
  const [selectedB, setSelectedB] = useState<string>("");

  if (rows.length === 0) return <Skeleton className="h-40 w-full" />;

  // Resolve the actual branch objects; fall back to positional defaults only
  // when no explicit selection has been made yet (empty string).
  const resolvedA = selectedA || rows[0]?.branch || "";
  const resolvedB = selectedB || rows[1]?.branch || rows[0]?.branch || "";

  const branchA = rows.find((r) => r.branch === resolvedA) ?? rows[0];
  const branchB =
    rows.find((r) => r.branch === resolvedB) ?? rows[1] ?? rows[0];

  const metrics: {
    key: "score" | "compliance" | "violation_rate" | "task_rate";
    label: string;
    max: number;
    unit: string;
    invert?: boolean;
  }[] = [
    { key: "score", label: "intel.score", max: 100, unit: "" },
    { key: "compliance", label: "intel.compliance", max: 100, unit: "%" },
    {
      key: "violation_rate",
      label: "intel.violationRate",
      max: 100,
      unit: "%",
      invert: true,
    },
    { key: "task_rate", label: "intel.taskCompletion", max: 100, unit: "%" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-indigo-500" />
          <select
            value={resolvedA}
            onChange={(e) => setSelectedA(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {rows.map((r) => (
              <option
                key={r.branch}
                value={r.branch}
              >
                {r.branch}
              </option>
            ))}
          </select>
        </div>
        <span className="font-semibold text-slate-400">vs</span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-teal-500" />
          <select
            value={resolvedB}
            onChange={(e) => setSelectedB(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            {rows.map((r) => (
              <option
                key={r.branch}
                value={r.branch}
              >
                {r.branch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((m) => {
          const valA =
            (branchA as unknown as Record<string, number>)[m.key] ?? 0;
          const valB =
            (branchB as unknown as Record<string, number>)[m.key] ?? 0;
          const pctA = Math.max(0, Math.min(100, (valA / m.max) * 100));
          const pctB = Math.max(0, Math.min(100, (valB / m.max) * 100));
          const winner = m.invert
            ? valA < valB
              ? "A"
              : valB < valA
                ? "B"
                : "tie"
            : valA > valB
              ? "A"
              : valB > valA
                ? "B"
                : "tie";
          return (
            <div
              key={m.key}
              className="space-y-1.5"
            >
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>{t(m.label, m.label.split(".").pop() ?? m.label)}</span>
                {winner !== "tie" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      winner === "A"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-teal-100 text-teal-700"
                    )}
                  >
                    {winner === "A" ? branchA.branch : branchB.branch}{" "}
                    {t("intel.wins", "wins")}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-28 truncate text-xs text-slate-600">
                    {branchA.branch}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          m.invert && pctA > 50 ? "bg-rose-500" : "bg-indigo-500")}
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn("w-12 text-end text-xs font-semibold tabular-nums",
                    m.invert && valA > 50 ? "text-rose-600" : "text-indigo-600")}>
                    {valA.toFixed(1)}
                    {m.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-28 truncate text-xs text-slate-600">
                    {branchB.branch}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          m.invert && pctB > 50 ? "bg-rose-500" : "bg-teal-500")}
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn("w-12 text-end text-xs font-semibold tabular-nums",
                    m.invert && valB > 50 ? "text-rose-600" : "text-teal-600")}>
                    {valB.toFixed(1)}
                    {m.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Sev = AiInsight["severity"];

export function insightTone(s: Sev) {
  switch (s) {
    case "success":
      return {
        bg: "bg-emerald-50/60",
        border: "border-emerald-200",
        iconBg: "bg-emerald-100",
        icon: "text-emerald-600",
        title: "text-emerald-700",
      };
    case "warning":
      return {
        bg: "bg-amber-50/60",
        border: "border-amber-200",
        iconBg: "bg-amber-100",
        icon: "text-amber-600",
        title: "text-amber-700",
      };
    case "danger":
      return {
        bg: "bg-rose-50/60",
        border: "border-rose-200",
        iconBg: "bg-rose-100",
        icon: "text-rose-600",
        title: "text-rose-700",
      };
    case "info":
    default:
      return {
        bg: "bg-sky-50/60",
        border: "border-sky-200",
        iconBg: "bg-sky-100",
        icon: "text-sky-600",
        title: "text-sky-700",
      };
  }
}

export function InsightIcon({
  severity,
  className,
}: {
  severity?: Sev;
  className?: string;
}) {
  if (severity === "success") return <Trophy className={className} />;
  if (severity === "warning") return <AlertTriangle className={className} />;
  if (severity === "danger") return <AlertCircle className={className} />;
  return <LineChart className={className} />;
}

export function BranchHealthTable({ rows }: { rows: BranchHealth[] }) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  if (rows.length === 0)
    return (
      <div className="rounded-xl bg-rose-50/40 py-12 text-center text-sm text-muted-foreground">
        {t("intel.noBranchHealth", "No branch health data available")}
      </div>
    );

  const columns: DataTableColumn<BranchHealth & { id: string }>[] = [
    {
      key: "branch",
      header: t("intel.branch", "Branch"),
      headClassName: "min-w-[130px]",
      render: (r) => (
        <span className="flex items-center gap-2 font-medium whitespace-nowrap">
          <span
            className={cn(
              "inline-block h-2 w-2 shrink-0 rounded-full",
              r.health >= 80
                ? "bg-emerald-500"
                : r.health >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
            )}
          />
          {r.branch}
        </span>
      ),
    },
    {
      key: "cameras",
      header: t("intel.cameras", "Cameras") + " 📷",
      headClassName: "w-24",
      render: (r) => {
        const on = r.cameras_online ?? 0;
        const tot = r.cameras_total ?? 0;
        const ok = tot > 0 && on / tot >= 0.5;
        const up = r.uptime_pct ?? 0;
        return (
          <div className="space-y-1">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                ok
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {on}/{tot}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-10 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-full rounded-full",
                    up >= 80
                      ? "bg-emerald-500"
                      : up >= 30
                        ? "bg-amber-500"
                        : "bg-rose-300"
                  )}
                  style={{ width: `${Math.max(2, up)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{up}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "detections",
      header: t("intel.detections", "Detections") + " ↓",
      headClassName: "w-24",
      render: (r) => (
        <span className="font-semibold text-sky-600 tabular-nums">
          {(r.detections ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "violations",
      header: t("analytics.violations", "Violations"),
      headClassName: "w-28",
      render: (r) => {
        const vp = r.viol_pct;
        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "tabular-nums font-semibold",
                (r.violations ?? 0) > 0 ? "text-rose-600" : "text-slate-400"
              )}
            >
              {(r.violations ?? 0).toLocaleString()}
            </span>
            {vp !== null && vp !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  vp > 50
                    ? "bg-rose-100 text-rose-700"
                    : vp > 20
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                )}
              >
                {vp}%
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "trend",
      header: t("intel.trend", "Trend"),
      headClassName: "w-24",
      render: (r) => (
        <Sparkline
          values={r.trend_series ?? []}
          color="hsl(346 77% 49%)"
        />
      ),
    },
  ];

  const filtered = searchValue
    ? rows.filter((r) =>
        (r.branch ?? "").toLowerCase().includes(searchValue.toLowerCase())
      )
    : rows;
  const data = filtered.map((r) => ({
    ...r,
    id: r.branch,
  })) as (BranchHealth & { id: string })[];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder={t("intel.searchBranches", "Search branches...")}
      emptyMessage={t("intel.noResults", "No branches found")}
    />
  );
}

export function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  if (values.length < 2) return <div className="h-8 w-24 rounded bg-rose-50" />;
  const w = 96;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = w / (values.length - 1);
  const pts = values
    .map(
      (v, i) =>
        `${(i * step).toFixed(1)},${(h - ((v - min) / range) * (h - 4) - 2).toFixed(1)}`
    )
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      className="overflow-visible"
    >
      <rect
        width={w}
        height={h}
        className="fill-rose-50/60"
        rx="4"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ServiceBranchMatrix({ cells }: { cells: ServiceMatrixCell[] }) {
  const { t } = useTranslation();
  if (cells.length === 0)
    return (
      <div className="rounded-xl bg-orange-50/40 py-12 text-center text-sm text-muted-foreground">
        {t("intel.noMatrixData", "No service matrix data available")}
      </div>
    );
  const branches = Array.from(new Set(cells.map((c) => c.branch)));
  const services = Array.from(new Set(cells.map((c) => c.service)));
  const lookup = new Map(cells.map((c) => [`${c.branch}__${c.service}`, c]));
  const allValues = cells.map((c) => c.count).filter((v) => v > 0);
  const max = Math.max(1, ...allValues);

  const intensity = (v: number): { bg: string; text: string } => {
    if (v === 0) return { bg: "transparent", text: "text-slate-300" };
    const r = v / max;
    if (r > 0.7) return { bg: "rgba(244,63,94,0.85)", text: "text-white" };
    if (r > 0.45)
      return { bg: "rgba(251,146,60,0.55)", text: "text-orange-900" };
    if (r > 0.2) return { bg: "rgba(250,204,21,0.45)", text: "text-amber-800" };
    if (r > 0.05)
      return { bg: "rgba(34,197,94,0.45)", text: "text-emerald-900" };
    return { bg: "rgba(34,197,94,0.2)", text: "text-emerald-800" };
  };

  const colTotals = services.map((s) =>
    branches.reduce((sum, b) => sum + (lookup.get(`${b}__${s}`)?.count ?? 0), 0)
  );
  const rowTotals = branches.map((b) =>
    services.reduce((sum, s) => sum + (lookup.get(`${b}__${s}`)?.count ?? 0), 0)
  );
  const grand = rowTotals.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t("intel.intensity", "Intensity:")}</span>
        {[
          "rgba(34,197,94,0.2)",
          "rgba(34,197,94,0.45)",
          "rgba(250,204,21,0.45)",
          "rgba(251,146,60,0.55)",
          "rgba(244,63,94,0.85)",
        ].map((c, i) => (
          <span
            key={i}
            className="h-3 w-6 rounded"
            style={{ background: c }}
          />
        ))}
        <span className="ms-1">
          {t("intel.low", "Low")} → {t("intel.high", "High")}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky start-0 z-10 bg-white px-3 py-2 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Building2 className="me-1 inline h-3.5 w-3.5" />
                {t("intel.branch", "Branch")}
              </th>
              {services.map((s) => (
                <th
                  key={s}
                  className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  <div className="mb-1 flex justify-center">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Activity className="h-3 w-3" />
                    </span>
                  </div>
                  {s}
                </th>
              ))}
              <th className="px-3 py-2 text-end text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                <Sigma className="me-1 inline h-3.5 w-3.5" />
                {t("intel.total", "Total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b, bi) => (
              <tr
                key={b}
                className="border-t"
              >
                <td className="sticky start-0 z-10 bg-white px-3 py-2 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    {b}
                  </span>
                </td>
                {services.map((s) => {
                  const cell = lookup.get(`${b}__${s}`);
                  const v = cell?.count ?? 0;
                  const tone = intensity(v);
                  return (
                    <td
                      key={s}
                      className="p-1 text-center"
                    >
                      <div
                        className={cn(
                          "rounded-lg py-2 text-sm font-semibold tabular-nums",
                          tone.text
                        )}
                        style={{ background: tone.bg }}
                      >
                        {v > 0 ? v.toLocaleString() : "—"}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-end font-bold text-indigo-600 tabular-nums">
                  {rowTotals[bi].toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="border-t bg-slate-50/60">
              <td className="sticky start-0 z-10 bg-slate-50/60 px-3 py-2 text-sm font-bold text-indigo-600">
                <Sigma className="me-1 inline h-3.5 w-3.5" />
                {t("intel.total", "Total")}
              </td>
              {colTotals.map((v, i) => (
                <td
                  key={i}
                  className="px-3 py-2 text-center font-bold text-sky-600 tabular-nums"
                >
                  {v.toLocaleString()}
                </td>
              ))}
              <td className="px-3 py-2 text-end text-base font-extrabold text-indigo-700 tabular-nums">
                {grand.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ForecastSection({
  forecast,
}: {
  forecast: TrendForecast | null;
}) {
  const { t } = useTranslation();
  if (!forecast || forecast.points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6" strokeDasharray="3 3"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-slate-600">
            {t("intel.noForecastData", "Insufficient Data for Forecasting")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("intel.forecastRequirement", "At least 2 days of detection data are required for trend analysis")}
          </p>
        </div>
      </div>
    );
  }
  if (!forecast) return <Skeleton className="h-56 w-full" />;
  const dirColor =
    forecast.direction === "falling"
      ? "text-rose-600"
      : forecast.direction === "rising"
        ? "text-emerald-600"
        : "text-slate-600";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPill
          label="intel.trend"
          icon={
            forecast.direction === "falling" ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            )
          }
          value={
            <span className={cn("capitalize", dirColor)}>
              {t(`intel.direction_${forecast.direction}`, forecast.direction)}
            </span>
          }
          tint="bg-rose-50/60 border-rose-200"
        />
        <StatPill
          label="R²"
          icon={<span className="font-serif text-indigo-500">ƒx</span>}
          value={<span className="text-indigo-600">{forecast.r2}</span>}
          tint="bg-indigo-50/60 border-indigo-200"
        />
        <StatPill
          label="intel.slope"
          icon={<LineChart className="h-4 w-4 text-sky-500" />}
          value={
            <span className="text-sky-600">
              {forecast.slope ?? "—"}/{t("intel.day", "day")}
            </span>
          }
          tint="bg-sky-50/60 border-sky-200"
        />
        <StatPill
          label="intel.stdError"
          icon={<BarChart3 className="h-4 w-4 text-amber-500" />}
          value={
            <span className="text-amber-600">±{forecast.std_error ?? "—"}</span>
          }
          tint="bg-amber-50/60 border-amber-200"
        />
      </div>
      <ForecastChartV2 forecast={forecast} />
    </div>
  );
}

export function StatPill({
  label,
  icon,
  value,
  tint,
}: {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  tint: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border p-3", tint)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label.includes(".") ? t(label, label.split(".").pop()!) : label}
        </p>
        <p className="truncate text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function ForecastChartV2({ forecast }: { forecast: TrendForecast }) {
  const { t } = useTranslation();
  const pts = forecast?.points ?? [];
  if (pts.length === 0)
    return (
      <div className="rounded-xl bg-indigo-50/40 py-12 text-center text-sm text-muted-foreground">
        {t(
          "intel.noForecastData",
          "Insufficient data for trend forecast — more historical data needed"
        )}
      </div>
    );
  const W = 800;
  const H = 240;
  const padL = 40;
  const padR = 12;
  const padT = 10;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const all = pts.flatMap((p) =>
    [p.actual, p.forecast, p.lower, p.upper].filter(
      (v): v is number => typeof v === "number"
    )
  );
  const max = Math.max(1, ...all);
  const min = 0;
  const xAt = (i: number) => padL + (i / Math.max(1, pts.length - 1)) * innerW;
  const yAt = (v: number) => padT + innerH - ((v - min) / (max - min)) * innerH;
  const firstForecastIdx = pts.findIndex((p) => p.forecast !== undefined);
  const lastActualIdx = (() => {
    for (let i = pts.length - 1; i >= 0; i--)
      if (pts[i].actual !== undefined) return i;
    return -1;
  })();

  const actualPath = pts
    .map((p, i) =>
      p.actual !== undefined
        ? `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.actual)}`
        : ""
    )
    .filter(Boolean)
    .join(" ");
  const forecastPath = pts
    .map((p, i) =>
      p.forecast !== undefined
        ? `${i === firstForecastIdx ? "M" : "L"} ${xAt(i)} ${yAt(p.forecast)}`
        : ""
    )
    .filter(Boolean)
    .join(" ");
  // Confidence area
  const upperPath = pts
    .map((p, i) => (p.upper !== undefined ? `${xAt(i)},${yAt(p.upper)}` : ""))
    .filter(Boolean)
    .join(" ");
  const lowerPath = pts
    .map((p, i) => (p.lower !== undefined ? `${xAt(i)},${yAt(p.lower)}` : ""))
    .filter(Boolean)
    .join(" ");
  const confidencePolygon =
    upperPath && lowerPath
      ? `${upperPath} ${lowerPath.split(" ").reverse().join(" ")}`
      : "";

  // Y ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((frac) => Math.round(max * frac));
  const xLabelIndexes = pts
    .map((_, i) => i)
    .filter((i) => i % Math.max(1, Math.ceil(pts.length / 8)) === 0);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-56 w-full"
      >
        {/* Grid */}
        {ticks.map((tv, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yAt(tv)}
              y2={yAt(tv)}
              className="stroke-slate-100"
            />
            <text
              x={padL - 6}
              y={yAt(tv) + 4}
              textAnchor="end"
              className="fill-slate-400 text-[10px]"
            >
              {tv.toLocaleString()}
            </text>
          </g>
        ))}
        {/* Separator between actual & forecast */}
        {firstForecastIdx > 0 && (
          <line
            x1={xAt(firstForecastIdx - 0.5)}
            x2={xAt(firstForecastIdx - 0.5)}
            y1={padT}
            y2={padT + innerH}
            className="stroke-slate-300"
            strokeDasharray="3 3"
          />
        )}
        {/* Confidence band */}
        {confidencePolygon && (
          <polygon
            points={confidencePolygon}
            fill="rgba(99,102,241,0.12)"
          />
        )}
        {/* Actual line */}
        <path
          d={actualPath}
          fill="none"
          stroke="hsl(243 75% 59%)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {pts.map((p, i) =>
          p.actual !== undefined ? (
            <circle
              key={"a" + i}
              cx={xAt(i)}
              cy={yAt(p.actual)}
              r={i === lastActualIdx ? 4 : 3}
              fill="hsl(243 75% 59%)"
            />
          ) : null
        )}
        {/* Forecast dashed line */}
        <path
          d={forecastPath}
          fill="none"
          stroke="hsl(243 75% 59%)"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
        {pts.map((p, i) =>
          p.forecast !== undefined ? (
            <circle
              key={"f" + i}
              cx={xAt(i)}
              cy={yAt(p.forecast)}
              r="3"
              fill="hsl(243 75% 59%)"
            />
          ) : null
        )}
        {/* X labels */}
        {xLabelIndexes.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {pts[i].date}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 bg-indigo-500" />
          {t("intel.historical", "Historical")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-indigo-500" />
          {t("intel.forecast", "Forecast")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-indigo-200/60" />
          {t("intel.confidence95", "95% Confidence")}
        </span>
      </div>
    </div>
  );
}
