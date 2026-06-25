"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Wifi,
  WifiOff,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  MoreVertical,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import {
  fetchCameras,
  createCamera,
  updateCamera,
  deleteCamera,
  checkCamerasOnline,
  type Camera as CameraType,
  type CameraInput,
} from "@/services/camerasService";
import { DataTable } from "@/components/ui/data-table";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { usePermission } from "@/hooks/usePermission";
import { useTranslation } from "react-i18next";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DrawingCanvas, type Shape as RoiShape } from "@/components/DrawingCanvas";

const EMPTY: CameraInput = {
  name: "",
  code: "",
  source: "",
  stream_url: "",
  branch_id: "",
  location: "",
  ip_address: "",
  model: "",
  active: true,
  enable_counter: false,
  min_conf: 80,
  direction_in: "in",
};

export default function CamerasView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const can = usePermission("cameras");
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useDebounceSearch("", 300);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CameraType | null>(null);
  const [form, setForm] = React.useState<CameraInput>(EMPTY);
  const [roiShapes, setRoiShapes] = React.useState<RoiShape[]>([]);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const {
    data: cameras = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["cameras"],
    queryFn: fetchCameras,
  });

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return cameras;
    return cameras.filter((c) =>
      [c.name, c.location, c.branchName, c.ipAddress, c.model]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [cameras, debouncedSearch]);

  const online = cameras.filter((c) => c.isOnline).length;
  const total = cameras.length;

  const checkOnlineMut = useMutation({
    mutationFn: checkCamerasOnline,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success(t("cameras.onlineRefreshed", "Online status refreshed"));
    },
    onError: () => toast.error(t("cameras.onlineCheckFailed", "Failed to check online status")),
  });

  const saveMut = useMutation({
    mutationFn: editing
      ? (input: CameraInput) => updateCamera(editing.id, input)
      : (input: CameraInput) => createCamera(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success(editing ? t("cameras.editCamera") : t("cameras.addCamera"));
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : t("common.saveFailed", "Save failed")),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success(t("cameras.deleteSuccess", "Camera deleted"));
      setDeleteId(null);
    },
    onError: () => toast.error(t("cameras.deleteFailed", "Delete failed")),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setRoiShapes([]);
    setOpen(true);
  }
  function openEdit(cam: CameraType) {
    setEditing(cam);
    // Load existing ROI shapes from the camera's services[].points
    setRoiShapes(
      (cam.services ?? [])
        .filter((s) => Array.isArray(s.points) && s.points!.length >= 2)
        .map((s, i) => ({
          id: `roi-${i}`,
          points: (s.points ?? []).map((p) => ({ x: p.x, y: p.y })),
        }))
    );
    setForm({
      name: cam.name,
      code: cam.code ?? "",
      source: cam.source ?? cam.streamUrl ?? "",
      stream_url: cam.streamUrl ?? cam.source ?? "",
      branch_id: cam.branchId ?? "",
      location: cam.location ?? "",
      ip_address: cam.ipAddress ?? "",
      model: cam.model ?? "",
      active: cam.active,
      enable_counter: cam.enableCounter ?? false,
      min_conf: cam.minConf ?? 80,
      direction_in: cam.directionIn ?? "in",
    });
    setOpen(true);
  }

  // Permission read guard
  if (!can.read) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        <p className="text-sm text-muted-foreground">{t("common.noPermission", "You don't have permission to view this page.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold sm:text-lg">{t("cameras.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("cameras.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkOnlineMut.mutate()}
            disabled={checkOnlineMut.isPending}
          >
            <Activity className="mr-1.5 h-4 w-4" /> {t("cameras.checkOnline")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
          {can.create && (
            <Button
              size="sm"
              onClick={openCreate}
            >
              <Plus className="mr-1.5 h-4 w-4" /> {t("cameras.addCamera")}
            </Button>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: t("cameras.totalCameras"),
            value: total,
            icon: Camera,
            color: "text-blue-500",
          },
          {
            label: t("cameras.online"),
            value: online,
            icon: Wifi,
            color: "text-emerald-500",
          },
          {
            label: t("cameras.offline"),
            value: total - online,
            icon: WifiOff,
            color: "text-red-500",
          },
          {
            label: t("common.active"),
            value: cameras.filter((c) => c.active).length,
            icon: Activity,
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
                <p className="text-2xl font-bold">{isLoading ? "—" : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        isLoading={isLoading}
        emptyMessage={t("cameras.noCameras")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("common.searchPlaceholder")}
        columns={[
          {
            key: "name",
            header: t("cameras.cameraName"),
            render: (cam) => (
              <div className="flex items-center gap-2 font-medium">
                <Camera className="h-4 w-4 text-muted-foreground" />
                {cam.name}
              </div>
            ),
          },
          {
            key: "branch",
            header: t("cameras.branch"),
            render: (cam) => cam.branchName ?? "—",
          },
          {
            key: "location",
            header: t("cameras.location"),
            render: (cam) =>
              cam.location ? (
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {cam.location}
                </span>
              ) : (
                "—"
              ),
          },
          {
            key: "ip",
            header: t("cameras.cameraCode"),
            cellClassName: "font-mono text-xs",
            render: (cam) => cam.ipAddress ?? "—",
          },
          {
            key: "model",
            header: t("common.status"),
            render: (cam) => cam.model ?? "—",
          },
          {
            key: "online",
            header: t("cameras.status"),
            render: (cam) =>
              cam.isOnline !== undefined ? (
                <Badge
                  variant="outline"
                  className={
                    cam.isOnline
                      ? "border-emerald-500/40 text-emerald-600"
                      : "border-red-500/40 text-red-600"
                  }
                >
                  {cam.isOnline ? (
                    <>
                      <Wifi className="mr-1 h-3 w-3" />
                      {t("cameras.online")}
                    </>
                  ) : (
                    <>
                      <WifiOff className="mr-1 h-3 w-3" />
                      {t("cameras.offline")}
                    </>
                  )}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{t("common.unknown")}</span>
              ),
          },
          {
            key: "active",
            header: t("common.active"),
            render: (cam) => (
              <Badge variant={cam.active ? "default" : "secondary"}>
                {cam.active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-10",
            render: (cam) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {can.update && (
                    <DropdownMenuItem onClick={() => openEdit(cam)}>
                      <Pencil className="me-2 h-4 w-4" />
                      {t("common.edit")}
                    </DropdownMenuItem>
                  )}
                  {can.delete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(cam.id)}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("cameras.editCamera") : t("cameras.addCamera")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Row 1: Name + Code */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>{t("cameras.cameraName", "Camera Name")} <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t("cameras.namePlaceholder", "Main Entrance Cam")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("cameras.code", "Code")} <span className="text-destructive">*</span></Label>
                <Input
                  value={form.code ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="CAM-001"
                />
              </div>
            </div>

            {/* Branch */}
            <div className="grid gap-1.5">
              <Label>{t("cameras.branch", "Branch")} <span className="text-destructive">*</span></Label>
              <AsyncPaginatedSelect
                endpoint="/customer/branches"
                labelKey="name"
                valueKey="id"
                extraParams={{ active: 1 }}
                value={form.branch_id || null}
                onChange={(v) => setForm((f) => ({ ...f, branch_id: v ?? "" }))}
                placeholder={t("common.selectBranch", "Select branch")}
                isClearable
              />
            </div>

            {/* Source / Stream URL */}
            <div className="grid gap-1.5">
              <Label>{t("cameras.source", "Stream Source (RTSP URL)")}</Label>
              <Input
                value={form.source ?? form.stream_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value, stream_url: e.target.value }))}
                placeholder="rtsp://192.168.1.100:554/stream"
              />
            </div>

            {/* Row: Location + Model */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>{t("cameras.location", "Location")}</Label>
                <Input
                  value={form.location ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder={t("cameras.locationPlaceholder", "Entrance, Lobby...")}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("cameras.model", "Model")}</Label>
                <Input
                  value={form.model ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="Hikvision DS-2CD2143"
                />
              </div>
            </div>

            {/* Row: IP + Min Confidence */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>{t("cameras.ipAddress", "IP Address")}</Label>
                <Input
                  value={form.ip_address ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, ip_address: e.target.value }))}
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("cameras.minConf", "Min Confidence")} (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.min_conf ?? 80}
                  onChange={(e) => setForm((f) => ({ ...f, min_conf: Number(e.target.value) }))}
                  placeholder="80"
                />
              </div>
            </div>

            {/* Direction In */}
            <div className="grid gap-1.5">
              <Label>{t("cameras.directionIn", "Direction (People Counting)")}</Label>
              <AsyncPaginatedSelect
                options={[
                  { value: "in", label: t("cameras.directionInOption", "In → Out") },
                  { value: "out", label: t("cameras.directionOutOption", "Out → In") },
                ]}
                value={form.direction_in ?? "in"}
                onChange={(v) =>
                  setForm((f) => ({ ...f, direction_in: v ?? "in" }))
                }
                isClearable={false}
                height={36}
              />
            </div>

            {/* Toggle row */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active ?? true}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                />
                <Label>{t("common.active", "Active")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.enable_counter ?? false}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, enable_counter: v }))}
                />
                <Label>{t("cameras.enableCounter", "Enable People Counter")}</Label>
              </div>
            </div>

            {/* ROI Configuration */}
            <div className="grid gap-2 border-t pt-4">
              <div>
                <Label className="text-sm font-semibold">
                  {t("cameras.roiConfiguration", "ROI Configuration")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "cameras.roiConfigurationHint",
                    "Draw detection lines or zones for this camera. Lines (2 points) count crossings; areas (3+ points) define regions of interest."
                  )}
                </p>
              </div>
              <DrawingCanvas
                initialShapes={roiShapes}
                onShapesChange={setRoiShapes}
                canvasWidth={600}
                canvasHeight={400}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                // Persist ROI shapes as services[].points (matches the OLD
                // CameraForm contract; the builder serializes them as
                // services[i][points][j][x/y]).
                const services = roiShapes
                  .filter((s) => s.points.length >= 2)
                  .map((s) => ({
                    points: s.points.map((p) => ({
                      x: Math.round(p.x),
                      y: Math.round(p.y),
                    })),
                  }));
                saveMut.mutate({ ...form, services });
              }}
              disabled={saveMut.isPending || !form.name.trim()}
            >
              {saveMut.isPending ? t("validation.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cameras.deleteCamera")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("validation.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
