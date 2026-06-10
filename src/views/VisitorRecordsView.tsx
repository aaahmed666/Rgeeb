"use client";

/**
 * VisitorRecordsView — port of the old /apps/visitor-records page.
 * Shows detected visitor records (face/person detections) with photo thumbnails,
 * entry/exit times, and branch info. Fetches detections filtered by visitor-type
 * from the /customer/detections endpoint.
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  ImageIcon,
  MapPin,
  RefreshCw,
  Search,
  User,
  Users,
} from "lucide-react";
import type { DateRange } from "rsuite/DateRangePicker";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisitorRecord {
  id: string;
  type: string;
  camera: string;
  branch: string;
  detected_at: string;
  image: string | null;
  score: number;
  direction?: "in" | "out";
  data?: Record<string, unknown>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const VISITOR_TYPES = ["visitor", "face_detection", "people_counting", "customer_traffic", "person"];

async function fetchVisitorRecords(params: {
  from: string;
  to: string;
  branchId?: string | null;
  search?: string;
  page: number;
}): Promise<{ items: VisitorRecord[]; total: number }> {
  const query: Record<string, string | number | boolean | undefined | null> = {
    date_from: params.from,
    date_to: params.to,
    branch_id: params.branchId ?? undefined,
    per_page: 30,
    page: params.page,
  };

  const raw = await apiFetch<unknown>(endpoints.detections.list, { query });
  const r = raw as Record<string, unknown>;
  const arr: unknown[] = Array.isArray(r?.data)
    ? (r.data as unknown[])
    : Array.isArray((r?.data as Record<string, unknown>)?.data)
    ? ((r.data as Record<string, unknown>).data as unknown[])
    : Array.isArray(raw)
    ? (raw as unknown[])
    : [];

  // Filter to visitor-related types only
  const items = arr
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      const type = String(o.type ?? "");
      return {
        id: String(o.id ?? Math.random()),
        type,
        camera: String(o.camera ?? o.camera_name ?? "—"),
        branch: String(o.branch ?? o.branch_name ?? "—"),
        detected_at: String(o.detected_at ?? o.created_at ?? new Date().toISOString()),
        image: (o.image ?? o.detection_image ?? null) as string | null,
        score: Number(o.score ?? 0),
        direction: ((o.data as Record<string, unknown>)?.event === "out" ? "out" : "in") as "in" | "out",
        data: (o.data ?? {}) as Record<string, unknown>,
      } satisfies VisitorRecord;
    })
    .filter((r) =>
      VISITOR_TYPES.some(
        (vt) =>
          r.type.toLowerCase().includes(vt) ||
          vt.includes(r.type.toLowerCase())
      )
    );

  const meta = r?.meta as Record<string, unknown> | undefined;
  const total = Number(meta?.total ?? arr.length);

  return { items, total };
}

// ─── Visitor Card ─────────────────────────────────────────────────────────────

function VisitorCard({ record }: { record: VisitorRecord }) {
  const { t } = useTranslation();
  const time = new Date(record.detected_at);
  const isIn = record.direction === "in";

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Detection image */}
      <div className="relative h-40 bg-muted">
        {record.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.image}
            alt="Visitor"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
        )}
        {/* Direction badge */}
        <div className="absolute end-2 top-2">
          <Badge
            className={`gap-1 ${
              isIn
                ? "bg-emerald-500/90 text-white"
                : "bg-rose-500/90 text-white"
            }`}
          >
            {isIn ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )}
            {isIn ? t("visitors.enter", "Enter") : t("visitors.exit", "Exit")}
          </Badge>
        </div>
        {/* Confidence */}
        {record.score > 0 && (
          <div className="absolute start-2 top-2">
            <Badge variant="secondary" className="text-[10px]">
              {Math.round(record.score * 100)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold capitalize">
          <User className="h-3.5 w-3.5 text-primary" />
          {record.type.replace(/_/g, " ")}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {record.branch}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {time.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
          {" · "}
          {time.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
          })}
        </div>
        <div className="text-[10px] text-muted-foreground opacity-70">
          📷 {record.camera}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function VisitorRecordsView() {
  const { t } = useTranslation();
  const today = React.useMemo(() => new Date(), []);
  const [dateRange, setDateRange] = React.useState<DateRange | null>([today, today]);
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const from = dateRange?.[0]?.toISOString().slice(0, 10) ?? today.toISOString().slice(0, 10);
  const to = dateRange?.[1]?.toISOString().slice(0, 10) ?? today.toISOString().slice(0, 10);

  const query = useQuery({
    queryKey: ["visitor-records", from, to, branchId, page],
    queryFn: () => fetchVisitorRecords({ from, to, branchId, page }),
    staleTime: 30_000,
  });

  const records = React.useMemo(() => {
    const list = query.data?.items ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.type.toLowerCase().includes(q) ||
        r.camera.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q)
    );
  }, [query.data, search]);

  const totalIn = records.filter((r) => r.direction === "in").length;
  const totalOut = records.filter((r) => r.direction === "out").length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg">
              {t("visitorRecords.title", "Visitor Records")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("visitorRecords.subtitle", "AI-detected visitor entries and exits with photo evidence")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          {t("common.refresh", "Refresh")}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{records.length}</p>
              <p className="text-xs text-muted-foreground">{t("visitorRecords.total", "Total")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <ArrowDown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalIn}</p>
              <p className="text-xs text-muted-foreground">{t("visitorRecords.entered", "Entered")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600">
              <ArrowUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalOut}</p>
              <p className="text-xs text-muted-foreground">{t("visitorRecords.exited", "Exited")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SharedDateRangePicker
          value={dateRange}
          onChange={(v) => { setDateRange(v); setPage(1); }}
          placeholder={t("common.selectDateRange", "Select date range")}
        />
        <div style={{ minWidth: 180 }}>
          <AsyncPaginatedSelect
            endpoint="/customer/branches"
            labelKey="name"
            valueKey="id"
            value={branchId}
            onChange={(v) => { setBranchId(v); setPage(1); }}
            placeholder={t("common.allBranches", "All Branches")}
            isClearable
          />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-8 h-9"
            placeholder={t("common.search", "Search...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {query.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("errors.loadFailed", "Failed to load records")}
            </p>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              {t("common.retry", "Retry")}
            </Button>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground opacity-30" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("visitorRecords.noRecords", "No visitor records found for the selected filters")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {records.map((record) => (
            <VisitorCard key={record.id} record={record} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(query.data?.total ?? 0) > 30 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("common.prev", "Prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("common.page", "Page")} {page}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={(query.data?.items.length ?? 0) < 30}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("common.next", "Next")}
          </Button>
        </div>
      )}
    </div>
  );
}
