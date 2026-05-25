"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Brain,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  FileSpreadsheet,
  Flame,
  Grid3x3,
  Heart,
  Info,
  LineChart,
  Medal,
  Printer,
  Search,
  Sigma,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getAuthToken } from "@/lib/api";
import {
  useBrIntelligenceData,
  useBrIntelligenceSummary,
  type BrIntelligenceFilters,
} from "@/components/br-intelligence/useBrIntelligence";
import {
  statusTone,
  type RangeKey,
  rangeFor,
} from "@/components/br-intelligence/utils";
import type {
  HourlyPeak,
  EfficiencyRow,
  HeatmapPayload,
  TrendForecast,
  AiInsight,
  BranchHealth,
  ServiceMatrixCell,
} from "@/services/intelligenceService";

export default function BrIntelligenceView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  // UI state
  const [range, setRange] = useState<RangeKey>("7");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [activeService, setActiveService] = useState("All");
  const [rankTop, setRankTop] = useState<3 | 5 | 10>(3);
  const [openSection, setOpenSection] = useState<string | null>("efficiency");

  // Data fetching via custom hook
  const filters: BrIntelligenceFilters = {
    range,
    customFrom,
    customTo,
    branchId,
    activeService,
    rankTop,
  };

  const {
    efficiency,
    rankings,
    heatmap,
    health,
    matrix,
    insights,
    anomalies,
    forecast,
    hourly,
    comparison,
    services,
    branches,
    loading,
    updatedAt,
  } = useBrIntelligenceData(filters);

  const summary = useBrIntelligenceSummary(efficiency);
  const { from, to } = useMemo(
    () => rangeFor(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  if (!hasPermission("analytics.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Brain className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">
          Access Denied
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have permission to view Branch Intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-500/20 p-3 backdrop-blur-sm">
              <Brain className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {t("intel.title", "Br Intelligence")}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {t(
                  "intel.subtitle",
                  "AI-powered branch performance scoring, rankings, and classification"
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={branchId}
              onValueChange={setBranchId}
            >
              <SelectTrigger className="h-9 w-44 border-white/20 bg-white/10 text-white backdrop-blur-sm [&>svg]:text-white">
                <Building2 className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("analytics.allBranches", "All Branches")}
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg bg-white/10 p-1 backdrop-blur-sm">
              {(["7", "14", "30"] as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition",
                    range === k
                      ? "bg-white !text-slate-900"
                      : "text-white/85 hover:bg-white/10"
                  )}
                >
                  {k} {t("analytics.days", "Days")}
                </button>
              ))}
            </div>
            {/* Custom date range picker */}
            <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/80">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  if (e.target.value && customTo) setRange("custom");
                }}
                className="w-[112px] bg-transparent text-white/90 outline-none [color-scheme:dark]"
              />
              <span>→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  if (customFrom && e.target.value) setRange("custom");
                }}
                className="w-[112px] bg-transparent text-white/90 outline-none [color-scheme:dark]"
              />
            </div>
            <button
              onClick={() => {
                const token = getAuthToken();
                const url = `https://api.dev.rgeeb.com/api/customer/branch-intelligence/export-report?date_from=${from}&date_to=${to}&type=full&token=${token ?? ""}`;
                window.open(url, "_blank");
              }}
              title="Export report"
              className="rounded-md border border-white/20 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="Print"
              className="rounded-md border border-white/20 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            >
              <Printer className="h-4 w-4" />
            </button>
            {updatedAt && (
              <span className="text-[11px] text-white/60">
                {t("intel.lastUpdated", "Last updated")}:{" "}
                {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          icon={<Sparkles className="h-5 w-5" />}
          tint="bg-indigo-100 text-indigo-600"
          value={loading ? null : summary.avg.toFixed(1)}
          label={t("intel.avgScore", "Avg Score")}
          valueClass="text-indigo-600"
        />
        <SummaryCard
          icon={<Trophy className="h-5 w-5" />}
          tint="bg-amber-100 text-amber-600"
          value={loading ? null : summary.outstanding}
          label={t("intel.outstanding", "Outstanding")}
          valueClass="text-amber-600"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5" />}
          tint="bg-yellow-100 text-yellow-600"
          value={loading ? null : summary.needs}
          label={t("intel.needsAttention", "Needs Attention")}
          valueClass="text-yellow-600"
        />
        <SummaryCard
          icon={<AlertCircle className="h-5 w-5" />}
          tint="bg-rose-100 text-rose-600"
          value={loading ? null : summary.critical}
          label={t("intel.critical", "Critical")}
          valueClass="text-rose-600"
        />
      </div>

      {/* Branch Efficiency Index */}
      <Section
        id="efficiency"
        icon={<BarChart3 className="h-5 w-5 text-sky-600" />}
        title={t("intel.efficiencyIndex", "Branch Efficiency Index")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          efficiency[0] && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Top: {efficiency[0].branch} ({Math.round(efficiency[0].score)})
            </span>
          )
        }
      >
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <DataTable
            data={efficiency.map((r, i) => ({ id: r.branch, ...r, _rank: i }))}
            emptyMessage={t("intel.noEfficiency", "No efficiency data")}
            columns={[
              {
                key: "rank",
                header: "#",
                headClassName: "w-8",
                render: (r) => (
                  <Medal
                    className={cn(
                      "h-5 w-5",
                      r._rank === 0
                        ? "text-amber-500"
                        : r._rank === 1
                          ? "text-slate-400"
                          : "text-orange-700"
                    )}
                  />
                ),
              },
              {
                key: "branch",
                header: t("analytics.branch", "Branch"),
                render: (r) => <span className="font-medium">{r.branch}</span>,
              },
              {
                key: "score",
                header: `${t("intel.score", "Score")} ↓`,
                render: (r) => <ScoreRing score={r.score} />,
              },
              {
                key: "compliance",
                header: t("intel.compliance", "Compliance"),
                render: (r) => (
                  <Bar
                    value={r.compliance}
                    good
                  />
                ),
              },
              {
                key: "detections",
                header: t("intel.detections", "Detections"),
                render: (r) => (
                  <span className="tabular-nums">
                    {r.detections.toLocaleString()}
                  </span>
                ),
              },
              {
                key: "violations",
                header: t("analytics.violations", "Violations"),
                render: (r) => (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      r.violations > 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {r.violations} ({r.violation_rate}%)
                  </span>
                ),
              },
              {
                key: "tasks",
                header: t("intel.tasks", "Tasks"),
                render: (r) => (
                  <span className="text-xs text-muted-foreground">
                    {r.tasks_done}/{r.tasks_total} ({r.task_rate}%)
                  </span>
                ),
              },
              {
                key: "trend",
                header: t("intel.trend", "Trend"),
                render: (r) => (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      r.trend >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {r.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {r.trend >= 0 ? "+" : ""}
                    {r.trend}%
                  </span>
                ),
              },
              {
                key: "status",
                header: t("intel.status", "Status"),
                render: (r) => (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      statusTone(r.status)
                    )}
                  >
                    {r.status}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Section>

      {/* Store Rankings */}
      <Section
        id="rankings"
        icon={<Trophy className="h-5 w-5 text-amber-500" />}
        title={t("intel.storeRankings", "Store Rankings")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <div
            className="flex overflow-hidden rounded-md border text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {([3, 5, 10] as const).map((n) => (
              <span
                key={n}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setRankTop(n)}
                onClick={(e) => {
                  e.stopPropagation();
                  setRankTop(n);
                }}
                className={cn(
                  "cursor-pointer px-2 py-1 font-medium",
                  rankTop === n
                    ? "bg-amber-400 text-white"
                    : "bg-white text-slate-600"
                )}
              >
                Top {n}
              </span>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <RankCard
            title={t("intel.byOverallScore", "By Overall Score")}
            icon={<Sparkles className="h-4 w-4 text-indigo-500" />}
            items={rankings?.by_score ?? []}
            valueClass="text-indigo-600"
          />
          <RankCard
            title={t("intel.byDetectionCount", "By Detection Count")}
            icon={<Eye className="h-4 w-4 text-cyan-500" />}
            items={rankings?.by_detections ?? []}
            valueClass="text-cyan-600"
            format={(v) => (typeof v === "number" ? v.toLocaleString() : v)}
          />
          <RankCard
            title={t("intel.byCompliance", "By Compliance Rate")}
            icon={<Target className="h-4 w-4 text-emerald-500" />}
            items={rankings?.by_compliance ?? []}
            valueClass="text-emerald-600"
          />
          <RankCard
            title={t("intel.byTaskCompletion", "By Task Completion")}
            icon={<Activity className="h-4 w-4 text-violet-500" />}
            items={rankings?.by_tasks ?? []}
            valueClass="text-violet-600"
          />
        </div>
      </Section>

      {/* Branch Classification */}
      <Section
        id="classification"
        icon={<Grid3x3 className="h-5 w-5 text-slate-600" />}
        title={t("intel.branchClassification", "Branch Classification")}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ClassCard
            tone="emerald"
            icon={<Trophy className="h-5 w-5" />}
            label={t("intel.outstanding", "Outstanding")}
            items={efficiency.filter((e) => e.status === "Outstanding")}
          />
          <ClassCard
            tone="sky"
            icon={<Target className="h-5 w-5" />}
            label={t("intel.onTarget", "On Target")}
            items={efficiency.filter((e) => e.status === "On Target")}
          />
          <ClassCard
            tone="amber"
            icon={<AlertTriangle className="h-5 w-5" />}
            label={t("intel.needsAttention", "Needs Attention")}
            items={efficiency.filter((e) => e.status === "Needs Attention")}
          />
          <ClassCard
            tone="rose"
            icon={<AlertCircle className="h-5 w-5" />}
            label={t("intel.critical", "Critical")}
            items={efficiency.filter((e) => e.status === "Critical")}
          />
        </div>
      </Section>

      {/* Detection Heatmap */}
      <Section
        id="heatmap"
        icon={<Flame className="h-5 w-5 text-orange-500" />}
        title={t("intel.detectionHeatmap", "Detection Heatmap")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
            Peak: {Math.max(...(heatmap?.cells?.map((c) => c.value) ?? [0]))}{" "}
            detections
          </span>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {services.slice(0, 20).map((s) => (
            <button
              key={s}
              onClick={() => setActiveService(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                activeService === s
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Heatmap data={heatmap} />
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          Low
          {["#10b981", "#84cc16", "#f59e0b", "#f97316", "#ef4444"].map((c) => (
            <span
              key={c}
              className="h-3 w-6 rounded"
              style={{ background: c }}
            />
          ))}
          High
        </div>
      </Section>

      {/* Branch Comparison */}
      <Section
        id="branch-comparison"
        icon={<TrendingUp className="h-5 w-5 text-teal-500" />}
        title={t("intel.branchComparison", "Branch Comparison")}
        openSection={openSection}
        setOpenSection={setOpenSection}
      >
        <BranchComparisonSection rows={efficiency} />
      </Section>

      {/* Performance Radar (simple list view) */}
      <Section
        id="radar"
        icon={<Sparkles className="h-5 w-5 text-violet-500" />}
        title={t("intel.performanceRadar", "Performance Radar")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">
            {efficiency.length} selected
          </span>
        }
      >
        <RadarSection rows={efficiency} />
      </Section>

      {/* Hourly Peak Analysis */}
      <Section
        id="hourly"
        icon={<Clock className="h-5 w-5 text-orange-500" />}
        title={t("intel.hourlyPeak", "Hourly Peak Analysis")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={(() => {
          if (!hourly?.length) return null;
          const peak = hourly.reduce(
            (m, c) => (c.detections > m.detections ? c : m),
            { hour: 0, detections: 0, violations: 0 } as HourlyPeak
          );
          return (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
              Peak: {String(peak.hour).padStart(2, "0")}:00 ({peak.detections})
            </span>
          );
        })()}
      >
        <HourlyChart data={hourly} />
      </Section>

      {/* Period-over-Period */}
      <Section
        id="period"
        icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        title={t("intel.periodOverPeriod", "Period-over-Period")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          comparison.length > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {comparison[0]?.delta_pct >= 0 ? "+" : ""}
              {comparison[0]?.delta_pct}% vs previous
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {comparison.map((c) => (
            <div
              key={c.metric}
              className="rounded-lg border p-4"
            >
              <p className="text-xs uppercase text-muted-foreground">
                {c.metric}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {c.current.toLocaleString()}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  c.delta_pct >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {c.delta_pct >= 0 ? "+" : ""}
                {c.delta_pct}% vs previous ({c.previous.toLocaleString()})
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* AI Insights */}
      <Section
        id="insights"
        icon={<Sparkles className="h-5 w-5 text-fuchsia-500" />}
        title={t("intel.aiInsights", "AI Insights")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-fuchsia-50 px-2.5 py-0.5 text-xs font-medium text-fuchsia-600">
            {insights.length} {t("intel.insightsCount", "insights")}
          </span>
        }
      >
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const tone = insightTone(ins.severity);
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition hover:shadow-sm",
                  tone.bg,
                  tone.border
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    tone.iconBg
                  )}
                >
                  <InsightIcon
                    severity={ins.severity}
                    className={cn("h-5 w-5", tone.icon)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", tone.title)}>
                    {ins.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {ins.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Branch Health */}
      <Section
        id="health"
        icon={<Heart className="h-5 w-5 text-rose-500" />}
        title={t("intel.branchHealth", "Branch Health Dashboard")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600">
            {health.length} {t("intel.branches", "branches")}
          </span>
        }
      >
        <BranchHealthTable
          rows={health}
          t={t}
        />
      </Section>

      {/* Service × Branch Matrix */}
      <Section
        id="matrix"
        icon={<Grid3x3 className="h-5 w-5 text-slate-600" />}
        title={t("intel.serviceMatrix", "Service × Branch Matrix")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
            {new Set(matrix.map((m) => m.branch)).size}{" "}
            {t("intel.branches", "branches")} ×{" "}
            {new Set(matrix.map((m) => m.service)).size}{" "}
            {t("intel.services", "services")}
          </span>
        }
      >
        <ServiceBranchMatrix
          cells={matrix}
          t={t}
        />
      </Section>

      {/* Trend Forecast */}
      <Section
        id="forecast"
        icon={<TrendingDown className="h-5 w-5 text-indigo-500" />}
        title={t("intel.trendForecast", "Trend Forecast")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          forecast && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                forecast.direction === "falling"
                  ? "bg-rose-50 text-rose-600"
                  : forecast.direction === "rising"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-600"
              )}
            >
              {forecast.direction === "falling" ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {forecast.direction} (R²: {forecast.r2})
            </span>
          )
        }
      >
        <ForecastSection forecast={forecast} />
      </Section>

      {/* Anomaly Detection */}
      <Section
        id="anomaly"
        icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
        title={t("intel.anomalyDetection", "Anomaly Detection")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600">
            {anomalies.length} {t("intel.anomaliesFound", "anomalies found")}
          </span>
        }
      >
        {anomalies.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("intel.noAnomalies", "No anomalies detected")}
          </p>
        ) : (
          <div className="space-y-2">
            {anomalies.map((a, i) => {
              const sev =
                a.severity ?? (Math.abs(a.delta) > 50 ? "danger" : "warning");
              const tone =
                sev === "danger"
                  ? {
                      bg: "bg-rose-50/40",
                      border: "border-rose-200",
                      icon: "text-rose-500",
                      badge: "bg-rose-100 text-rose-700",
                    }
                  : {
                      bg: "bg-amber-50/40",
                      border: "border-amber-200",
                      icon: "text-amber-500",
                      badge: "bg-amber-100 text-amber-700",
                    };
              const dir = a.direction ?? (a.value < a.expected ? "down" : "up");
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    tone.bg,
                    tone.border
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70",
                      tone.icon
                    )}
                  >
                    {dir === "down" ? (
                      <TrendingDown className="h-5 w-5" />
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {a.branch}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          tone.badge
                        )}
                      >
                        {sev}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {a.date} — {a.value.toLocaleString()} {a.metric} (
                      {dir === "down" ? "↓" : "↑"} Z-score:{" "}
                      {a.z_score ?? a.delta})
                    </p>
                  </div>
                  <div className="hidden text-end text-[11px] text-muted-foreground sm:block">
                    avg: {a.expected.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Section({
  id,
  icon,
  title,
  meta,
  children,
  openSection,
  setOpenSection,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  openSection: string | null;
  setOpenSection: (id: string | null) => void;
}) {
  const open = openSection === id;
  return (
    <Card className="overflow-hidden">
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
      {open && <div className="border-t px-5 py-4">{children}</div>}
    </Card>
  );
}

function SummaryCard({
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

function ScoreRing({ score }: { score: number }) {
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

function Bar({ value, good }: { value: number; good?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
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

function RankCard({
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
          <Skeleton className="h-6 w-full" />
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

function ClassCard({
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
      <p className="mt-0.5 text-xs opacity-80">{items.length} branches</p>
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

function Heatmap({ data }: { data: HeatmapPayload | null }) {
  if (!data) return <Skeleton className="h-40 w-full" />;
  const cells = data.cells ?? [];
  const dates = data.dates ?? [];
  if (!cells.length || !dates.length)
    return <Skeleton className="h-40 w-full" />;
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
function RowOfHeatmap({
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

function HourlyChart({ data }: { data: HourlyPeak[] }) {
  if (data.length === 0) return <Skeleton className="h-40 w-full" />;
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

function RadarSection({ rows }: { rows: EfficiencyRow[] }) {
  if (rows.length === 0) return <Skeleton className="h-40 w-full" />;
  const metrics = [
    { key: "compliance", label: "Compliance" },
    { key: "score", label: "Score" },
    { key: "task_rate", label: "Tasks" },
    { key: "violation_rate", label: "Violations" },
    { key: "detections", label: "Detections" },
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
                    <span className="text-muted-foreground">{m.label}</span>
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

function BranchComparisonSection({ rows }: { rows: EfficiencyRow[] }) {
  const [selectedA, setSelectedA] = useState<string>("");
  const [selectedB, setSelectedB] = useState<string>("");

  if (rows.length === 0) return <Skeleton className="h-40 w-full" />;

  const branchA = rows.find((r) => r.branch === selectedA) ?? rows[0];
  const branchB =
    rows.find((r) => r.branch === selectedB) ?? rows[1] ?? rows[0];

  const metrics: {
    key: "score" | "compliance" | "violation_rate" | "task_rate";
    label: string;
    max: number;
    unit: string;
    invert?: boolean;
  }[] = [
    { key: "score", label: "Score", max: 100, unit: "" },
    { key: "compliance", label: "Compliance", max: 100, unit: "%" },
    {
      key: "violation_rate",
      label: "Violation Rate",
      max: 100,
      unit: "%",
      invert: true,
    },
    { key: "task_rate", label: "Task Completion", max: 100, unit: "%" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-indigo-500" />
          <select
            value={branchA.branch}
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
            value={branchB.branch}
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
                <span>{m.label}</span>
                {winner !== "tie" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      winner === "A"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-teal-100 text-teal-700"
                    )}
                  >
                    {winner === "A" ? branchA.branch : branchB.branch} wins
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
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${pctA}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-end text-xs font-semibold tabular-nums text-indigo-600">
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
                        className="h-full rounded-full bg-teal-500 transition-all"
                        style={{ width: `${pctB}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-end text-xs font-semibold tabular-nums text-teal-600">
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

function insightTone(s: Sev) {
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

function InsightIcon({
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

function BranchHealthTable({
  rows,
  t,
}: {
  rows: BranchHealth[];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  if (rows.length === 0) return <Skeleton className="h-32 w-full" />;
  const filtered = rows.filter((r) =>
    (r.branch ?? "").toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("intel.searchBranches", "Search branches...")}
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50/50 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} / {rows.length} {t("intel.branches", "branches")}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60">
              <TableHead className="w-10" />
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("intel.branch", "Branch")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <Camera className="me-1 inline h-3.5 w-3.5" />
                {t("intel.cameras", "Cameras")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("intel.detections", "Detections")} ↓
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("analytics.violations", "Violations")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("intel.violPct", "Viol %")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("intel.uptime", "Uptime")}
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {t("intel.trend", "Trend")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r, i) => {
              const camsOn = r.cameras_online ?? 0;
              const camsTot = r.cameras_total ?? 0;
              const camsOk = camsTot > 0 && camsOn / camsTot >= 0.5;
              const violPct = r.viol_pct;
              const uptime = r.uptime_pct ?? 0;
              const isOpen = expanded === r.branch;
              return (
                <React.Fragment key={r.branch ?? i}>
                  <TableRow
                    className="cursor-pointer hover:bg-slate-50/60"
                    onClick={() => setExpanded(isOpen ? null : r.branch)}
                  >
                    <TableCell>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-slate-400 transition",
                          isOpen ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            r.health >= 80
                              ? "bg-emerald-500"
                              : r.health >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          )}
                        />
                        {r.branch}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          camsOk
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        )}
                      >
                        {camsOn}/{camsTot}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-sky-600 tabular-nums">
                      {(r.detections ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "tabular-nums font-semibold",
                        (r.violations ?? 0) > 0
                          ? "text-rose-600"
                          : "text-slate-400"
                      )}
                    >
                      {(r.violations ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {violPct === null || violPct === undefined ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            violPct > 50
                              ? "bg-rose-100 text-rose-700"
                              : violPct > 20
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {violPct}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-rose-100">
                          <div
                            className={cn(
                              "h-full",
                              uptime >= 80
                                ? "bg-emerald-500"
                                : uptime >= 30
                                  ? "bg-amber-500"
                                  : "bg-rose-300"
                            )}
                            style={{ width: `${Math.max(2, uptime)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {uptime}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Sparkline
                        values={r.trend_series ?? []}
                        color="hsl(346 77% 49%)"
                      />
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow
                      key={r.branch + "-d"}
                      className="bg-slate-50/40"
                    >
                      <TableCell
                        colSpan={8}
                        className="px-6 py-3 text-xs text-slate-600"
                      >
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div>
                            <p className="text-muted-foreground">
                              {t("intel.status", "Status")}
                            </p>
                            <p className="mt-0.5 font-semibold">{r.status}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("intel.health", "Health")}
                            </p>
                            <p className="mt-0.5 font-semibold">
                              {r.health}/100
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("intel.cameras", "Cameras")}
                            </p>
                            <p className="mt-0.5 font-semibold">
                              {camsOn} / {camsTot}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("intel.uptime", "Uptime")}
                            </p>
                            <p className="mt-0.5 font-semibold">{uptime}%</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
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

function ServiceBranchMatrix({
  cells,
  t,
}: {
  cells: ServiceMatrixCell[];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (cells.length === 0) return <Skeleton className="h-40 w-full" />;
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
        <span className="ms-1">Low → High</span>
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

function ForecastSection({ forecast }: { forecast: TrendForecast | null }) {
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
          label="Trend"
          icon={
            forecast.direction === "falling" ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            )
          }
          value={
            <span className={cn("capitalize", dirColor)}>
              {forecast.direction}
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
          label="Slope"
          icon={<LineChart className="h-4 w-4 text-sky-500" />}
          value={
            <span className="text-sky-600">{forecast.slope ?? "—"}/day</span>
          }
          tint="bg-sky-50/60 border-sky-200"
        />
        <StatPill
          label="Std Error"
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

function StatPill({
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
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border p-3", tint)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function ForecastChartV2({ forecast }: { forecast: TrendForecast }) {
  const pts = forecast?.points ?? [];
  if (pts.length === 0) return <Skeleton className="h-48 w-full" />;
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
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
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
          Historical
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-indigo-500" />
          Forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded-sm bg-indigo-200/60" />
          95% Confidence
        </span>
      </div>
    </div>
  );
}
