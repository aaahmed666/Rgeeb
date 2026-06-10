"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UserCheck,
  Users,
  UserX,
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { SharedDateRangePicker } from "@/components/Shareddaterangepicker";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

import {
  fetchAttendances,
  fetchAttendanceDashboard } from "@/services/attendanceService";
import { useAuth } from "@/lib/auth";

const PER_PAGE = 15;

export default function AttendanceView() {
  const { hasPermission } = useAuth();
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } = useDebounceSearch("", 300);
  const [page, setPage] = React.useState(1);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const dashQ = useQuery({
    queryKey: ["attendance", "dashboard"],
    queryFn: () => fetchAttendanceDashboard(),
  });
  const listQ = useQuery({
    queryKey: ["attendance", "list", { dateFrom, dateTo }],
    queryFn: () =>
      fetchAttendances({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const records = listQ.data ?? [];
  const filtered = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.employeeName, r.branchName, r.status, r.date]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [records, debouncedSearch]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const dash = dashQ.data;

  function statusBadge(status?: string) {
    const s = (status ?? "").toLowerCase();
    if (s === "present" || s === "on_time")
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
          Present
        </Badge>
      );
    if (s === "late")
      return (
        <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">
          Late
        </Badge>
      );
    if (s === "absent")
      return (
        <Badge className="bg-red-500/15 text-red-700 border-red-500/30">
          Absent
        </Badge>
      );
    return <Badge variant="secondary">{status ?? "—"}</Badge>;
  }

  function formatDuration(mins?: number) {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  if (!hasPermission("attendance.read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">
          Access Denied
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have permission to view Attendance records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg">Attendance</h1>
            <p className="text-xs text-muted-foreground">
              Track employee check-ins and check-outs
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dashQ.refetch();
            listQ.refetch();
          }}
          disabled={listQ.isFetching}
        >
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${listQ.isFetching ? "animate-spin" : ""}`}
          />{" "}
          Refresh
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Employees",
            value: dash?.totalEmployees,
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "Present Today",
            value: dash?.presentToday,
            icon: UserCheck,
            color: "text-emerald-500",
          },
          {
            label: "Absent Today",
            value: dash?.absentToday,
            icon: UserX,
            color: "text-red-500",
          },
          {
            label: "Late Today",
            value: dash?.lateToday,
            icon: Clock,
            color: "text-amber-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card
            key={label}
            className="border-border/60 shadow-sm"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-md bg-muted p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {dashQ.isLoading ? "—" : (value ?? "—")}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search employee, branch..."
                value={search}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <SharedDateRangePicker
                from={dateFrom}
                to={dateTo}
                onFromChange={(v: string) => { setDateFrom(v); setPage(1); }}
                onToChange={(v: string) => { setDateTo(v); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={paged}
            isLoading={listQ.isLoading}
            isError={listQ.isError}
            errorMessage={listQ.error instanceof Error ? listQ.error.message : "Failed to load"}
            emptyMessage="No attendance records found"
            columns={[
              {
                key: "employeeName",
                header: "Employee",
                render: (r) => <span className="font-medium">{r.employeeName ?? "—"}</span>,
              },
              {
                key: "branchName",
                header: "Branch",
                render: (r) => r.branchName ?? "—",
              },
              {
                key: "date",
                header: "Date",
                render: (r) => r.date ?? "—",
              },
              {
                key: "checkIn",
                header: "Check In",
                render: (r) => (
                  <span className="font-mono text-xs">
                    {r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "—"}
                  </span>
                ),
              },
              {
                key: "checkOut",
                header: "Check Out",
                render: (r) => (
                  <span className="font-mono text-xs">
                    {r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "—"}
                  </span>
                ),
              },
              {
                key: "duration",
                header: "Duration",
                render: (r) => formatDuration(r.duration),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => statusBadge(r.status),
              },
              {
                key: "faceVerified",
                header: "Face Verified",
                render: (r) =>
                  r.faceVerified !== undefined ? (
                    <Badge
                      variant="outline"
                      className={
                        r.faceVerified
                          ? "border-emerald-500/40 text-emerald-600"
                          : "border-muted text-muted-foreground"
                      }
                    >
                      {r.faceVerified ? "✓ Verified" : "Not verified"}
                    </Badge>
                  ) : (
                    "—"
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
