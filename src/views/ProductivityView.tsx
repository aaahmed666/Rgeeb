"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  FileText,
  Hourglass,
  Mail,
  Medal,
  PieChart,
  Trophy,
  User,
  UserCheck,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";
import {
  productivityService,
  type DepartmentRanking,
  type EmployeeDetail,
  type LeaderboardRow,
  type ProductivitySummary,
} from "@/services/productivityService";

type TabKey = "overview" | "leaderboard" | "departments" | "employee";

export default function ProductivityView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [summary, setSummary] = useState<ProductivitySummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRanking[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive primitive date strings directly — no useMemo object
  const dateFrom = dateRange?.[0]
    ? dateRange[0].toISOString().slice(0, 10)
    : undefined;
  const dateTo = dateRange?.[1]
    ? dateRange[1].toISOString().slice(0, 10)
    : undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const filters = { dateFrom, dateTo };
    void Promise.all([
      productivityService.summary(filters),
      productivityService.leaderboard(filters),
      productivityService.departments(filters),
    ]).then(([s, l, d]) => {
      if (cancelled) return;
      setSummary(s);
      setLeaderboard(l);
      setDepartments(d);
      if (l.length && !selectedEmployee) setSelectedEmployee(l[0].id);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedEmployee || tab !== "employee") return;
    let cancelled = false;
    void productivityService
      .employee(selectedEmployee, { dateFrom, dateTo })
      .then((e) => {
        if (!cancelled) setEmployee(e);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedEmployee, tab, dateFrom, dateTo]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "overview",
      label: t("productivity.overview", "Overview"),
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      key: "leaderboard",
      label: t("productivity.leaderboard", "Leaderboard"),
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      key: "departments",
      label: t("productivity.departments", "Departments"),
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      key: "employee",
      label: t("productivity.employeeDetail", "Employee Detail"),
      icon: <User className="h-4 w-4" />,
    },
  ];

  // Read guard via aliases in auth.tsx

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {t("productivity.title", "Productivity Analytics")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              "productivity.subtitle",
              "Employee performance scores and department insights"
            )}
          </p>
        </div>
        <div className="flex flex-nowrap items-center gap-2">
          <div className="min-w-0 flex-1 sm:w-64">
            <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={t(
                "productivity.selectDateRange",
                "Select date range"
              )}
            />
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => window.print()}
            title={t("productivity.pdf", "PDF")}
          >
            <FileText className="h-4 w-4 text-rose-500" />
            PDF
          </button>
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              const link = document.createElement("a");
              link.href = `/api/customer/productivity/export-excel${dateFrom ? `?date_from=${dateFrom}&date_to=${dateTo ?? ""}` : ""}`;
              link.download = "productivity.xlsx";
              link.click();
            }}
            title={t("productivity.excel", "Excel")}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition",
                  active
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <span
                  className={cn(active ? "text-slate-900" : "text-slate-400")}
                >
                  {tb.icon}
                </span>
                {tb.label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {tab === "overview" && (
        <OverviewTab
          summary={summary}
          departments={departments}
          loading={loading}
          t={t}
        />
      )}
      {tab === "leaderboard" && (
        <LeaderboardTab
          rows={leaderboard}
          loading={loading}
          t={t}
        />
      )}
      {tab === "departments" && (
        <DepartmentsTab
          departments={departments}
          loading={loading}
          t={t}
        />
      )}
      {tab === "employee" && (
        <EmployeeDetailTab
          employees={leaderboard}
          selectedId={selectedEmployee}
          onSelect={setSelectedEmployee}
          detail={employee}
          t={t}
        />
      )}
    </div>
  );
}

/* -------- Date Field -------- */

/* -------- Overview Tab -------- */
function OverviewTab({
  summary,
  departments,
  loading,
  t,
}: {
  summary: ProductivitySummary | null;
  departments: DepartmentRanking[];
  loading: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          tint="bg-violet-100 text-violet-600"
          icon={<BarChart3 className="h-5 w-5" />}
          value={loading ? null : `${Math.round(summary?.overall_score ?? 0)}%`}
          label={t("productivity.overallScore", "Overall Score")}
        />
        <StatCard
          tint="bg-emerald-100 text-emerald-600"
          icon={<CalendarCheck className="h-5 w-5" />}
          value={
            loading ? null : `${Math.round(summary?.attendance_rate ?? 0)}%`
          }
          label={t("productivity.attendanceRate", "Attendance Rate")}
        />
        <StatCard
          tint="bg-sky-100 text-sky-600"
          icon={<Clock className="h-5 w-5" />}
          value={loading ? null : `${Math.round(summary?.punctuality ?? 0)}%`}
          label={t("productivity.punctuality", "Punctuality")}
        />
        <StatCard
          tint="bg-amber-100 text-amber-600"
          icon={<Users className="h-5 w-5" />}
          value={
            loading
              ? null
              : `${summary?.present_today ?? 0}/${summary?.total_employees ?? 0}`
          }
          label={t("productivity.presentToday", "Present Today")}
        />
      </div>

      <Card className="overflow-hidden p-5">
        <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
          <Building2 className="h-5 w-5 text-slate-500" />
          {t("productivity.departmentRankings", "Department Rankings")}
        </div>
        <div className="space-y-3">
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : departments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("productivity.noDepartments", "No department data available")}
            </p>
          ) : (
            departments.map((d, i) => (
              <div
                key={d.id ?? d.name ?? i}
                className="rounded-lg"
              >
                <div className="flex items-baseline justify-between text-sm">
                  <span className="flex items-center gap-3">
                    <span className="text-slate-400 tabular-nums">{i + 1}</span>
                    <span className="font-semibold text-slate-800">
                      {d.name}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {d.employees} {t("productivity.employees", "employees")} ·{" "}
                    {Math.round(d.score)}%
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
                  dir="ltr"
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.score >= 70
                        ? "bg-emerald-500"
                        : d.score >= 40
                          ? "bg-amber-500"
                          : "bg-rose-300"
                    )}
                    style={{ width: `${Math.max(2, d.score)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  tint,
  icon,
  value,
  label,
}: {
  tint: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            tint
          )}
        >
          {icon}
        </div>
        <div>
          {value === null ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {value}
            </p>
          )}
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

/* -------- Leaderboard Tab -------- */
function LeaderboardTab({
  rows,
  loading,
  t,
}: {
  rows: LeaderboardRow[];
  loading: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <Card className="overflow-hidden p-5">
      <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
        <Trophy className="h-5 w-5 text-amber-500" />
        {t("productivity.employeeLeaderboard", "Employee Leaderboard")}
      </div>
      <DataTable
        data={rows}
        isLoading={loading}
        emptyMessage={t("productivity.noLeaderboard", "No leaderboard data")}
        columns={[
          {
            key: "rank",
            header: t("productivity.rank", "Rank"),
            headClassName:
              "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            render: (r) => <RankBadge rank={r.rank} />,
          },
          {
            key: "employee",
            header: t("productivity.employee", "Employee"),
            headClassName:
              "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            render: (r) => (
              <LeaderboardRowEl
                row={r}
                cellOnly
              />
            ),
          },
          {
            key: "score",
            header: t("productivity.score", "Score"),
            headClassName:
              "w-16 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            cellClassName: "text-center",
            render: (r) => <ScoreRing score={r.score} />,
          },
          {
            key: "attendance",
            header: t("productivity.attendance", "Attendance"),
            headClassName:
              "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            render: (r) => (
              <span className="text-sm">{r.attendance ?? 0}%</span>
            ),
          },
          {
            key: "punctuality",
            header: t("productivity.punctuality", "Punctuality"),
            headClassName:
              "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            render: (r) => (
              <span className="text-sm">{r.punctuality ?? 0}%</span>
            ),
          },
          {
            key: "avg_hours",
            header: t("productivity.avgHours", "Avg Hours"),
            headClassName:
              "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            render: (r) => (
              <span className="text-sm">{r.avg_hours ?? "—"}</span>
            ),
          },
          {
            key: "late",
            header: t("productivity.late", "Late"),
            headClassName:
              "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
            render: (r) => (
              <span className="text-sm text-rose-600">{r.late_count ?? 0}</span>
            ),
          },
        ]}
      />
    </Card>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const tone =
      rank === 1
        ? "text-amber-500"
        : rank === 2
          ? "text-slate-400"
          : "text-orange-700";
    return (
      <span className="inline-flex items-center gap-1">
        <Medal className={cn("h-5 w-5", tone)} />
      </span>
    );
  }
  return <span className="text-sm font-semibold text-slate-500">#{rank}</span>;
}

function ScoreRing({ score }: { score: number }) {
  const v = Math.max(0, Math.min(100, score ?? 0));
  const ring =
    v >= 80
      ? "stroke-emerald-500"
      : v >= 40
        ? "stroke-amber-500"
        : "stroke-rose-300";
  const text =
    v >= 80 ? "text-emerald-600" : v >= 40 ? "text-amber-600" : "text-rose-500";
  const circ = 2 * Math.PI * 18;
  return (
    <div className="relative mx-auto h-12 w-12">
      <svg
        viewBox="0 0 44 44"
        className="h-12 w-12 -rotate-90"
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          className="stroke-rose-100"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          className={ring}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * v) / 100}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-bold",
          text
        )}
      >
        {Math.round(v)}
      </span>
    </div>
  );
}

function LeaderboardRowEl({
  row,
  cellOnly,
}: {
  row: LeaderboardRow;
  cellOnly?: boolean;
}) {
  const { t } = useTranslation();
  const initials = (
    row.initials ?? (row.name ?? "?").slice(0, 1)
  ).toUpperCase();
  // cellOnly = render just the employee name/avatar cell content (used inside DataTable render)
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
        {initials}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800">{row.name}</span>
        <span className="text-xs text-slate-400">
          {t("productivity.unassigned", "Unassigned")}
        </span>
      </span>
    </span>
  );
}

/* -------- Departments Tab -------- */
function DepartmentsTab({
  departments,
  loading,
  t,
}: {
  departments: DepartmentRanking[];
  loading: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (departments.length === 0)
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        {t("productivity.noDepartments", "No department data available")}
      </Card>
    );
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((d) => (
        <Card
          key={d.id ?? d.name}
          className="p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{d.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {d.employees} {t("productivity.employees", "employees")}
              </p>
            </div>
            <ScoreRing score={d.score} />
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <Metric
              label={t("productivity.attendance", "Attendance")}
              value={d.attendance}
            />
            <Metric
              label={t("productivity.punctuality", "Punctuality")}
              value={d.punctuality}
            />
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {t("productivity.avgPerDay", "Avg: {{h}}h / day", {
              h: d.avg_hours,
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold tabular-nums text-slate-700">
          {Math.round(v)}%
        </span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"
        dir="ltr"
      >
        <div
          className={cn(
            "h-full rounded-full",
            v >= 70
              ? "bg-emerald-500"
              : v >= 40
                ? "bg-amber-500"
                : "bg-rose-300"
          )}
          style={{ width: `${Math.max(2, v)}%` }}
        />
      </div>
    </div>
  );
}

/* -------- Employee Detail Tab -------- */
function EmployeeDetailTab({
  employees,
  selectedId,
  onSelect,
  detail,
  t,
}: {
  employees: LeaderboardRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  detail: EmployeeDetail | null;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (employees.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        {t("productivity.noEmployees", "No employees available")}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee selector */}
      <div className="flex flex-wrap gap-2">
        {employees.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              selectedId === e.id
                ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                selectedId === e.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {(e.initials ?? (e.name ?? "?").slice(0, 1)).toUpperCase()}
            </span>
            {e.name}
          </button>
        ))}
      </div>

      {!detail ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {/* Header card */}
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500">
                  {(
                    detail.initials ?? (detail.name ?? "?").slice(0, 1)
                  ).toUpperCase()}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {detail.name}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {t("productivity.unassigned", "Unassigned")}
                    {detail.email && (
                      <>
                        <span className="text-slate-300">·</span>
                        <Mail className="h-3 w-3" />
                        {detail.email}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <ScoreRing score={detail.score} />
            </div>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              tint="bg-emerald-100 text-emerald-600"
              icon={<CalendarDays className="h-5 w-5" />}
              value={`${detail.days_present}/${detail.days_total}`}
              label={t("productivity.daysPresent", "Days Present")}
            />
            <StatCard
              tint="bg-sky-100 text-sky-600"
              icon={<UserCheck className="h-5 w-5" />}
              value={`${Math.round(detail.attendance_rate)}%`}
              label={t("productivity.attendanceRate", "Attendance Rate")}
            />
            <StatCard
              tint="bg-violet-100 text-violet-600"
              icon={<CheckCircle2 className="h-5 w-5" />}
              value={`${Math.round(detail.punctuality)}%`}
              label={t("productivity.punctuality", "Punctuality")}
            />
            <StatCard
              tint="bg-amber-100 text-amber-600"
              icon={<Hourglass className="h-5 w-5" />}
              value={`${detail.total_hours}h`}
              label={t("productivity.totalHours", "Total Hours")}
            />
          </div>

          {/* Timeline */}
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <CalendarDays className="h-5 w-5 text-slate-500" />
              {t("productivity.dailyTimeline", "Daily Timeline")}
            </div>
            <DataTable
              data={(detail.timeline ?? []).map((row, i) => ({
                ...row,
                id: i,
              }))}
              emptyMessage={t(
                "productivity.noAttendance",
                "No attendance records in this period"
              )}
              columns={[
                {
                  key: "date",
                  header: t("productivity.date", "Date"),
                  render: (r) => <span className="font-medium">{r.date}</span>,
                },
                {
                  key: "check_in",
                  header: t("productivity.checkIn", "Check In"),
                  render: (r) => (
                    <span className="tabular-nums">{r.check_in ?? "—"}</span>
                  ),
                },
                {
                  key: "check_out",
                  header: t("productivity.checkOut", "Check Out"),
                  render: (r) => (
                    <span className="tabular-nums">{r.check_out ?? "—"}</span>
                  ),
                },
                {
                  key: "hours",
                  header: t("productivity.hours", "Hours"),
                  render: (r) => (
                    <span className="tabular-nums">{r.hours ?? "—"}</span>
                  ),
                },
                {
                  key: "status",
                  header: t("productivity.status", "Status"),
                  render: (r) => (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        r.status === "present"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "late"
                            ? "bg-amber-100 text-amber-700"
                            : r.status === "leave"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {t(`productivity.status_${r.status}`, r.status)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
