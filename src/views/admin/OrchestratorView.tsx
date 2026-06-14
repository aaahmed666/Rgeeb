"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cpu,
  Activity,
  Clock,
  Hand,
  OctagonX,
  RotateCcw,
  KeyRound,
  Play,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import {
  orchestratorService,
  setOrchestratorToken,
  type OrchestratorAssignment,
  type OrchestratorPending,
  type OrchestratorStale,
  type OrchestratorStopItem,
} from "@/services/orchestratorService";

const REFRESH_MS = 15_000;

function dash(v?: string | number) {
  return v === undefined || v === null || v === "" ? "—" : String(v);
}

/* ─── Stat cards ─────────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  textColor,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  textColor: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2.5 ${bgColor} ${textColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrchestratorView() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [hasToken, setHasToken] = React.useState<boolean>(false);
  const [tokenDraft, setTokenDraft] = React.useState("");
  const [resetOpen, setResetOpen] = React.useState(false);
  const [csId, setCsId] = React.useState("");
  const [containerId, setContainerId] = React.useState("");

  React.useEffect(() => {
    setHasToken(orchestratorService.hasToken());
  }, []);

  const snapshotQ = useQuery({
    queryKey: ["orchestrator", "snapshot"],
    queryFn: () => orchestratorService.getSnapshot(),
    refetchInterval: REFRESH_MS,
  });

  const data = snapshotQ.data;
  const active = data?.active ?? [];
  const pending = data?.pending ?? [];
  const stale = data?.stale ?? [];
  const stopList = data?.stopList ?? [];

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["orchestrator", "snapshot"] });

  const resetMut = useMutation({
    mutationFn: () => orchestratorService.resetAll(),
    onSuccess: () => {
      toast.success(t("orchestrator.resetSuccess", "All assignments cleared"));
      setResetOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMut = useMutation({
    mutationFn: () => orchestratorService.activate(csId.trim(), containerId.trim()),
    onSuccess: () => {
      toast.success(t("orchestrator.activateSuccess", "Worker activated"));
      setCsId("");
      setContainerId("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveToken = () => {
    const v = tokenDraft.trim();
    setOrchestratorToken(v || null);
    setHasToken(Boolean(v));
    setTokenDraft("");
    toast.success(
      v
        ? t("orchestrator.tokenSaved", "Orchestrator token saved")
        : t("orchestrator.tokenCleared", "Orchestrator token cleared")
    );
    invalidate();
  };

  /* ─── Columns ──────────────────────────────────────────────────────────── */

  const activeCols: DataTableColumn<OrchestratorAssignment>[] = [
    {
      key: "cameraServiceId",
      header: t("orchestrator.col.cameraService", "Camera Service"),
      render: (r) => (
        <span className="font-medium">{dash(r.cameraName ?? r.cameraServiceId)}</span>
      ),
    },
    {
      key: "serviceName",
      header: t("orchestrator.col.service", "Service"),
      render: (r) => dash(r.serviceName),
    },
    {
      key: "branchName",
      header: t("orchestrator.col.branch", "Branch"),
      render: (r) => dash(r.branchName),
    },
    {
      key: "containerId",
      header: t("orchestrator.col.container", "Container"),
      render: (r) => <span className="font-mono text-xs">{dash(r.containerId)}</span>,
    },
    {
      key: "workerId",
      header: t("orchestrator.col.worker", "Worker"),
      render: (r) => <span className="font-mono text-xs">{dash(r.workerId)}</span>,
    },
    {
      key: "status",
      header: t("orchestrator.col.status", "Status"),
      render: (r) =>
        r.status ? (
          <Badge variant="secondary" className="capitalize">
            {r.status}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "lastHeartbeat",
      header: t("orchestrator.col.lastHeartbeat", "Last Heartbeat"),
      render: (r) => <span className="text-xs text-muted-foreground">{dash(r.lastHeartbeat)}</span>,
    },
  ];

  const pendingCols: DataTableColumn<OrchestratorPending>[] = [
    {
      key: "cameraServiceId",
      header: t("orchestrator.col.cameraService", "Camera Service"),
      render: (r) => (
        <span className="font-medium">{dash(r.cameraName ?? r.cameraServiceId)}</span>
      ),
    },
    {
      key: "serviceName",
      header: t("orchestrator.col.service", "Service"),
      render: (r) => dash(r.serviceName),
    },
    {
      key: "branchName",
      header: t("orchestrator.col.branch", "Branch"),
      render: (r) => dash(r.branchName),
    },
    {
      key: "priority",
      header: t("orchestrator.col.priority", "Priority"),
      render: (r) =>
        r.priority ? (
          <Badge variant="outline" className="capitalize">
            {r.priority}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "requestedAt",
      header: t("orchestrator.col.requestedAt", "Requested"),
      render: (r) => <span className="text-xs text-muted-foreground">{dash(r.requestedAt)}</span>,
    },
  ];

  const staleCols: DataTableColumn<OrchestratorStale>[] = [
    {
      key: "workerId",
      header: t("orchestrator.col.worker", "Worker"),
      render: (r) => <span className="font-mono text-xs">{dash(r.workerId)}</span>,
    },
    {
      key: "cameraServiceId",
      header: t("orchestrator.col.cameraService", "Camera Service"),
      render: (r) => dash(r.cameraServiceId),
    },
    {
      key: "containerId",
      header: t("orchestrator.col.container", "Container"),
      render: (r) => <span className="font-mono text-xs">{dash(r.containerId)}</span>,
    },
    {
      key: "lastHeartbeat",
      header: t("orchestrator.col.lastHeartbeat", "Last Heartbeat"),
      render: (r) => <span className="text-xs text-muted-foreground">{dash(r.lastHeartbeat)}</span>,
    },
    {
      key: "staleForSeconds",
      header: t("orchestrator.col.staleFor", "Stale For"),
      render: (r) =>
        r.staleForSeconds !== undefined ? (
          <Badge variant="destructive">{r.staleForSeconds}s</Badge>
        ) : (
          "—"
        ),
    },
  ];

  const stopCols: DataTableColumn<OrchestratorStopItem>[] = [
    {
      key: "cameraServiceId",
      header: t("orchestrator.col.cameraService", "Camera Service"),
      render: (r) => (
        <span className="font-medium">{dash(r.cameraName ?? r.cameraServiceId)}</span>
      ),
    },
    {
      key: "serviceName",
      header: t("orchestrator.col.service", "Service"),
      render: (r) => dash(r.serviceName),
    },
    {
      key: "reason",
      header: t("orchestrator.col.reason", "Reason"),
      render: (r) => dash(r.reason),
    },
    {
      key: "flaggedAt",
      header: t("orchestrator.col.flaggedAt", "Flagged"),
      render: (r) => <span className="text-xs text-muted-foreground">{dash(r.flaggedAt)}</span>,
    },
  ];

  const isError = snapshotQ.isError;
  const errMsg = (snapshotQ.error as Error | undefined)?.message;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="orchestrator.title"
        Icon={Cpu}
        onRefresh={() => snapshotQ.refetch()}
        isRefreshing={snapshotQ.isFetching}
        right={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setResetOpen(true)}
            disabled={resetMut.isPending}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("orchestrator.resetAll", "Reset All")}
          </Button>
        }
      />

      {/* Token notice — these endpoints are gated by X-Orchestrator-Token */}
      {!hasToken && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-semibold">
                  {t("orchestrator.tokenTitle", "Orchestrator token required")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "orchestrator.tokenHelp",
                    "These endpoints are authenticated with an X-Orchestrator-Token header. Paste the token to load live data."
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                placeholder={t("orchestrator.tokenPlaceholder", "Paste token")}
                className="h-9 w-48"
              />
              <Button size="sm" onClick={saveToken} disabled={!tokenDraft.trim()}>
                {t("common.save", "Save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label={t("orchestrator.stat.active", "Active Workers")}
          value={active.length}
          textColor="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={Clock}
          label={t("orchestrator.stat.pending", "Pending Jobs")}
          value={pending.length}
          textColor="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={Hand}
          label={t("orchestrator.stat.stale", "Stale Workers")}
          value={stale.length}
          textColor="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={OctagonX}
          label={t("orchestrator.stat.stopList", "Stop List")}
          value={stopList.length}
          textColor="text-red-500"
          bgColor="bg-red-500/10"
        />
      </div>

      {/* Activate a worker */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("orchestrator.col.cameraService", "Camera Service")} ID
            </label>
            <Input
              value={csId}
              onChange={(e) => setCsId(e.target.value)}
              placeholder="camera_service_id"
              className="h-9"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("orchestrator.col.container", "Container")} ID
            </label>
            <Input
              value={containerId}
              onChange={(e) => setContainerId(e.target.value)}
              placeholder="container_id"
              className="h-9"
            />
          </div>
          <Button
            onClick={() => activateMut.mutate()}
            disabled={!csId.trim() || !containerId.trim() || activateMut.isPending}
          >
            {activateMut.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="me-2 h-4 w-4" />
            )}
            {t("orchestrator.activate", "Activate")}
          </Button>
        </CardContent>
      </Card>

      {/* Tables */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-emerald-500" />
          {t("orchestrator.section.active", "Active Workers")}
        </h2>
        <DataTable<OrchestratorAssignment>
          columns={activeCols}
          data={active}
          isLoading={snapshotQ.isLoading}
          isError={isError}
          errorMessage={errMsg}
          onRefresh={() => snapshotQ.refetch()}
          emptyMessage={t("orchestrator.empty.active", "No active workers")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-blue-500" />
          {t("orchestrator.section.pending", "Pending Jobs")}
        </h2>
        <DataTable<OrchestratorPending>
          columns={pendingCols}
          data={pending}
          isLoading={snapshotQ.isLoading}
          isError={isError}
          errorMessage={errMsg}
          onRefresh={() => snapshotQ.refetch()}
          emptyMessage={t("orchestrator.empty.pending", "No pending jobs")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Hand className="h-4 w-4 text-amber-500" />
          {t("orchestrator.section.stale", "Stale Workers")}
        </h2>
        <DataTable<OrchestratorStale>
          columns={staleCols}
          data={stale}
          isLoading={snapshotQ.isLoading}
          isError={isError}
          errorMessage={errMsg}
          onRefresh={() => snapshotQ.refetch()}
          emptyMessage={t("orchestrator.empty.stale", "No stale workers")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <OctagonX className="h-4 w-4 text-red-500" />
          {t("orchestrator.section.stopList", "Stop List")}
        </h2>
        <DataTable<OrchestratorStopItem>
          columns={stopCols}
          data={stopList}
          isLoading={snapshotQ.isLoading}
          isError={isError}
          errorMessage={errMsg}
          onRefresh={() => snapshotQ.refetch()}
          emptyMessage={t("orchestrator.empty.stopList", "Stop list is empty")}
        />
      </section>

      <ConfirmDeleteDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={() => resetMut.mutate()}
        isLoading={resetMut.isPending}
        title={t("orchestrator.resetConfirmTitle", "Reset all assignments?")}
        description={t(
          "orchestrator.resetConfirmDesc",
          "This clears every active worker assignment. Workers will need to be re-activated. This cannot be undone."
        )}
        confirmLabel={t("orchestrator.resetAll", "Reset All")}
        cancelLabel={t("common.cancel", "Cancel")}
      />
    </div>
  );
}
