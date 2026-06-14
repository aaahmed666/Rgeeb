"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Radar,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import {
  type AdminDetection,
  type AdminDetectionInput,
  fetchAdminDetections,
  createAdminDetection,
  updateAdminDetection,
  deleteAdminDetection,
} from "@/services/adminService";

function field(v?: string | number) {
  return v === undefined || v === null || v === "" ? "—" : String(v);
}

function DetectionDialog({
  open,
  onOpenChange,
  detection,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  detection: AdminDetection | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!detection;

  const [clientId, setClientId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [aiModelId, setAiModelId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [type, setType] = useState("");
  const [score, setScore] = useState("");
  const [detectedAt, setDetectedAt] = useState("");

  useEffect(() => {
    if (!open) return;
    setClientId(detection?.clientId ?? "");
    setBranchId(detection?.branchId ?? "");
    setCameraId(detection?.cameraId ?? "");
    setAiModelId(detection?.aiModelId ?? "");
    setServiceId(detection?.serviceId ?? "");
    setType(detection?.type ?? "");
    setScore(detection?.score !== undefined ? String(detection.score) : "");
    setDetectedAt(detection?.detectedAt ?? "");
  }, [open, detection]);

  const buildInput = (): AdminDetectionInput => ({
    client_id: clientId,
    branch_id: branchId,
    camera_id: cameraId,
    ai_model_id: aiModelId || undefined,
    service_id: serviceId || undefined,
    type: type || undefined,
    score: score ? Number(score) : undefined,
    detected_at: detectedAt || undefined,
  });

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminDetection(detection!.id, buildInput())
        : createAdminDetection(buildInput()),
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("adminDetections.updated", "Detection updated")
          : t("adminDetections.created", "Detection created")
      );
      qc.invalidateQueries({ queryKey: ["admin", "detections"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const Row = ({
    label,
    value,
    onChange,
    placeholder,
    type: inputType = "text",
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
  }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            {isEdit
              ? t("adminDetections.edit", "Edit Detection")
              : t("adminDetections.create", "Create Detection")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
          {Row({
            label: `${t("adminDetections.clientId", "Client ID")} *`,
            value: clientId,
            onChange: setClientId,
            placeholder: "1",
            type: "number",
          })}
          {Row({
            label: `${t("adminDetections.branchId", "Branch ID")} *`,
            value: branchId,
            onChange: setBranchId,
            placeholder: "1",
            type: "number",
          })}
          {Row({
            label: `${t("adminDetections.cameraId", "Camera ID")} *`,
            value: cameraId,
            onChange: setCameraId,
            placeholder: "1",
            type: "number",
          })}
          {Row({
            label: t("adminDetections.aiModelId", "AI Model ID"),
            value: aiModelId,
            onChange: setAiModelId,
            placeholder: "—",
            type: "number",
          })}
          {Row({
            label: t("adminDetections.serviceId", "Service ID"),
            value: serviceId,
            onChange: setServiceId,
            placeholder: "—",
            type: "number",
          })}
          {Row({
            label: t("adminDetections.type", "Type"),
            value: type,
            onChange: setType,
            placeholder: "e.g. ppe_violation",
          })}
          {Row({
            label: t("adminDetections.score", "Score"),
            value: score,
            onChange: setScore,
            placeholder: "0.0 – 1.0",
            type: "number",
          })}
          {Row({
            label: t("adminDetections.detectedAt", "Detected At"),
            value: detectedAt,
            onChange: setDetectedAt,
            placeholder: "YYYY-MM-DD HH:mm:ss",
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={
              !clientId.trim() ||
              !branchId.trim() ||
              !cameraId.trim() ||
              mut.isPending
            }
            onClick={() => mut.mutate()}
            className="gap-2"
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDetectionsView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminDetection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDetection | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);

  const {
    data: detections = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "detections"],
    queryFn: fetchAdminDetections,
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return detections;
    return detections.filter((d) =>
      [d.type, d.clientName, d.branchName, d.cameraName, d.clientId, d.branchId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [detections, debouncedSearch]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminDetection(id),
    onSuccess: () => {
      toast.success(t("adminDetections.deleted", "Detection deleted"));
      qc.invalidateQueries({ queryKey: ["admin", "detections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="adminDetections.title"
        Icon={Radar}
        onRefresh={() =>
          qc.invalidateQueries({ queryKey: ["admin", "detections"] })
        }
        isRefreshing={isLoading}
        right={
          can.create ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t("adminDetections.add", "Add Detection")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        emptyMessage={t("adminDetections.empty", "No detections found")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("adminDetections.search", "Search detections…")}
        columns={[
          {
            key: "type",
            header: t("adminDetections.type", "Type"),
            render: (d) =>
              d.type ? (
                <Badge variant="secondary" className="capitalize">
                  {d.type.replace(/_/g, " ")}
                </Badge>
              ) : (
                "—"
              ),
          },
          {
            key: "client",
            header: t("adminDetections.client", "Client"),
            render: (d) => field(d.clientName ?? d.clientId),
          },
          {
            key: "branch",
            header: t("adminDetections.branch", "Branch"),
            render: (d) => field(d.branchName ?? d.branchId),
          },
          {
            key: "camera",
            header: t("adminDetections.camera", "Camera"),
            render: (d) => field(d.cameraName ?? d.cameraId),
          },
          {
            key: "score",
            header: t("adminDetections.score", "Score"),
            render: (d) =>
              d.score !== undefined ? (
                <Badge variant="outline">{Math.round(d.score * 100)}%</Badge>
              ) : (
                "—"
              ),
          },
          {
            key: "detectedAt",
            header: t("adminDetections.detectedAt", "Detected At"),
            render: (d) => (
              <span className="text-xs text-muted-foreground">
                {field(d.detectedAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (d) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {can.update && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(d);
                        setOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {t("common.edit", "Edit")}
                    </DropdownMenuItem>
                  )}
                  {can.delete && (
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(d)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete", "Delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <DetectionDialog open={open} onOpenChange={setOpen} detection={editing} />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("adminDetections.deleteTitle", "Delete detection")}
        description={t(
          "adminDetections.deleteDesc",
          "Are you sure you want to delete this detection record?"
        )}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        isLoading={delMut.isPending}
        onConfirm={() => {
          if (deleteTarget) delMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
