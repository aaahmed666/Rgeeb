"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, ChevronLeft, ChevronRight, Receipt, AlertTriangle,
  AlertOctagon, Percent, ClipboardCheck, CircleCheck, ShieldX, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { foodicsService, FoodicsRefundVerification, FoodicsRefundStats } from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

// Ported from legacy production system (refunds.tsx VERDICT_OPTIONS)
const VERDICT_OPTIONS = [
  { value: "legitimate", label: "Legitimate", icon: CircleCheck, cls: "border-emerald-500 text-emerald-600 data-[active=true]:bg-emerald-500 data-[active=true]:text-white" },
  { value: "fraud", label: "Fraud", icon: ShieldX, cls: "border-rose-500 text-rose-600 data-[active=true]:bg-rose-500 data-[active=true]:text-white" },
  { value: "inconclusive", label: "Inconclusive", icon: HelpCircle, cls: "border-amber-500 text-amber-600 data-[active=true]:bg-amber-500 data-[active=true]:text-white" },
] as const;

const VERDICT_COLORS: Record<string, string> = {
  clear: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  suspicious: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const AI_STATUS_COLORS: Record<string, string> = {
  matched: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  unmatched: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export default function FoodicsRefundVerificationPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [refunds, setRefunds] = useState<FoodicsRefundVerification[]>([]);
  const [stats, setStats] = useState<FoodicsRefundStats>({
    total_refunds: 0, suspicious: 0, critical: 0, flagged_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Manager review (ported from legacy system) ──
  const [reviewTarget, setReviewTarget] = useState<FoodicsRefundVerification | null>(null);
  const [verdict, setVerdict] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fetchRefundsRef = useRef<(() => void) | null>(null);

  const openReview = (row: FoodicsRefundVerification) => {
    setReviewTarget(row);
    setVerdict(row.verdict && !["pending", "clear"].includes(row.verdict) ? row.verdict : "");
    setNotes("");
  };

  const submitReview = async () => {
    if (!reviewTarget || !verdict) return;
    const reviewId = reviewTarget.id ?? reviewTarget.order_ref;
    setSubmitting(true);
    try {
      await foodicsService.reviewRefund(reviewId, { verdict, notes });
      toast.success(t("foodics.reviewSubmitted", "Review submitted"));
      setReviewTarget(null);
      fetchRefundsRef.current?.();
    } catch {
      toast.error(t("foodics.reviewFailed", "Review failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getRefunds({
        branch_id: branchId || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: 25,
      });
      setRefunds(res.data ?? []);
      setStats(res.stats ?? { total_refunds: 0, suspicious: 0, critical: 0, flagged_rate: 0 });
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, status, from, to, page]);

  useEffect(() => {
    foodicsService.getBranches().then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRefundsRef.current = fetchRefunds;
    fetchRefunds();
  }, [fetchRefunds]);

  const StatCard = ({
    icon: Icon, label, value, iconColor, bgColor,
  }: { icon: React.ElementType; label: string; value: string; iconColor: string; bgColor: string }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  if (!hasPermission("foodics.refund_verifications.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">{t("foodics.accessDenied")}</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view Refund Verifications.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Receipt} label={t("foodics.refund")} value={String(stats.total_refunds)}
          iconColor="text-white" bgColor="bg-indigo-500" />
        <StatCard icon={AlertTriangle} label={t("escalationAlerts.severity")} value={String(stats.suspicious)}
          iconColor="text-white" bgColor="bg-amber-500" />
        <StatCard icon={AlertOctagon} label={t("escalationAlerts.critical")} value={String(stats.critical)}
          iconColor="text-white" bgColor="bg-rose-500" />
        <StatCard icon={Percent} label={t("intel.compliance")} value={`${stats.flagged_rate}%`}
          iconColor="text-white" bgColor="bg-violet-500" />
      </div>

      {/* Filters + Table */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={branchId}
            onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">{t("foodics.branch")}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">{t("foodics.status")}</option>
            <option value="clear">{t("serviceMonitor.safe")}</option>
            <option value="suspicious">{t("escalationAlerts.severity")}</option>
            <option value="critical">{t("escalationAlerts.critical")}</option>
          </select>
          <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="text-left py-3 px-2">{t("foodics.reference")}</th>
                <th className="text-right py-3 px-2">{t("admin.subscriptions.amount")}</th>
                <th className="text-left py-3 px-2">{t("foodics.type")}</th>
                <th className="text-left py-3 px-2">{t("foodics.date")}</th>
                <th className="text-left py-3 px-2">{t("foodics.status")}</th>
                <th className="text-left py-3 px-2">{t("admin.subscriptions.user")}</th>
                <th className="text-right py-3 px-2">Conf.</th>
                <th className="text-left py-3 px-2">{t("common.status")}</th>
                <th className="text-left py-3 px-2">{t("common.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">
                  {t("foodics.noRefunds")}
                </td></tr>
              ) : (
                refunds.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition">
                    <td className="py-3 px-2 font-mono text-xs text-primary">{r.order_ref}</td>
                    <td className="py-3 px-2 text-right font-medium">SAR {r.amount.toFixed(2)}</td>
                    <td className="py-3 px-2">{r.type}</td>
                    <td className="py-3 px-2 text-muted-foreground">{r.refunded_at}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        AI_STATUS_COLORS[r.ai_status] ?? "bg-gray-100 text-gray-600"
                      }`}>{r.ai_status}</span>
                    </td>
                    <td className="py-3 px-2">{r.person ?? "—"}</td>
                    <td className="py-3 px-2 text-right">{r.confidence != null ? `${r.confidence}%` : "—"}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        VERDICT_COLORS[r.verdict] ?? "bg-gray-100 text-gray-600"
                      }`}>{r.verdict}</span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => openReview(r)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition"
                        title={t("foodics.review", "Review")}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        {t("foodics.review", "Review")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total === 0 ? "0–0 of 0" : `${(page-1)*25+1}–${Math.min(page*25,total)} of ${total}`}</span>
          <div className="flex items-center gap-2">
            <span>{t("admin.common.rowsPerPage")}: 25</span>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
            <button onClick={() => setPage(p => Math.min(lastPage, p+1))} disabled={page>=lastPage}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      {/* Manager review dialog (ported from legacy production system) */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && setReviewTarget(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">{t("foodics.reviewRefund", "Review Refund")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {reviewTarget.order_ref} · SAR {reviewTarget.amount.toFixed(2)} · {reviewTarget.refunded_at}
              </p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                AI_STATUS_COLORS[reviewTarget.ai_status] ?? "bg-gray-100 text-gray-600"
              }`}>{reviewTarget.ai_status}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground mb-2">{t("foodics.verdict", "Verdict")}</p>
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
              <p className="text-sm font-medium text-card-foreground mb-2">{t("foodics.reviewNotes", "Notes")}</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                placeholder={t("foodics.reviewNotesPlaceholder", "Optional notes about this review…")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setReviewTarget(null)} disabled={submitting}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition">
                {t("common.cancel", "Cancel")}
              </button>
              <button onClick={submitReview} disabled={!verdict || submitting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
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
