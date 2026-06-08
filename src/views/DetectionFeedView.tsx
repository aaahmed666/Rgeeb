"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import type { DateRange } from "rsuite/DateRangePicker";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { detectionFeedService } from "@/services/detectionFeedService";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

const ALL = "__all__";
const PER_PAGE = 15;

export default function DetectionFeedView() {
  const { t, i18n } = useTranslation();
  const can = usePermission("detections");
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  const [view, setView] = React.useState<"list" | "grid">("list");
  const [page, setPage] = React.useState(1);

  // Branch & Camera via AsyncPaginatedSelect (string id or null)
  const [branchId, setBranchId] = React.useState<string | null>(null);
  const [cameraId, setCameraId] = React.useState<string | null>(null);

  // Service via plain Select (fetched once — small list)
  const [service, setService] = React.useState(ALL);

  // Date range via SharedDateRangePicker
  const [dateRange, setDateRange] = React.useState<DateRange | null>(null);

  const from = dateRange?.[0]?.toISOString().slice(0, 10) ?? undefined;
  const to = dateRange?.[1]?.toISOString().slice(0, 10) ?? undefined;

  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const filters = React.useMemo(
    () => ({
      page,
      perPage: PER_PAGE,
      branchId: branchId ?? undefined,
      cameraId: cameraId ?? undefined,
      service: service === ALL ? undefined : service,
      from,
      to,
    }),
    [page, branchId, cameraId, service, from, to]
  );

  // Services list — small so we fetch once

  const dataQ = useQuery({
    queryKey: ["detection-feed", "list", filters],
    queryFn: () => detectionFeedService.list(filters),
    refetchInterval: 20_000,
  });

  // Reset to page 1 on any filter change
  React.useEffect(() => {
    setPage(1);
  }, [branchId, cameraId, service, from, to]);

  const deleteM = useMutation({
    mutationFn: (id: string) => detectionFeedService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["detection-feed", "list"] });
      setDeleteId(null);
      toast.success("Detection deleted successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = dataQ.data?.items ?? [];
  const total = dataQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = items.length ? (page - 1) * PER_PAGE + 1 : 0;
  const end = Math.min(page * PER_PAGE, total);

  const locale = i18n.language === "ar" ? "ar" : "en";
  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const scoreTone = (s: number) =>
    s >= 90
      ? "bg-emerald-500/15 text-emerald-600"
      : s >= 75
        ? "bg-amber-500/15 text-amber-600"
        : "bg-destructive/15 text-destructive";

  // Permission read guard
  if (!hasPermission("detection_feed")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground">{t("common.noPermission", "You don\'t have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("detectionFeed.title", "Detection Feed")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "detectionFeed.subtitle",
              "Unified view of all AI detections across services"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600"
          >
            {t("detectionFeed.resultsCount", "{{n}} results", { n: total })}
          </Badge>
          <div className="inline-flex rounded-lg border bg-muted/30 p-1">
            <Button
              size="sm"
              variant={view === "list" ? "default" : "ghost"}
              onClick={() => setView("list")}
              aria-label="List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={view === "grid" ? "default" : "ghost"}
              onClick={() => setView("grid")}
              aria-label="Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dataQ.refetch()}
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn("h-4 w-4", dataQ.isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:p-5 sm:grid-cols-2 xl:grid-cols-5">
          {/* Branch — AsyncPaginatedSelect */}
          <FilterField label={t("detectionFeed.branch", "Branch")}>
            <AsyncPaginatedSelect
              endpoint={endpoints.organization.branches}
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                // reset camera when branch changes
                setCameraId(null);
              }}
              placeholder={t("detectionFeed.all", "All")}
              isClearable
            />
          </FilterField>

          {/* Camera — AsyncPaginatedSelect, filtered by branch */}
          <FilterField label={t("detectionFeed.camera", "Camera")}>
            <AsyncPaginatedSelect
              endpoint={endpoints.cameras.list}
              extraParams={branchId ? { branch_id: branchId } : undefined}
              value={cameraId}
              onChange={setCameraId}
              placeholder={t("detectionFeed.all", "All")}
              isClearable
            />
          </FilterField>

          {/* Service — AsyncPaginatedSelect */}
          <FilterField label={t("detectionFeed.service", "Service")}>
            <AsyncPaginatedSelect
              endpoint={endpoints.services.list}
              labelKey="name"
              valueKey="id"
              value={service === ALL ? null : service}
              onChange={(v) => { setService(v ?? ALL); setPage(1); }}
              placeholder={t("detectionFeed.all", "All")}
              isClearable
            />
          </FilterField>

          {/* Date range — SharedDateRangePicker spanning 2 columns */}
          <FilterField
            label={t("detectionFeed.dateRange", "Date Range")}
            className="sm:col-span-2"
          >
            <SharedDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={t("detectionFeed.selectDateRange", "From – To")}
            />
          </FilterField>
        </CardContent>
      </Card>

      {/* Table or Grid */}
      {view === "list" ? (
        <DataTable
          data={items}
          isLoading={dataQ.isLoading}
          emptyMessage={t("detectionFeed.empty", "No detections found")}
          columns={[
            {
              key: "image",
              header: t("detectionFeed.image", "Image"),
              headClassName: "uppercase",
              render: (d) => (
                <Thumbnail
                  src={d.image}
                  alt={d.type}
                />
              ),
            },
            {
              key: "type",
              header: t("detectionFeed.type", "Type"),
              headClassName: "uppercase",
              render: (d) => (
                <Badge
                  variant="outline"
                  className="font-medium capitalize"
                >
                  {d.type.replaceAll("_", " ")}
                </Badge>
              ),
            },
            {
              key: "score",
              header: t("detectionFeed.score", "Score"),
              headClassName: "uppercase",
              render: (d) => (
                <Badge className={cn("font-semibold", scoreTone(d.score))}>
                  {d.score}%
                </Badge>
              ),
            },
            {
              key: "service",
              header: t("detectionFeed.service", "Service"),
              headClassName: "uppercase",
              render: (d) => <span>{d.service}</span>,
            },
            {
              key: "camera",
              header: t("detectionFeed.camera", "Camera"),
              headClassName: "uppercase",
              render: (d) => (
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  {d.camera}
                </span>
              ),
            },
            {
              key: "branch",
              header: t("detectionFeed.branch", "Branch"),
              headClassName: "uppercase",
              render: (d) => <span>{d.branch}</span>,
            },
            {
              key: "detectedAt",
              header: t("detectionFeed.detectedAt", "Detected At"),
              headClassName: "uppercase",
              render: (d) => (
                <span className="text-muted-foreground">
                  {formatDate(d.detectedAt)}
                </span>
              ),
            },
            {
              key: "actions",
              header: t("detectionFeed.actions", "Actions"),
              headClassName: "uppercase text-end",
              cellClassName: "text-end",
              render: (d) => (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(d.id)}
                  aria-label="Delete"
                  className={!can.delete ? "hidden" : ""}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ),
            },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((d) => (
            <Card
              key={d.id}
              className="overflow-hidden"
            >
              <div className="relative aspect-video bg-muted">
                <Thumbnail
                  src={d.image}
                  alt={d.type}
                  className="h-full w-full rounded-none"
                />
                <Badge
                  className={cn("absolute end-2 top-2", scoreTone(d.score))}
                >
                  {d.score}%
                </Badge>
              </div>
              <CardContent className="space-y-1 p-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="capitalize"
                  >
                    {d.type.replaceAll("_", " ")}
                  </Badge>
                  {can.delete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(d.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm font-medium">{d.service}</p>
                <p className="text-xs text-muted-foreground">
                  {d.camera} · {d.branch}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(d.detectedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("detectionFeed.pageInfo", "{{start}}–{{end}} of {{total}}", {
            start,
            end,
            total,
          })}
        </p>
        <div className="inline-flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <span className="px-3 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            size="icon"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("detectionFeed.deleteTitle", "Delete detection?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detectionFeed.deleteDesc", "This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteM.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Thumbnail({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-12 w-16 items-center justify-center rounded bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("h-12 w-16 rounded object-cover", className)}
    />
  );
}
