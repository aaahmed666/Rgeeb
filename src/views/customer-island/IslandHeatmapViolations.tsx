"use client";

/**
 * Customer Island — Heatmap & Violations views (parity ports).
 *
 * Heatmap (old behavior replicated):
 *  - requires camera_id + date; shows an instructional notice until both set
 *  - hour selector 0–23 (default 12) re-fetches on change
 *  - renders the returned heatmap image + stoppers / dwell-time stats
 *
 * Violations (old behavior replicated):
 *  - server pagination (page starts at 1, per_page 10/25/50)
 *  - status chips: pending (amber) / resolved (green) / ignored (gray)
 *  - employee, branch, detected_at, duration columns; snapshot link
 */
import * as React from "react";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import { DataTable } from "@/components/ui/data-table";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Camera, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import IslandHeader, {
  useIslandFilters,
} from "@/components/customer-island/IslandHeader";
import {
  IslandError,
  IslandGuard,
} from "@/views/customer-island/IslandViews";
import {
  formatResponseTime,
  islandService,
  type IslandHeatmapData,
  type IslandViolation,
} from "@/services/islandService";

/* ─── Heatmap ──────────────────────────────────────────────────────────── */

export function IslandHeatmapView() {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const cameraId = sp.get("camera_id");
  const date = sp.get("date") ?? "";
  const [hour, setHour] = React.useState(12); // old default
  const [data, setData] = React.useState<IslandHeatmapData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  const ready = Boolean(cameraId && date);

  const load = React.useCallback(async () => {
    if (!cameraId || !date) return;
    setLoading(true);
    setError(null);
    try {
      setData(
        await islandService.heatmap({ camera_id: cameraId, date, hour })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load heatmap");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [cameraId, date, hour]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={ready ? load : undefined} refreshing={loading} />
        <IslandError message={error} />

        {/* Heatmap-specific filters: camera + date + hour */}
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-end gap-3 pt-6">
            <div className="w-56">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("island.heatmap.camera", "Camera")}
              </label>
              <AsyncPaginatedSelect
                endpoint="/customer/cameras"
                labelKey="name"
                valueKey="id"
                value={cameraId}
                onChange={(v: string | null) => setQuery({ camera_id: v })}
                placeholder={t("island.heatmap.selectCamera", "Select camera")}
                isClearable
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("island.heatmap.date", "Date")}
              </label>
              <SharedDateRangePicker
                single
                date={date}
                onDateChange={(v) => setQuery({ date: v })}
                placeholder={t("island.heatmap.date", "Date")}
              />
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("island.heatmap.hour", "Hour")}: {String(hour).padStart(2, "0")}:00
              </label>
              <div className="flex flex-wrap gap-1">
                {hours.map((h) => (
                  <Button
                    key={h}
                    size="sm"
                    variant={h === hour ? "default" : "outline"}
                    className="h-7 w-9 px-0 text-xs"
                    onClick={() => setHour(h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {!ready ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Camera className="h-10 w-10" />
              {t(
                "island.heatmap.selectPrompt",
                "Please select a camera and date from the filters above"
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.heatmap.title", "Heatmap Analysis")}
                {data?.camera_name ? ` — ${data.camera_name}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-96 w-full" />
              ) : data?.heatmap_image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.heatmap_image}
                    alt={t("island.heatmap.alt", "Stopper heatmap")}
                    className="mx-auto max-h-[480px] rounded-lg border"
                  />
                  <div className="mt-4 flex flex-wrap gap-6 text-sm">
                    {data.total_stoppers != null && (
                      <span>
                        <span className="text-muted-foreground">
                          {t("island.heatmap.stoppers", "Stoppers")}:{" "}
                        </span>
                        <strong>{data.total_stoppers.toLocaleString()}</strong>
                      </span>
                    )}
                    {data.avg_dwell_time != null && (
                      <span>
                        <span className="text-muted-foreground">
                          {t("island.heatmap.dwell", "Avg dwell time")}:{" "}
                        </span>
                        <strong>{formatResponseTime(data.avg_dwell_time)}</strong>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <ImageOff className="h-10 w-10" />
                  {t(
                    "island.heatmap.noData",
                    "No heatmap available for the selected camera, date and hour."
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </IslandGuard>
  );
}

/* ─── Violations ───────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<IslandViolation["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  ignored: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const PAGE_SIZES = [10, 25, 50]; // parity with old pageSizeOptions

export function IslandViolationsView() {
  const { t } = useTranslation();
  const filters = useIslandFilters();
  const [page, setPage] = React.useState(1); // API is 1-based (old sent page+1)
  const [perPage, setPerPage] = React.useState(10);
  const [rows, setRows] = React.useState<IslandViolation[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await islandService.violations({
        ...filters,
        page,
        per_page: perPage,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch violations records");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.branch_id, page, perPage]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Reset to page 1 whenever the shared filters change (old grid did the same)
  React.useEffect(() => {
    setPage(1);
  }, [filters.from, filters.to, filters.branch_id]);

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader onRefresh={load} refreshing={loading} />
        <IslandError message={error} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("island.violations.title", "Island Violations")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({total.toLocaleString()})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <DataTable<IslandViolation>
                data={rows}
                emptyMessage={t(
                  "island.violations.empty",
                  "No violations recorded for the selected period."
                )}
                columns={[
                  {
                    key: "violation_type",
                    header: t("island.violations.type", "Violation"),
                    cellClassName: "font-medium",
                    render: (v) => v.violation_type,
                  },
                  {
                    key: "employee",
                    header: t("island.violations.employee", "Employee"),
                    render: (v) => v.employee?.name ?? "—",
                  },
                  {
                    key: "branch",
                    header: t("island.violations.branch", "Branch"),
                    render: (v) => v.branch?.name ?? "—",
                  },
                  {
                    key: "detected_at",
                    header: t("island.violations.detectedAt", "Detected At"),
                    cellClassName: "tabular-nums",
                    render: (v) => v.detected_at,
                  },
                  {
                    key: "duration",
                    header: t("island.violations.duration", "Duration"),
                    cellClassName: "tabular-nums",
                    render: (v) => formatResponseTime(v.duration),
                  },
                  {
                    key: "status",
                    header: t("island.violations.status", "Status"),
                    render: (v) => (
                      <Badge
                        className={STATUS_STYLE[v.status] ?? ""}
                        variant="outline"
                      >
                        {t(`island.violations.statuses.${v.status}`, v.status)}
                      </Badge>
                    ),
                  },
                  {
                    key: "snapshot",
                    header: t("island.violations.snapshot", "Snapshot"),
                    render: (v) =>
                      v.snapshot_path ? (
                        <a
                          href={v.snapshot_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {t("island.violations.view", "View")}
                        </a>
                      ) : (
                        "—"
                      ),
                  },
                ]}
              />
            )}

            {/* Pagination — parity with old DataGrid (10/25/50, page nav) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {t("island.violations.rowsPerPage", "Rows per page:")}
                </span>
                <div className="w-[90px]">
                  <AsyncPaginatedSelect
                    options={PAGE_SIZES.map((s) => ({
                      value: String(s),
                      label: String(s),
                    }))}
                    value={String(perPage)}
                    onChange={(v) => {
                      setPerPage(Number(v ?? PAGE_SIZES[0]));
                      setPage(1);
                    }}
                    isClearable={false}
                    height={32}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t("common.previous", "Previous")}
                </Button>
                <span className="tabular-nums text-muted-foreground">
                  {page} / {pageCount}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pageCount || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("common.next", "Next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </IslandGuard>
  );
}
