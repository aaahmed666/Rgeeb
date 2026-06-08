"use client";

import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
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
import {
  Section,
  SummaryCard,
  ScoreRing,
  Bar,
  RankCard,
  ClassCard,
  Heatmap,
  HourlyChart,
  RadarSection,
  BranchComparisonSection,
  insightTone,
  InsightIcon,
  BranchHealthTable,
  Sparkline,
  ServiceBranchMatrix,
  ForecastSection,
} from "@/views/BrIntelligenceHelpers";

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
  // useMemo prevents new object reference every render → avoids duplicate API calls
  const filters: BrIntelligenceFilters = React.useMemo(() => ({
    range,
    customFrom,
    customTo,
    branchId,
    activeService,
    rankTop,
  }), [range, customFrom, customTo, branchId, activeService, rankTop]);

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
            <AsyncPaginatedSelect
                endpoint="/customer/branches"
                labelKey="name"
                valueKey="id"
                extraParams={{ active: 1 }}
                value={branchId === "all" ? null : branchId}
                onChange={(v) => setBranchId(v ?? "all")}
                placeholder="All Branches"
                isClearable
              />
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
