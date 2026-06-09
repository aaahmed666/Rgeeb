"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, ChevronLeft, ChevronRight, CreditCard,
  AlertTriangle, AlertOctagon, Percent, Link2Off, Flag,
} from "lucide-react";
import {
  foodicsService, FoodicsDrawerAudit, FoodicsDrawerStats, PatternFlag,
} from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";
import { ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

const STATUS_COLORS: Record<string, string> = {
  matched: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  unmatched: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  suspicious: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function FoodicsDrawerAuditPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [audits, setAudits] = useState<FoodicsDrawerAudit[]>([]);
  const [patterns, setPatterns] = useState<PatternFlag[]>([]);
  const [stats, setStats] = useState<FoodicsDrawerStats>({
    total_opens: 0, unmatched: 0, suspicious: 0, critical: 0, flagged_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"audit" | "patterns">("audit");

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

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
      setStats(res.stats ?? { total_opens: 0, unmatched: 0, suspicious: 0, critical: 0, flagged_rate: 0 });
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, status, from, to, page]);

  useEffect(() => {
    foodicsService.getBranches().then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const StatCard = ({
    icon: Icon, label, value, bg,
  }: { icon: React.ElementType; label: string; value: string; bg: string }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  if (!hasPermission("foodics.drawer_audits.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">{t("foodics.accessDenied")}</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view Drawer Audit.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={CreditCard} label={t("foodics.openingBalance")} value={String(stats.total_opens)} bg="bg-blue-500" />
        <StatCard icon={Link2Off} label={t("foodics.discrepancy")} value={String(stats.unmatched)} bg="bg-sky-500" />
        <StatCard icon={AlertTriangle} label={t("escalationAlerts.severity")} value={String(stats.suspicious)} bg="bg-amber-500" />
        <StatCard icon={AlertOctagon} label={t("escalationAlerts.critical")} value={String(stats.critical)} bg="bg-rose-500" />
        <StatCard icon={Percent} label={t("intel.compliance")} value={`${stats.flagged_rate}%`} bg="bg-violet-500" />
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
                <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none">
                  <option value="">{t("foodics.branch")}</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none">
                  <option value="">{t("foodics.status")}</option>
                  <option value="matched">{t("common.active")}</option>
                  <option value="unmatched">{t("foodics.discrepancy")}</option>
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
                      <th className="text-left py-3 px-2">ID</th>
                      <th className="text-left py-3 px-2">{t("foodics.status")}</th>
                      <th className="text-left py-3 px-2">{t("admin.subscriptions.user")}</th>
                      <th className="text-left py-3 px-2">Employee ID</th>
                      <th className="text-left py-3 px-2">Matched Order</th>
                      <th className="text-left py-3 px-2">Patterns</th>
                      <th className="text-left py-3 px-2">{t("foodics.date")}</th>
                      <th className="text-left py-3 px-2">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </td></tr>
                    ) : audits.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                        {t("foodics.noCashDrawer")}
                      </td></tr>
                    ) : (
                      audits.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                          <td className="py-3 px-2 font-mono text-xs">{a.id}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"
                            }`}>{a.status}</span>
                          </td>
                          <td className="py-3 px-2">{a.person ?? "—"}</td>
                          <td className="py-3 px-2 font-mono text-xs">{a.employee_id ?? "—"}</td>
                          <td className="py-3 px-2 font-mono text-xs">{a.matched_order ?? "—"}</td>
                          <td className="py-3 px-2">{a.patterns ?? "—"}</td>
                          <td className="py-3 px-2 text-muted-foreground">{a.date}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              STATUS_COLORS[a.verdict] ?? "bg-gray-100 text-gray-600"
                            }`}>{a.verdict}</span>
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
                  <span>Rows per page: 25</span>
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
                  <button onClick={() => setPage(p => Math.min(lastPage,p+1))} disabled={page>=lastPage}
                    className="p-1 rounded hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
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
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                    <div>
                      <p className="font-medium text-card-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-card-foreground">{p.count}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        SEVERITY_COLORS[p.severity] ?? "bg-gray-100 text-gray-600"
                      }`}>{p.severity}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
