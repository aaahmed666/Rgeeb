"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, CheckCircle2, AlertCircle, ShoppingCart, DollarSign,
  Ticket, ArrowRightLeft, Receipt, CreditCard, ChefHat, Package,
  ClipboardList, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";
import { foodicsService, FoodicsDashboard } from "@/services/foodicsService";

function fmt(n: number | null, decimals = 2): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

export default function FoodicsDashboardPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<FoodicsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getDashboard({
        branch_id: branchId || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [branchId, from, to]);

  useEffect(() => {
    foodicsService.getBranches().then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const s = data?.stats;

  if (!hasPermission("foodics.dashboard.overview")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view the Foodics Dashboard.</p>
      </div>
    );
  }

  const StatCard = ({
    icon: Icon, label, value, sub, bg,
  }: { icon: React.ElementType; label: string; value: string; sub?: string; bg: string }) => (
    <div className={`rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden ${bg}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-white/80" />
        <p className="text-xs text-white/80 uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/60">{sub}</p>}
      <div className="absolute right-4 bottom-2 opacity-10">
        <Icon className="w-16 h-16 text-white" />
      </div>
    </div>
  );

  const TrendRow = ({
    icon: Icon, label, detail, color,
  }: { icon: React.ElementType; label: string; detail: string; color: string }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="text-sm font-medium text-card-foreground">{label}</p>
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h1 className="text-xl font-bold text-card-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Foodics Intelligence
        </h1>
        <div className="flex flex-wrap gap-2">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none">
            <option value="">Branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Main stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ShoppingCart} label="Total Orders" value={String(s?.total_orders ?? 0)} bg="bg-gradient-to-br from-indigo-500 to-purple-600" />
            <StatCard icon={DollarSign} label="Total Revenue" value={`${fmt(s?.total_revenue ?? 0)}`} bg="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <StatCard icon={Ticket} label="Avg Ticket" value={`${fmt(s?.avg_ticket ?? null)}`} bg="bg-gradient-to-br from-sky-500 to-cyan-600" />
            <StatCard icon={ArrowRightLeft} label="Conversion Rate"
              value={s?.conversion_rate != null ? `${fmt(s.conversion_rate)}%` : "—"}
              bg="bg-gradient-to-br from-amber-500 to-orange-600" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Receipt} label="Suspicious Refunds"
              value={String(s?.suspicious_refunds ?? 0)}
              sub={`${fmt(s?.suspicious_refunds_pct ?? 0, 1)}% of orders`}
              bg="bg-gradient-to-br from-rose-500 to-red-600" />
            <StatCard icon={CreditCard} label="Drawer Flags"
              value={String(s?.drawer_flags ?? 0)}
              sub={`${fmt(s?.drawer_flags_pct ?? 0, 1)}% of opens`}
              bg="bg-gradient-to-br from-orange-500 to-amber-600" />
            <StatCard icon={ChefHat} label="Avg Kitchen Prep"
              value={s?.avg_kitchen_prep != null ? `${fmt(s.avg_kitchen_prep, 0)}m` : "—"}
              sub={`${fmt(s?.avg_kitchen_matched_pct ?? 0, 0)}% matched`}
              bg="bg-gradient-to-br from-violet-500 to-purple-600" />
            <StatCard icon={Package} label="Inventory Issues"
              value={String(s?.inventory_issues ?? 0)}
              sub={`${s?.inventory_audits_total ?? 0} total audits`}
              bg="bg-gradient-to-br from-pink-500 to-rose-600" />
          </div>

          {/* Bottom row: AI Insights + Trend Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                AI Insights
              </h3>
              {data?.ai_insights?.all_clear ? (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-300">All Clear</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      No anomalies detected for this period. Operations are running normally.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.ai_insights?.summary && (
                    <p className="text-sm text-muted-foreground">{data.ai_insights.summary}</p>
                  )}
                  {(data?.ai_insights?.anomalies ?? []).map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trend Summary */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trend Summary
              </h3>
              <div className="space-y-3">
                <TrendRow
                  icon={ShoppingCart} label="Orders" color="bg-indigo-500"
                  detail={`${data?.trends?.orders?.days ?? 0} days of data • ${data?.trends?.orders?.total ?? 0} total orders`}
                />
                <TrendRow
                  icon={ChefHat} label="Prep Times" color="bg-amber-500"
                  detail={`${data?.trends?.prep_times?.data_points ?? 0} data points • avg ${
                    data?.trends?.prep_times?.avg != null ? `${fmt(data.trends.prep_times.avg, 0)}m` : "—"
                  }`}
                />
                <TrendRow
                  icon={ArrowRightLeft} label="Conversion" color="bg-sky-500"
                  detail={`${data?.trends?.conversion?.days ?? 0} days • ${data?.trends?.conversion?.visitors ?? 0} total visitors`}
                />
                <TrendRow
                  icon={Receipt} label="Refunds" color="bg-rose-500"
                  detail={`${data?.trends?.refunds?.records ?? 0} records • ${data?.trends?.refunds?.total ?? 0} total refunds`}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
