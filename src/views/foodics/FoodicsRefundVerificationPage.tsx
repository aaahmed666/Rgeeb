"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, ChevronLeft, ChevronRight, Receipt, AlertTriangle,
  AlertOctagon, Percent,
} from "lucide-react";
import { foodicsService, FoodicsRefundVerification, FoodicsRefundStats } from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";

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
  const [refunds, setRefunds] = useState<FoodicsRefundVerification[]>([]);
  const [stats, setStats] = useState<FoodicsRefundStats>({
    total_refunds: 0, suspicious: 0, critical: 0, flagged_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

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
        <p className="text-lg font-semibold text-muted-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view Refund Verifications.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Receipt} label="Total Refunds" value={String(stats.total_refunds)}
          iconColor="text-white" bgColor="bg-indigo-500" />
        <StatCard icon={AlertTriangle} label="Suspicious" value={String(stats.suspicious)}
          iconColor="text-white" bgColor="bg-amber-500" />
        <StatCard icon={AlertOctagon} label="Critical" value={String(stats.critical)}
          iconColor="text-white" bgColor="bg-rose-500" />
        <StatCard icon={Percent} label="Flagged Rate" value={`${stats.flagged_rate}%`}
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
            <option value="">Branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">Status</option>
            <option value="clear">Clear</option>
            <option value="suspicious">Suspicious</option>
            <option value="critical">Critical</option>
          </select>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none" />
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="text-left py-3 px-2">Order Ref</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Refunded At</th>
                <th className="text-left py-3 px-2">AI Status</th>
                <th className="text-left py-3 px-2">Person</th>
                <th className="text-right py-3 px-2">Conf.</th>
                <th className="text-left py-3 px-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No refund verifications found
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
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
            <button onClick={() => setPage(p => Math.min(lastPage, p+1))} disabled={page>=lastPage}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
