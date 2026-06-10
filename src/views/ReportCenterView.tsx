"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/hooks/usePermission";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DateRange } from "rsuite/DateRangePicker";
import {
  FileText,
  CalendarClock,
  History,
  Download,
  Loader2,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
  Search,
  Users,
  UserCheck,
  TrendingUp,
  Gauge,
  Trash2,
  RefreshCw,
  Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DataTable } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import {
  fetchReportTemplates,
  fetchBranches,
  fetchServices,
  fetchGeneratedReports,
  fetchScheduledReports,
  generateReport,
  triggerDownload,
  downloadReport,
  deleteGeneratedReport,
  deleteScheduledReport,
  scheduleReport,
  toTemplateSlug,
  type ReportFormat,
  type ScheduleReportPayload } from "@/services/reportCenterService";

/* ------------------------------------------------------------------ */
/* Icon registry                                                         */
/* ------------------------------------------------------------------ */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "daily-compliance": ShieldCheck,
  "weekly-summary": BarChart3,
  "monthly-audit": ClipboardCheck,
  "detection-detail": Search,
  attendance: UserCheck,
  "visitor-traffic": Users,
  productivity: TrendingUp,
  "service-performance": Gauge,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

/* ------------------------------------------------------------------ */
/* Chip components                                                       */
/* ------------------------------------------------------------------ */
function FormatChip({ format }: { format: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white",
        format?.toLowerCase() === "pdf" && "bg-slate-800",
        format?.toLowerCase() === "excel" && "bg-emerald-600",
        format?.toLowerCase() === "csv" && "bg-sky-600"
      )}
    >
      {format?.toUpperCase()}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const s = status?.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        (s === "completed" || s === "ready") && "bg-emerald-500 text-white",
        s === "pending" && "bg-amber-400 text-white",
        s === "failed" && "bg-red-500 text-white",
        s !== "completed" &&
          s !== "ready" &&
          s !== "pending" &&
          s !== "failed" &&
          "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

function FrequencyChip({ frequency }: { frequency: string }) {
  const f = frequency?.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium",
        f === "daily" && "border-sky-300 text-sky-600",
        f === "weekly" && "border-amber-300 text-amber-600",
        f === "monthly" && "border-violet-300 text-violet-600"
      )}
    >
      {frequency}
    </span>
  );
}

function formatBadgeClass(f: string) {
  return cn(
    "px-2 py-0.5 text-[10px] font-bold uppercase",
    f === "pdf" && "border-rose-300/60 bg-rose-500/10 text-rose-600",
    f === "excel" && "border-emerald-300/60 bg-emerald-500/10 text-emerald-600",
    f === "csv" && "border-sky-300/60 bg-sky-500/10 text-sky-600"
  );
}

/* ------------------------------------------------------------------ */
/* Schedule Dialog                                                       */
/* ------------------------------------------------------------------ */
interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  templates: Array<{ id: string; title: string }>;
  onSubmit: (payload: ScheduleReportPayload) => void;
  isLoading: boolean;
}

function ScheduleDialog({
  open,
  onClose,
  templates,
  onSubmit,
  isLoading,
}: ScheduleDialogProps) {
  const [template, setTemplate] = useState("");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "weekly"
  );
  const [recipients, setRecipients] = useState("");

  function handleSubmit() {
    if (!template) {
      toast.error("Please select a report template");
      return;
    }
    const emails = recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (!emails.length) {
      toast.error("Please enter at least one recipient email");
      return;
    }
    onSubmit({
      template: toTemplateSlug(template),
      format,
      frequency,
      recipients: emails,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-violet-600" />
            Create Scheduled Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Select
            value={template}
            onValueChange={setTemplate}
          >
            <SelectTrigger>
              <SelectValue placeholder="Report Template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem
                  key={t.id}
                  value={t.id}
                >
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Format
              </label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as ReportFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Frequency
              </label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as typeof frequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder="Recipients (comma-separated emails)"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Create Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Main View                                                            */
/* ------------------------------------------------------------------ */
export default function ReportCenterView() {
  const { t } = useTranslation();
  const can = usePermission("report_center");
  const qc = useQueryClient();
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } = useDebounceSearch("", 300);

  const [dateRange, setDateRange] = useState<DateRange | null>([
    weekAgo,
    today,
  ]);
  const [branch, setBranch] = useState<string>("all");
  const [service, setService] = useState<string>("all");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  /* ── Queries ─────────────────────────────────────────────────────── */
  const templates = useQuery({
    queryKey: ["report-templates"],
    queryFn: fetchReportTemplates,
  });
  const branches = useQuery({
    queryKey: ["report-branches"],
    queryFn: fetchBranches,
  });
  const services = useQuery({
    queryKey: ["report-services"],
    queryFn: fetchServices,
  });
  const generated = useQuery({
    queryKey: ["report-generated"],
    queryFn: fetchGeneratedReports,
  });
  const scheduled = useQuery({
    queryKey: ["report-scheduled"],
    queryFn: fetchScheduledReports,
  });

  /* ── Generate ────────────────────────────────────────────────────── */
  const generateMut = useMutation({
    mutationFn: (cardId: string) => {
      const [from, to] = dateRange ?? [weekAgo, today];
      return generateReport({
        template: toTemplateSlug(cardId),
        format,
        date_from: toISO(from),
        date_to: toISO(to),
        lang: "en",
        branch_id: branch === "all" ? null : branch,
        service_id: service === "all" ? null : service,
      });
    },
    // response.data contains the generated report; download is triggered inside service
    onSuccess: (data) => {
      toast.success(
        data?.title
          ? `"${data.title}" generated successfully`
          : t("reportCenter.toastGenerated", "Report generated successfully")
      );
      qc.invalidateQueries({ queryKey: ["report-generated"] });
    },
    onError: () =>
      toast.error(t("reportCenter.toastFailed", "Failed to generate report")),
  });

  /* ── Download ────────────────────────────────────────────────────── */
  const downloadMut = useMutation({
    mutationFn: (id: string | number) => downloadReport(id),
    onError: () => toast.error("Download failed"),
  });

  /* ── Delete generated ────────────────────────────────────────────── */
  const deleteGenMut = useMutation({
    mutationFn: deleteGeneratedReport,
    onSuccess: () => {
      toast.success("Report deleted");
      qc.invalidateQueries({ queryKey: ["report-generated"] });
    },
    onError: () => toast.error("Failed to delete report"),
  });

  /* ── Schedule ────────────────────────────────────────────────────── */
  const scheduleMut = useMutation({
    mutationFn: scheduleReport,
    onSuccess: () => {
      toast.success("Report scheduled successfully");
      qc.invalidateQueries({ queryKey: ["report-scheduled"] });
      setScheduleOpen(false);
    },
    onError: () => toast.error("Failed to schedule report"),
  });

  /* ── Delete scheduled ────────────────────────────────────────────── */
  const deleteSchedMut = useMutation({
    mutationFn: deleteScheduledReport,
    onSuccess: () => {
      toast.success("Schedule removed");
      qc.invalidateQueries({ queryKey: ["report-scheduled"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reportTypes = templates.data ?? [];

  /* ── Hero ────────────────────────────────────────────────────────── */
  const hero = useMemo(
    () => (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20 backdrop-blur">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {t("reportCenter.title", "Report Center")}
              </h1>
              <p className="mt-1 text-sm text-white/80 sm:text-base">
                {t(
                  "reportCenter.subtitle",
                  "Generate, download, and schedule automated reports"
                )}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => can.create && setScheduleOpen(true)}
            disabled={!can.create}
            className="gap-2 border border-white/25 bg-white/15 text-white shadow-sm backdrop-blur hover:bg-white/25"
          >
            <CalendarClock className="h-4 w-4" />
            {t("reportCenter.scheduleReport", "Schedule Report")}
          </Button>
        </div>
      </div>
    ),
    [t]
  );

  /* ──────────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {hero}

      <Tabs
        defaultValue="generate"
        className="space-y-4"
      >
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger
            value="generate"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {t("reportCenter.generateTab", "Generate Reports")}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {t("reportCenter.historyTab", "Report History")}
          </TabsTrigger>
          <TabsTrigger
            value="scheduled"
            className="gap-2"
          >
            <CalendarClock className="h-4 w-4" />
            {t("reportCenter.scheduledTab", "Scheduled Reports")}
          </TabsTrigger>
        </TabsList>

        {/* ── Generate Reports ───────────────────────────────────────── */}
        <TabsContent
          value="generate"
          className="space-y-5"
        >
          {/* Filters */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-5">
              {/* Date Range – 2 cols */}
              <div className="md:col-span-2">
                <SharedDateRangePicker
                  label={t("reportCenter.dateRange", "Date Range")}
                  value={dateRange}
                  onChange={(val) => setDateRange(val)}
                  placeholder={t(
                    "reportCenter.selectDateRange",
                    "Select Date Range"
                  )}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("reportCenter.branch", "Branch")}
                </label>
                <AsyncPaginatedSelect
                    endpoint="/customer/branches"
                    labelKey="name"
                    valueKey="id"
                    extraParams={{ active: 1 }}
                    value={branch || null}
                    onChange={(v) => setBranch(v ?? "")}
                    placeholder="All Branches"
                    isClearable
                  />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("reportCenter.service", "Service")}
                </label>
                <AsyncPaginatedSelect
                  endpoint="/customer/services"
                  labelKey="name"
                  valueKey="id"
                  value={service === "all" ? null : service}
                  onChange={(v) => setService(v ?? "all")}
                  placeholder={t("common.all", "All")}
                  isClearable
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t("reportCenter.format", "Format")}
                </label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as ReportFormat)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                        PDF
                      </span>
                    </SelectItem>
                    <SelectItem value="excel">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        Excel
                      </span>
                    </SelectItem>
                    <SelectItem value="csv">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
                        CSV
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Report Cards — equal height via grid rows */}
          <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reportTypes.map((r) => {
              const Icon = ICONS[r.id] ?? FileText;
              const isBusy =
                generateMut.isPending && generateMut.variables === r.id;
              const title =
                r.title?.trim() ||
                r.id
                  .replace(/[-_]/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
              const description = r.description?.trim() || "";
              return (
                <Card
                  key={r.id}
                  className="group flex flex-col border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300/60 hover:shadow-md"
                >
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2 text-white shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-[11px] font-semibold leading-snug whitespace-nowrap overflow-hidden">
                        {title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
                      {description}
                    </p>

                    {/* Format badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {(r.formats ?? []).map((f) => (
                        <span
                          key={f}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                            f === "pdf" && "border-rose-300 text-rose-500",
                            f === "excel" &&
                              "border-emerald-300 text-emerald-600",
                            f === "csv" && "border-sky-300 text-sky-600"
                          )}
                        >
                          {f.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    {/* Generate button */}
                    <Button
                      onClick={() => can.create && generateMut.mutate(r.id)}
                      disabled={!can.create || isBusy || generateMut.isPending}
                      className="w-full gap-2 text-xs"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {t("reportCenter.generate", "Generate Report")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Report History ─────────────────────────────────────────── */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-base">Generated Reports</CardTitle>
                <CardDescription>
                  Previously generated reports available for download
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() =>
                  qc.invalidateQueries({ queryKey: ["report-generated"] })
                }
                disabled={generated.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    generated.isFetching && "animate-spin"
                  )}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={(generated.data ?? []).map((h) => ({ ...h, id: h.id ?? String(Math.random()) }))}
                isLoading={generated.isLoading}
                emptyMessage={t("reportCenter.emptyHistory", "No generated reports yet")}
                columns={[
                  { key: "title", header: "Title", render: (h) => <span className="font-medium">{h.title}</span> },
                  { key: "template", header: "Template", render: (h) => <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{h.template}</span> },
                  { key: "format", header: "Format", render: (h) => <FormatChip format={h.format} /> },
                  { key: "status", header: "Status", render: (h) => <StatusChip status={h.status} /> },
                  { key: "generated_at", header: "Generated At", render: (h) => { const ts = h.generated_at ?? h.created_at; return <span className="text-sm text-muted-foreground">{ts ? new Date(ts).toLocaleString() : "—"}</span>; } },
                  {
                    key: "actions", header: "Actions", headClassName: "text-end", cellClassName: "text-end",
                    render: (h) => (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Download"
                          onClick={() => { const url = h.download_url ?? h.file_url; if (url) { triggerDownload(url, `${h.template}-report.${h.format === "excel" ? "xlsx" : h.format}`); } else { downloadMut.mutate(h.id); } }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600" title="Delete" onClick={() => deleteGenMut.mutate(h.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Scheduled Reports ─────────────────────────────────────── */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-base">Scheduled Reports</CardTitle>
                <CardDescription>
                  Automatically generated and emailed reports
                </CardDescription>
              </div>
              <Button
                onClick={() => can.create && setScheduleOpen(true)}
            disabled={!can.create}
                className="gap-2 bg-slate-800 text-white hover:bg-slate-700"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={(scheduled.data ?? [])}
                isLoading={scheduled.isLoading}
                emptyMessage={t("reportCenter.emptyScheduled", "No scheduled reports")}
                columns={[
                  { key: "template", header: "Template", render: (s) => <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{s.template}</span> },
                  { key: "format", header: "Format", render: (s) => <FormatChip format={s.format} /> },
                  { key: "frequency", header: "Frequency", render: (s) => <FrequencyChip frequency={s.frequency} /> },
                  { key: "recipients", header: "Recipients", render: (s) => <span className="max-w-[200px] truncate text-sm text-muted-foreground">{Array.isArray(s.recipients) ? s.recipients.join(", ") : String(s.recipients ?? "—")}</span> },
                  { key: "next_run", header: "Next Send", render: (s) => { const d = s.next_run ?? s.next_send; return <span className="text-sm text-muted-foreground">{d ? new Date(d).toLocaleString() : "—"}</span>; } },
                  { key: "actions", header: "Actions", headClassName: "text-end", cellClassName: "text-end",
                    render: (s) => <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => deleteSchedMut.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button> },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleDialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        templates={reportTypes.map((r) => ({ id: r.id, title: r.title }))}
        onSubmit={(payload) => scheduleMut.mutate(payload)}
        isLoading={scheduleMut.isPending}
      />
    </div>
  );
}
