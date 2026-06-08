"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, PersonStanding, ShoppingCart, ArrowRightLeft,
  DollarSign, TrendingUp, Calendar, Clock,
} from "lucide-react";
import { foodicsService, FoodicsFootfallRecord, FoodicsFootfallStats, HourlyBreakdown } from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";
import { ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";

function fmt(n: number | null, decimals = 2): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

export default function FoodicsFootfallPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<FoodicsFootfallRecord[]>([]);
  const [hourly, setHourly] = useState<HourlyBreakdown[]>([]);
  const [stats, setStats] = useState<FoodicsFootfallStats>({
    total_footfall: 0, total_orders: 0, conversion_rate: null,
    total_revenue: 0, revenue_per_visitor: null, avg_daily_footfall: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"daily" | "hourly">("daily");

  const [branchId, setBranchId] = useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);
  const from = dateRange ? dateRange[0].toISOString().split("T")[0] : "";
  const to = dateRange ? dateRange[1].toISOString().split("T")[0] : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await foodicsService.getFootfall({
        branch_id: branchId || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setRecords(res.data ?? []);
      setHourly(res.hourly_breakdown ?? []);
      setStats(res.stats ?? {
        total_footfall: 0, total_orders: 0, conversion_rate: null,
        total_revenue: 0, revenue_per_visitor: null, avg_daily_footfall: 0,
      });
    } catch {
      setRecords([]);
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

  const StatCard = ({
    icon: Icon, label, value, bg,
  }: { icon: React.ElementType; label: string; value: string; bg: string }) => (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide text-center">{label}</p>
      <p className="text-xl font-bold text-card-foreground">{value}</p>
    </div>
  );

  // Compute max for bar chart
  const maxFootfall = Math.max(...records.map((r) => r.footfall), 1);

  if (!hasPermission("foodics.branches.customersServed")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">You don&apos;t have permission to view Footfall Analytics.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={PersonStanding} label="Total Footfall" value={String(stats.total_footfall)} bg="bg-indigo-500" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={String(stats.total_orders)} bg="bg-emerald-500" />
        <StatCard icon={ArrowRightLeft} label="Conversion Rate" value={stats.conversion_rate != null ? `${fmt(stats.conversion_rate)}%` : "—"} bg="bg-slate-500" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`SAR ${fmt(stats.total_revenue)}`} bg="bg-sky-500" />
        <StatCard icon={TrendingUp} label="Revenue/Visitor" value={stats.revenue_per_visitor != null ? `SAR ${fmt(stats.revenue_per_visitor)}` : "—"} bg="bg-violet-500" />
        <StatCard icon={Calendar} label="Avg Daily Footfall" value={String(stats.avg_daily_footfall)} bg="bg-amber-500" />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "daily" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" /> Daily Summary
          </button>
          <button
            onClick={() => setActiveTab("hourly")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "hourly" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" /> Hourly Breakdown
          </button>
        </div>

        <div className="p-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={branchId} onChange={(e) => { setBranchId(e.target.value); }}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none">
              <option value="">Branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : activeTab === "daily" ? (
            records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No conversion data available for this period.
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.date} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-card-foreground">{r.date}</span>
                      <span className="text-xs text-muted-foreground">{r.branch_name}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Footfall</p>
                        <p className="font-semibold">{r.footfall}</p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${(r.footfall / maxFootfall) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Orders</p>
                        <p className="font-semibold">{r.orders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conversion</p>
                        <p className="font-semibold">{fmt(r.conversion_rate)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold">SAR {fmt(r.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            hourly.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hourly data available for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                      <th className="text-left py-3 px-2">Hour</th>
                      <th className="text-right py-3 px-2">Avg Footfall</th>
                      <th className="text-right py-3 px-2">Avg Orders</th>
                      <th className="text-right py-3 px-2">Avg Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourly.map((h) => (
                      <tr key={h.hour} className="border-b border-border/50 hover:bg-muted/30 transition">
                        <td className="py-3 px-2 font-medium">{h.hour}:00</td>
                        <td className="py-3 px-2 text-right">{fmt(h.avg_footfall, 0)}</td>
                        <td className="py-3 px-2 text-right">{fmt(h.avg_orders, 0)}</td>
                        <td className="py-3 px-2 text-right">{fmt(h.avg_conversion)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
