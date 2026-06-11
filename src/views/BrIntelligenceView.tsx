"use client";

import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
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
  FileSpreadsheet,
  Flame,
  Grid3x3,
  Heart,
  Info,
  LineChart,
  Medal,
  Printer,
  RefreshCw,
  Search,
  Sigma,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

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
  ScoreRing,
  SummaryCard,
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
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [activeService, setActiveService] = useState("All");
  const [rankTop, setRankTop] = useState<3 | 5 | 10>(3);
  const [openSection, setOpenSection] = useState<string | null>("efficiency");
  const [printMode, setPrintMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [sectionsWithData, setSectionsWithData] = useState<Set<string>>(
    new Set()
  );

  // Expand all sections before printing so they appear in print preview
  React.useEffect(() => {
    const handleBeforePrint = () => {
      document.body.dataset.printing = "true";
    };

    const handleAfterPrint = () => {
      delete document.body.dataset.printing;
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data fetching via custom hook
  // useMemo prevents new object reference every render → avoids duplicate API calls
  const filters: BrIntelligenceFilters = React.useMemo(
    () => ({
      range,
      customFrom,
      customTo,
      branchIds,
      activeService,
      rankTop,
    }),
    [range, customFrom, customTo, branchIds, activeService, rankTop]
  );

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
    reload,
  } = useBrIntelligenceData(filters);

  // Auto-refresh every 60s when enabled (parity with the old dashboard)
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void reload();
    }, 60_000);
    return () => clearInterval(interval);
  }, [autoRefresh, reload]);

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
    <div className="print-rtl space-y-4 p-4 sm:p-6 lg:p-8 print:p-0 print:space-y-3">
      {/* Print title - only visible when printing */}
      <div
        className="print-only mb-4 border-b pb-3"
        style={{ textAlign: "right", direction: "rtl" }}
      >
        <h1 className="text-2xl font-bold">
          {t("intel.title", "ذكاء الفروع")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("intel.printDate", "تاريخ التقرير")}:{" "}
          {new Date().toLocaleDateString("ar-EG")}
        </p>
      </div>
      {/* Banner — hidden when printing */}
      <div className="no-print rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(to right, #0f172a, #1e293b, #1e1b4b)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-indigo-500/20 p-3 backdrop-blur-sm">
              <Brain className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
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
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Multi-branch filter (parity with old dashboard's multi-select) */}
            <div className="w-56 shrink-0">
              <AsyncPaginatedSelect
                endpoint="/customer/branches"
                labelKey="name"
                valueKey="id"
                extraParams={{ active: 1 }}
                isMulti
                values={branchIds}
                onValuesChange={setBranchIds}
                placeholder={t("common.allBranches", "All Branches")}
                isClearable
              />
            </div>
            <div className="flex rounded-lg bg-white/10 p-1 backdrop-blur-sm">
              {(["7", "14", "30"] as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setRange(k);
                    // Clear custom dates when switching to a preset range
                    setCustomFrom("");
                    setCustomTo("");
                  }}
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
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <SharedDateRangePicker
                from={customFrom}
                to={customTo}
                onFromChange={(val) => {
                  setCustomFrom(val);
                  if (val && customTo) setRange("custom");
                }}
                onToChange={(val) => {
                  setCustomTo(val);
                  if (customFrom && val) setRange("custom");
                }}
              />
            </div>
            <button
              onClick={async () => {
                try {
                  const token = getAuthToken();
                  const params = new URLSearchParams({ date_from: from, date_to: to, type: "full" });
                  const res = await fetch(`/api/customer/branch-intelligence/export-report?${params}`, {
                    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                  });
                  if (!res.ok) throw new Error(`Export failed (${res.status})`);
                  const blob = await res.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = objectUrl;
                  a.download = `branch-intelligence-${from}-${to}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(objectUrl);
                } catch (e) {
                  // toast is available in scope via sonner
                  console.error("Export failed:", e);
                }
              }}
              title="Export report"
              className="rounded-md border border-white/20 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                // Build set of ALL sections that have data — print them all
                const dataMap: Record<string, boolean> = {
                  efficiency: efficiency.length > 0,
                  classification: efficiency.length > 0,
                  "branch-comparison": efficiency.length > 0,
                  radar: efficiency.length > 0,
                  rankings: (rankings?.by_score?.length ?? 0) > 0,
                  heatmap: (heatmap?.cells?.length ?? 0) > 0,
                  hourly: (hourly?.length ?? 0) > 0,
                  period: comparison.length > 0,
                  insights: insights.length > 0,
                  health: health.length > 0,
                  matrix: matrix.length > 0,
                  forecast: (forecast?.points?.length ?? 0) > 0,
                  anomaly: anomalies.length > 0,
                };
                const withData = new Set<string>(
                  Object.keys(dataMap).filter((k) => dataMap[k])
                );
                setSectionsWithData(withData);
                setPrintMode(true);
                // Wait for React to render all sections before opening print dialog
                // Increased timeout to allow complex charts/tables to fully render before print
                setTimeout(() => {
                  const htmlEl = document.documentElement;
                  const prevDir = htmlEl.getAttribute("dir") ?? "ltr";

                  const printWrapper = document.querySelector(
                    ".print-rtl"
                  ) as HTMLElement | null;
                  if (printWrapper) {
                    printWrapper.style.width = "100%";
                    printWrapper.style.direction = "rtl";
                  }
                  const allEls: HTMLElement[] = printWrapper
                    ? Array.from(printWrapper.querySelectorAll("*"))
                    : [];

                  type SavedStyle = {
                    el: HTMLElement;
                    direction: string;
                    textAlign: string;
                    flexDirection: string;
                  };
                  const saved: SavedStyle[] = [];

                  allEls.forEach((el) => {
                    const h = el as HTMLElement;
                    const tag = h.tagName.toUpperCase();
                    if (
                      [
                        "TABLE",
                        "TR",
                        "TD",
                        "TH",
                        "THEAD",
                        "TBODY",
                        "SVG",
                        "PATH",
                        "CIRCLE",
                        "G",
                      ].includes(tag)
                    )
                      return;

                    const computed = window.getComputedStyle(h);
                    const display = computed.display;
                    const isFlex =
                      display === "flex" || display === "inline-flex";
                    const isGrid =
                      display === "grid" || display === "inline-grid";
                    const flexDir = computed.flexDirection;
                    const isRowFlex =
                      isFlex &&
                      (flexDir === "row" || flexDir === "row-reverse");

                    saved.push({
                      el: h,
                      direction: h.style.direction,
                      textAlign: h.style.textAlign,
                      flexDirection: h.style.flexDirection,
                    });

                    h.style.direction = "rtl";
                    if (isRowFlex) {
                      h.style.flexDirection = "row-reverse";
                    } else if (isGrid) {
                      // grid inherits direction:rtl automatically
                    } else if (!isFlex) {
                      h.style.textAlign = "right";
                    }
                  });

                  document
                    .querySelectorAll("[data-section-id]")
                    .forEach((el) => {
                      (el as HTMLElement).style.width = "100%";
                    });

                  htmlEl.setAttribute("dir", "rtl");

                  const restoreAfterPrint = () => {
                    htmlEl.setAttribute("dir", prevDir);
                    saved.forEach(
                      ({ el, direction, textAlign, flexDirection }) => {
                        el.style.direction = direction;
                        el.style.textAlign = textAlign;
                        el.style.flexDirection = flexDirection;
                      }
                    );
                    setPrintMode(false);
                    setSectionsWithData(new Set());
                    window.removeEventListener("afterprint", restoreAfterPrint);
                  };
                  window.addEventListener("afterprint", restoreAfterPrint);
                  window.print();
                }, 800);
              }}
              title="Print"
              className="rounded-md border border-white/20 bg-white/5 p-2 text-white/80 hover:bg-white/10"
            >
              <Printer className="h-4 w-4" />
            </button>
            {/* Auto-refresh toggle (60s) — parity with old dashboard */}
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              title={
                autoRefresh
                  ? t("intel.autoRefreshOn", "Auto-refresh ON (60s)")
                  : t("intel.autoRefreshOff", "Enable auto-refresh")
              }
              className={cn(
                "rounded-md border p-2 transition-colors",
                autoRefresh
                  ? "animate-pulse border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        {updatedAt && (
          <p className="mt-2 text-end text-[11px] text-white/60">
            {t("intel.lastUpdated", "Last updated")}:{" "}
            {updatedAt.toLocaleTimeString()}
            {autoRefresh && (
              <span className="ms-1.5 font-semibold text-emerald-400">
                ● {t("intel.live", "LIVE")}
              </span>
            )}
          </p>
        )}
      </div>

      {/* KPI strip */}
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        dir="rtl"
      >
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
        printVisible={
          printMode ? sectionsWithData.has("efficiency") : undefined
        }
        icon={<BarChart3 className="h-5 w-5 text-sky-600" />}
        title={t("intel.efficiencyIndex", "Branch Efficiency Index")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          efficiency[0] && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t("intel.top", "Top")}: {efficiency[0].branch} (
              {Math.round(efficiency[0].score)})
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
                headClassName: "min-w-[120px]",
                cellClassName: "font-medium whitespace-nowrap",
                render: (r) => <span className="font-medium">{r.branch}</span>,
              },
              {
                key: "score",
                header: `${t("intel.score", "Score")} ↓`,
                headClassName: "w-20",
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
                    {t(`intel.status_${r.status}`, r.status)}
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
        printVisible={printMode ? sectionsWithData.has("rankings") : undefined}
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
                {t("intel.top", "Top")} {n}
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
        printVisible={
          printMode ? sectionsWithData.has("classification") : undefined
        }
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
        printVisible={printMode ? sectionsWithData.has("heatmap") : undefined}
        icon={<Flame className="h-5 w-5 text-orange-500" />}
        title={t("intel.detectionHeatmap", "Detection Heatmap")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
            {t("intel.peak", "Peak")}:{" "}
            {heatmap?.cells?.length
              ? (heatmap.cells.length > 0 ? Math.max(...heatmap.cells.map((c) => c.value)) : 0)
              : 0}{" "}
            {t("intel.detections", "detections")}
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
          {t("intel.low", "Low")}
          {["#10b981", "#84cc16", "#f59e0b", "#f97316", "#ef4444"].map((c) => (
            <span
              key={c}
              className="h-3 w-6 rounded"
              style={{ background: c }}
            />
          ))}
          {t("intel.high", "High")}
        </div>
      </Section>

      {/* Branch Comparison */}
      <Section
        id="branch-comparison"
        printVisible={
          printMode ? sectionsWithData.has("branch-comparison") : undefined
        }
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
        printVisible={printMode ? sectionsWithData.has("radar") : undefined}
        icon={<Sparkles className="h-5 w-5 text-violet-500" />}
        title={t("intel.performanceRadar", "Performance Radar")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">
            {efficiency.length} {t("intel.selected", "selected")}
          </span>
        }
      >
        <RadarSection rows={efficiency} />
      </Section>

      {/* Hourly Peak Analysis */}
      <Section
        id="hourly"
        printVisible={printMode ? sectionsWithData.has("hourly") : undefined}
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
        printVisible={printMode ? sectionsWithData.has("period") : undefined}
        icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        title={t("intel.periodOverPeriod", "Period-over-Period")}
        openSection={openSection}
        setOpenSection={setOpenSection}
        meta={
          comparison.length > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {comparison[0]?.delta_pct >= 0 ? "+" : ""}
              {comparison[0]?.delta_pct}% {t("intel.vsPrevious", "vs previous")}
            </span>
          ) : undefined
        }
      >
        {comparison.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">—</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.map((c) => (
              <div
                key={c.metric}
                className="rounded-xl border p-4"
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(`intel.metric_${c.metric.toLowerCase()}`, c.metric)}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-sky-50 p-2">
                    <p className="text-[10px] text-muted-foreground">{t("intel.current", "Current")}</p>
                    <p className="text-lg font-bold text-sky-700 tabular-nums">{c.current.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-[10px] text-muted-foreground">{t("intel.previous", "Previous")}</p>
                    <p className="text-lg font-bold text-slate-600 tabular-nums">{c.previous.toLocaleString()}</p>
                  </div>
                  <div className={cn("rounded-lg p-2", c.delta_pct >= 0 ? "bg-emerald-50" : "bg-rose-50")}>
                    <p className="text-[10px] text-muted-foreground">{t("intel.change", "Change")}</p>
                    <p className={cn("text-lg font-bold tabular-nums", c.delta_pct >= 0 ? "text-emerald-700" : "text-rose-700")}>
                      {c.delta_pct >= 0 ? "+" : ""}{c.delta_pct}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* AI Insights */}
      <Section
        id="insights"
        printVisible={printMode ? sectionsWithData.has("insights") : undefined}
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
                    {t(`intel.insight_${ins.title}`, ins.title)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 ltr:text-left rtl:text-right">
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
        printVisible={printMode ? sectionsWithData.has("health") : undefined}
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
        <BranchHealthTable rows={health} />
      </Section>

      {/* Service × Branch Matrix */}
      <Section
        id="matrix"
        printVisible={printMode ? sectionsWithData.has("matrix") : undefined}
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
        <ServiceBranchMatrix cells={matrix} />
      </Section>

      {/* Trend Forecast */}
      <Section
        id="forecast"
        printVisible={printMode ? sectionsWithData.has("forecast") : undefined}
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
              {t(`intel.direction_${forecast.direction}`, forecast.direction)}{" "}
              (R²: {forecast.r2})
            </span>
          )
        }
      >
        <ForecastSection forecast={forecast} />
      </Section>

      {/* Anomaly Detection */}
      <Section
        id="anomaly"
        printVisible={printMode ? sectionsWithData.has("anomaly") : undefined}
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
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700">
                {t("intel.noAnomalies", "No Anomalies Detected")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("intel.noAnomaliesDesc", "All branches are operating within normal parameters")}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <TrendingUp className="h-3 w-3" />
                {t("intel.zScoreThreshold", "Z-score threshold: 2.0")}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                <Brain className="h-3 w-3" />
                {efficiency.length} {t("intel.branchesMonitored", "branches monitored")}
              </span>
            </div>
          </div>
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
