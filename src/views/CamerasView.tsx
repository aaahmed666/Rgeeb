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

const EMPTY: CameraInput = {
  name: "",
  stream_url: "",
  location: "",
  active: true,
};

export default function CamerasView() {
  const qc = useQueryClient();
  const can = usePermission("cameras");
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange, clearSearch, isSearching } = useDebounceSearch("", 300);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CameraType | null>(null);
  const [form, setForm] = React.useState<CameraInput>(EMPTY);
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
      toast.success("Online status refreshed");
    },
    onError: () => toast.error("Failed to check online status"),
  });

  const saveMut = useMutation({
    mutationFn: editing
      ? (input: CameraInput) => updateCamera(editing.id, input)
      : (input: CameraInput) => createCamera(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success(editing ? "Camera updated" : "Camera added");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCamera,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cameras"] });
      toast.success("Camera deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }
  function openEdit(cam: CameraType) {
    setEditing(cam);
    setForm({
      name: cam.name,
      stream_url: cam.streamUrl ?? "",
      location: cam.location ?? "",
      ip_address: cam.ipAddress ?? "",
      model: cam.model ?? "",
      active: cam.active,
    });
    setOpen(true);
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
            <h1 className="text-lg font-bold sm:text-xl">Cameras</h1>
            <p className="text-xs text-muted-foreground">
              Manage surveillance cameras across branches
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
            <Activity className="mr-1.5 h-4 w-4" /> Check Online
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
            <Plus className="mr-1.5 h-4 w-4" /> Add Camera
          </Button>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Cameras",
            value: total,
            icon: Camera,
            color: "text-blue-500",
          },
          {
            label: "Online",
            value: online,
            icon: Wifi,
            color: "text-emerald-500",
          },
          {
            label: "Offline",
            value: total - online,
            icon: WifiOff,
            color: "text-red-500",
          },
          {
            label: "Active",
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
        emptyMessage="No cameras found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search cameras…"
        columns={[
          {
            key: "name",
            header: "Name",
            render: (cam) => (
              <div className="flex items-center gap-2 font-medium">
                <Camera className="h-4 w-4 text-muted-foreground" />
                {cam.name}
              </div>
            ),
          },
          {
            key: "branch",
            header: "Branch",
            render: (cam) => cam.branchName ?? "—",
          },
          {
            key: "location",
            header: "Location",
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
            header: "IP Address",
            cellClassName: "font-mono text-xs",
            render: (cam) => cam.ipAddress ?? "—",
          },
          { key: "model", header: "Model", render: (cam) => cam.model ?? "—" },
          {
            key: "online",
            header: "Status",
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
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="mr-1 h-3 w-3" />
                      Offline
                    </>
                  )}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Unknown</span>
              ),
          },
          {
            key: "active",
            header: "Active",
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
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  )}
                  {can.delete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteId(cam.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Camera" : "Add Camera"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Camera name"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Stream URL</Label>
              <Input
                value={form.stream_url ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stream_url: e.target.value }))
                }
                placeholder="rtsp://..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Location</Label>
              <Input
                value={form.location ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="Entrance, Lobby..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label>IP Address</Label>
              <Input
                value={form.ip_address ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ip_address: e.target.value }))
                }
                placeholder="192.168.1.100"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Model</Label>
              <Input
                value={form.model ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, model: e.target.value }))
                }
                placeholder="Camera model"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name.trim()}
            >
              {saveMut.isPending ? "Saving…" : "Save"}
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
            <AlertDialogTitle>Delete Camera?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
