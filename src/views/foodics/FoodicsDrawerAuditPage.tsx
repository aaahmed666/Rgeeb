"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  AlertOctagon,
  Percent,
  Link2Off,
  Flag,
  ClipboardCheck,
  CircleCheck,
  ShieldX,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  foodicsService,
  FoodicsDrawerAudit,
  FoodicsDrawerStats,
  PatternFlag,
} from "@/services/foodicsService";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/lib/auth";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

const STATUS_COLORS: Record<string, string> = {
  matched:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  unmatched:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  suspicious:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// Ported from legacy production system (drawer.tsx VERDICT_OPTIONS)
const VERDICT_OPTIONS = [
  {
    value: "legitimate",
    label: "Legitimate",
    icon: CircleCheck,
    cls: "border-emerald-500 text-emerald-600 data-[active=true]:bg-emerald-500 data-[active=true]:text-white",
  },
  {
    value: "fraud",
    label: "Fraud",
    icon: ShieldX,
    cls: "border-rose-500 text-rose-600 data-[active=true]:bg-rose-500 data-[active=true]:text-white",
  },
  {
    value: "inconclusive",
    label: "Inconclusive",
    icon: HelpCircle,
    cls: "border-amber-500 text-amber-600 data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  },
] as const;

export default function FoodicsDrawerAuditPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [audits, setAudits] = useState<FoodicsDrawerAudit[]>([]);
  const [patterns, setPatterns] = useState<PatternFlag[]>([]);
  const [stats, setStats] = useState<FoodicsDrawerStats>({
    total_opens: 0,
    unmatched: 0,
    suspicious: 0,
    critical: 0,
    flagged_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"audit" | "patterns">("audit");

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Manager review (ported from legacy system) ──
  const [reviewTarget, setReviewTarget] = useState<FoodicsDrawerAudit | null>(
    null
  );
  const [verdict, setVerdict] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openReview = (row: FoodicsDrawerAudit) => {
    setReviewTarget(row);
    setVerdict(row.verdict && row.verdict !== "pending" ? row.verdict : "");
    setNotes("");
  };

  const submitReview = async () => {
    if (!reviewTarget || !verdict) return;
    setSubmitting(true);
    try {
      await foodicsService.reviewDrawerAudit(reviewTarget.id, {
        verdict,
        notes,
      });
      toast.success(t("foodics.reviewSubmitted", "Review submitted"));
      setReviewTarget(null);
      fetchAuditsRef.current?.();
    } catch {
      toast.error(t("foodics.reviewFailed", "Review failed"));
    } finally {
      setSubmitting(false);
    }
  };
  const fetchAuditsRef = React.useRef<(() => void) | null>(null);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getDrawerAudits({
        branch_id: branchId || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: 25,
      });
      setAudits(res.data ?? []);
      setPatterns(res.pattern_flags ?? []);
      setStats(
        res.stats ?? {
          total_opens: 0,
          unmatched: 0,
          suspicious: 0,
          critical: 0,
          flagged_rate: 0,
        }
      );
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, status, from, to, page]);

  useEffect(() => {
    fetchAuditsRef.current = fetchAudits;
    fetchAudits();
  }, [fetchAudits]);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    bg,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    bg: string;
  }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  if (!hasPermission("foodics.drawer_audits.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {t("foodics.accessDenied")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have permission to view Drawer Audit.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={CreditCard}
          label={t("foodics.openingBalance")}
          value={String(stats.total_opens)}
          bg="bg-blue-500"
        />
        <StatCard
          icon={Link2Off}
          label={t("foodics.discrepancy")}
          value={String(stats.unmatched)}
          bg="bg-sky-500"
        />
        <StatCard
          icon={AlertTriangle}
          label={t("escalationAlerts.severity")}
          value={String(stats.suspicious)}
          bg="bg-amber-500"
        />
        <StatCard
          icon={AlertOctagon}
          label={t("escalationAlerts.critical")}
          value={String(stats.critical)}
          bg="bg-rose-500"
        />
        <StatCard
          icon={Percent}
          label={t("intel.compliance")}
          value={`${stats.flagged_rate}%`}
          bg="bg-violet-500"
        />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "audit"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="w-4 h-4" /> {t("foodics.cashDrawer")}
          </button>
          <button
            onClick={() => setActiveTab("patterns")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "patterns"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flag className="w-4 h-4" /> {t("intel.anomalyDetection")}
          </button>
        </div>

        <div className="p-4">
          {activeTab === "audit" && (
            <>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="w-48">
                  <AsyncPaginatedSelect
                    endpoint="/customer/branches"
                    labelKey="name"
                    valueKey="id"
                    value={branchId || null}
                    onChange={(v) => {
                      setBranchId(v ?? "");
                      setPage(1);
                    }}
                    placeholder={t("foodics.branch")}
                    height={38}
                    isClearable
                  />
                </div>
                <AsyncPaginatedSelect
                  options={[
                    { value: "matched", label: t("foodics.drawerStatus.matched") },
                    { value: "unmatched", label: t("foodics.drawerStatus.unmatched") },
                    { value: "suspicious", label: t("foodics.drawerStatus.suspicious") },
                    { value: "critical", label: t("foodics.drawerStatus.critical") },
                  ]}
                  value={status || null}
                  onChange={(v) => {
                    setStatus(v ?? "");
                    setPage(1);
                  }}
                  placeholder={t("foodics.drawerStatus.all")}
                  height={38}
                  isClearable
                />
                <SharedDateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>

              <DataTable<FoodicsDrawerAudit>
                data={audits}
                isLoading={loading}
                emptyMessage={t("foodics.noCashDrawer")}
                columns={[
                  {
                    key: "id",
                    header: t("common.id", "ID"),
                    cellClassName: "font-mono text-xs",
                    render: (a) => a.id,
                  },
                  {
                    key: "status",
                    header: t("foodics.status"),
                    render: (a) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {a.status}
                      </span>
                    ),
                  },
                  {
                    key: "person",
                    header: t("admin.subscriptions.user"),
                    render: (a) => a.person ?? "—",
                  },
                  {
                    key: "employee_id",
                    header: t("foodics.employeeId", "Employee ID"),
                    cellClassName: "font-mono text-xs",
                    render: (a) => a.employee_id ?? "—",
                  },
                  {
                    key: "matched_order",
                    header: t("foodics.matchedOrder", "Matched Order"),
                    cellClassName: "font-mono text-xs",
                    render: (a) => a.matched_order ?? "—",
                  },
                  {
                    key: "patterns",
                    header: t("foodics.patterns", "Patterns"),
                    render: (a) => a.patterns ?? "—",
                  },
                  {
                    key: "date",
                    header: t("foodics.date"),
                    cellClassName: "text-muted-foreground",
                    render: (a) => a.date,
                  },
                  {
                    key: "verdict",
                    header: t("foodics.verdict"),
                    render: (a) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[a.verdict] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {a.verdict}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    header: t("common.actions", "Actions"),
                    render: (a) => (
                      <button
                        onClick={() => openReview(a)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition"
                        title={t("foodics.review", "Review")}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {t("foodics.review", "Review")}
                      </button>
                    ),
                  },
                ]}
              />

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {total === 0
                    ? "0–0 of 0"
                    : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)} of ${total}`}
                </span>
                <div className="flex items-center gap-2">
                  <span>Rows per page: 25</span>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage}
                    className="p-1 rounded hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "patterns" && (
            <div className="space-y-3">
              {patterns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t("intel.noAnomalies")}
                </div>
              ) : (
                patterns.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background"
                  >
                    <div>
                      <p className="font-medium text-card-foreground">
                        {p.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-card-foreground">
                        {p.count}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          SEVERITY_COLORS[p.severity] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manager review dialog (ported from legacy production system) */}
      {reviewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !submitting && setReviewTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {t("foodics.reviewDrawerAudit", "Review Drawer Audit")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                #{reviewTarget.id} · {reviewTarget.person ?? "—"} ·{" "}
                {reviewTarget.date}
              </p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  STATUS_COLORS[reviewTarget.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {reviewTarget.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground mb-2">
                {t("foodics.verdict", "Verdict")}
              </p>
              <div className="flex gap-2">
                {VERDICT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      data-active={verdict === opt.value}
                      onClick={() => setVerdict(opt.value)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${opt.cls}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t(`foodics.verdict_${opt.value}`, opt.label)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground mb-2">
                {t("foodics.reviewNotes", "Notes")}
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                placeholder={t(
                  "foodics.reviewNotesPlaceholder",
                  "Optional notes about this review…"
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReviewTarget(null)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                onClick={submitReview}
                disabled={!verdict || submitting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("foodics.submitReview", "Submit Review")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
