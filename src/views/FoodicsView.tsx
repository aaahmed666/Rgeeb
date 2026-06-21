"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Plug,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  MapPin,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";

import { foodicsService } from "@/services/foodicsService";

export default function FoodicsView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const can = usePermission("foodics");
  const { hasPermission } = useAuth();

  const statusQ = useQuery({
    queryKey: ["foodics", "status"],
    queryFn: () => foodicsService.getStatus(),
  });
  const zonesQ = useQuery({
    queryKey: ["foodics", "zones"],
    queryFn: () => foodicsService.getInventoryZones(),
    enabled: statusQ.data?.connected ?? false,
  });

  const syncMut = useMutation({
    mutationFn: () => foodicsService.syncDrawerOperations(),
    onSuccess: () => {
      toast.success(t("foodics.drawerSynced", "Drawer operations synced"));
      qc.invalidateQueries({ queryKey: ["foodics"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("foodics.syncFailed", "Sync failed")),
  });

  const importMut = useMutation({
    mutationFn: () => foodicsService.importBranches(),
    onSuccess: () => {
      toast.success(t("foodics.branchesImported", "Branches imported successfully"));
      qc.invalidateQueries({ queryKey: ["foodics"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : t("foodics.importFailed", "Import failed")),
  });

  const status = statusQ.data;

  if (!hasPermission("foodics.status")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Plug className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-semibold text-muted-foreground">
          {t("foodics.accessDenied")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("foodics.noPermissionIntegration")}
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
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg">
              {t("foodics.integrationTitle")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("foodics.integrationSubtitle")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => statusQ.refetch()}
          disabled={statusQ.isFetching}
        >
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${statusQ.isFetching ? "animate-spin" : ""}`}
          />{" "}
          {t("common.refresh")}
        </Button>
      </header>

      {/* Connection Status */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t("foodics.connectionStatusTitle")}</CardTitle>
          <CardDescription>
            {t("foodics.connectionStatusSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                {status?.connected ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {status?.connected ? t("foodics.connected") : t("foodics.notConnected")}
                  </p>
                  {status?.business_name && (
                    <p className="text-sm text-muted-foreground">
                      {status.business_name}
                    </p>
                  )}
                </div>
              </div>
              {status?.connected_at && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{t("foodics.connectedAtLabel")}</span>{" "}
                  {new Date(status.connected_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" /> {t("foodics.importBranchesTitle")}
            </CardTitle>
            <CardDescription>
              {t("foodics.importBranchesSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => can.create && importMut.mutate()}
              disabled={!can.create || importMut.isPending || !status?.connected}
              className="w-full"
            >
              {importMut.isPending ? t("foodics.importing") : t("foodics.importBranches")}
            </Button>
            {importMut.isSuccess && (
              <p className="mt-2 text-sm text-emerald-600">
                ✓ {t("foodics.branchesImportedInline")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" /> {t("foodics.syncDrawerTitle")}
            </CardTitle>
            <CardDescription>
              {t("foodics.syncDrawerSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => can.update && syncMut.mutate()}
              disabled={!can.update || syncMut.isPending || !status?.connected}
              className="w-full"
            >
              {syncMut.isPending ? t("foodics.syncing") : t("foodics.syncNow")}
            </Button>
            {syncMut.isSuccess && (
              <p className="mt-2 text-sm text-emerald-600">
                ✓ {t("foodics.drawerSyncedInline")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Zones */}
      {status?.connected && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> {t("foodics.inventoryZonesTitle")}
            </CardTitle>
            <CardDescription>
              {t("foodics.inventoryZonesSubtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zonesQ.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-full"
                  />
                ))}
              </div>
            ) : (zonesQ.data?.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("foodics.noInventoryZones")}
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {(zonesQ.data?.data ?? []).map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{zone.name}</span>
                      {zone.status && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {zone.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {zone.branch_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {zone.branch_name}
                        </span>
                      )}
                      {zone.items_count !== undefined && (
                        <span>{t("foodics.itemsCount", { count: zone.items_count })}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
