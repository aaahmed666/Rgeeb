"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
  FileText,
  CalendarRange,
  Download,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  downloadTaskReport,
  type TaskReportType,
} from "@/services/taskReportsService";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";

type ReportCardDef = {
  type: TaskReportType;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
  badge: "PDF" | "CSV";
  tags: { key: string; fallback: string }[];
  gradient: string;
  iconBg: string;
  tagClass: string;
  buttonClass: string;
};

const REPORTS: ReportCardDef[] = [
  {
    type: "performance",
    icon: BarChart3,
    titleKey: "taskReports.performance.title",
    titleFallback: "Task Performance Report",
    descKey: "taskReports.performance.desc",
    descFallback:
      "Comprehensive task metrics, worker performance, and completion analytics",
    badge: "PDF",
    tags: [
      { key: "taskReports.tags.kpi", fallback: "KPI Dashboard" },
      { key: "taskReports.tags.leaderboard", fallback: "Worker Leaderboard" },
      { key: "taskReports.tags.statusBreakdown", fallback: "Status Breakdown" },
      { key: "taskReports.tags.recentTasks", fallback: "Recent Tasks" },
    ],
    gradient: "from-indigo-500 via-violet-500 to-purple-600",
    iconBg: "bg-white/15 text-white",
    tagClass: "border-violet-300/40 bg-violet-500/10 text-violet-100",
    buttonClass:
      "bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-95",
  },
  {
    type: "sla-compliance",
    icon: ShieldCheck,
    titleKey: "taskReports.sla.title",
    titleFallback: "SLA Compliance Report",
    descKey: "taskReports.sla.desc",
    descFallback:
      "Service level agreement tracking, overdue analysis, branch breakdown",
    badge: "PDF",
    tags: [
      { key: "taskReports.tags.slaGauge", fallback: "SLA Gauge" },
      { key: "taskReports.tags.branchBreakdown", fallback: "Branch Breakdown" },
      { key: "taskReports.tags.overdue", fallback: "Overdue Analysis" },
    ],
    gradient: "from-emerald-500 via-teal-500 to-green-600",
    iconBg: "bg-white/15 text-white",
    tagClass: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
    buttonClass:
      "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-95",
  },
  {
    type: "verification-accuracy",
    icon: CheckCircle2,
    titleKey: "taskReports.verification.title",
    titleFallback: "Verification Accuracy Report",
    descKey: "taskReports.verification.desc",
    descFallback:
      "AI verification pass/fail rates, confidence scores, corrective tasks",
    badge: "PDF",
    tags: [
      { key: "taskReports.tags.passFail", fallback: "Pass/Fail Rates" },
      { key: "taskReports.tags.confidence", fallback: "Confidence Scores" },
      { key: "taskReports.tags.corrective", fallback: "Corrective Tasks" },
    ],
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    iconBg: "bg-white/15 text-white",
    tagClass: "border-amber-300/40 bg-amber-500/10 text-amber-100",
    buttonClass:
      "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-95",
  },
  {
    type: "export-csv",
    icon: FileSpreadsheet,
    titleKey: "taskReports.csv.title",
    titleFallback: "Export Tasks (CSV)",
    descKey: "taskReports.csv.desc",
    descFallback: "Download all tasks with full details in spreadsheet format",
    badge: "CSV",
    tags: [
      { key: "taskReports.tags.fullData", fallback: "Full Task Data" },
      { key: "taskReports.tags.assignee", fallback: "Assignee Details" },
      { key: "taskReports.tags.slaStatus", fallback: "SLA Status" },
      { key: "taskReports.tags.dateRanges", fallback: "Date Ranges" },
    ],
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    iconBg: "bg-white/15 text-white",
    tagClass: "border-sky-300/40 bg-sky-500/10 text-sky-100",
    buttonClass:
      "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-95",
  },
];

export default function TaskReportsView() {
  const { t } = useTranslation();
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>([
    monthAgo,
    now,
  ]);

  const from = dateRange ? dateRange[0].toISOString().slice(0, 10) : "";
  const to = dateRange ? dateRange[1].toISOString().slice(0, 10) : "";

  const days = useMemo(() => {
    if (!dateRange) return 0;
    const diff = (dateRange[1].getTime() - dateRange[0].getTime()) / 86400000;
    return Math.max(0, Math.round(diff));
  }, [dateRange]);

  const mutation = useMutation({
    mutationFn: async (type: TaskReportType) =>
      downloadTaskReport(type, { dateFrom: from, dateTo: to }),
    onSuccess: () =>
      toast.success(t("taskReports.downloadStarted", "Download started")),
    onError: (e: Error) =>
      toast.error(
        e.message || t("taskReports.downloadFailed", "Download failed")
      ),
  });

  const activeType = mutation.isPending
    ? (mutation.variables as TaskReportType)
    : null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 text-white shadow-lg">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("taskReports.title", "Task Reports")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "taskReports.subtitle",
              "Generate and download PDF reports for task performance and SLA compliance"
            )}
          </p>
        </div>
      </header>

      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 p-4 sm:p-6">
          <div className="mb-3 flex items-center gap-2 text-white">
            <CalendarRange className="h-5 w-5" />
            <h2 className="text-base font-semibold">
              {t("taskReports.dateRange", "Date Range")}
            </h2>
          </div>
          <div className="rounded-xl bg-white/95 p-3 sm:p-4 dark:bg-card">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <SharedDateRangePicker
                  value={dateRange}
                  onChange={(val) =>
                    setDateRange(val ? (val as unknown as [Date, Date]) : null)
                  }
                  placeholder={t(
                    "taskReports.selectDateRange",
                    "Select Date Range"
                  )}
                />
              </div>
              <div className="flex items-center justify-center rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                {days} {t("taskReports.days", "days")}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {REPORTS.map((r) => (
          <ReportCard
            key={r.type}
            def={r}
            loading={activeType === r.type}
            disabled={!from || !to || from > to || mutation.isPending}
            onDownload={() => mutation.mutate(r.type)}
          />
        ))}
      </div>
    </div>
  );
}

function ReportCard({
  def,
  loading,
  disabled,
  onDownload,
}: {
  def: ReportCardDef;
  loading: boolean;
  disabled: boolean;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const Icon = def.icon;
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className={cn("bg-gradient-to-r p-4 sm:p-5", def.gradient)}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              def.iconBg
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 text-white">
            <h3 className="text-lg font-semibold leading-tight">
              {t(def.titleKey, def.titleFallback)}
            </h3>
            <p className="mt-1 text-sm text-white/85">
              {t(def.descKey, def.descFallback)}
            </p>
          </div>
          <Badge className="bg-white/20 text-white hover:bg-white/30">
            {def.badge}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-4 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {def.tags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {t(tag.key, tag.fallback)}
            </span>
          ))}
        </div>
        <Button
          className={cn("w-full gap-2", def.buttonClass)}
          disabled={disabled}
          onClick={onDownload}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {def.badge === "CSV"
            ? t("taskReports.downloadCsv", "Download CSV")
            : t("taskReports.downloadPdf", "Download PDF")}
        </Button>
      </CardContent>
    </Card>
  );
}
