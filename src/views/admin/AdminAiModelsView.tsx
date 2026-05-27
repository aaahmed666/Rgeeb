"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Loader2, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  AdminPageHeader,
  StatusPill,
} from "@/components/admin/AdminPageHeader";
import { AdminAiModel, fetchAdminAiModels, createAdminAiModel, updateAdminAiModel, deleteAdminAiModel } from "@/services/adminService";

// ─── CRUD helpers ──────────────────────────────────────────────────────────────
);
}

// ─── Dialog ────────────────────────────────────────────────────────────────────
function AiModelDialog({
  open,
  onOpenChange,
  model,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  model: AdminAiModel | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!model;

  const [name, setName] = useState(model?.name ?? "");
  const [version, setVersion] = useState(model?.version ?? "");
  const [modelPath, setModelPath] = useState(model?.modelPath ?? "");
  const [status, setStatus] = useState(model?.status ?? "active");

  const handleOpen = (v: boolean) => {
    if (v) {
      setName(model?.name ?? "");
      setVersion(model?.version ?? "");
      setModelPath(model?.modelPath ?? "");
      setStatus(model?.status ?? "active");
    }
    onOpenChange(v);
  };

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminAiModel(model!.id, {
                        name,
            version: version || undefined,
            model_path: modelPath || undefined,
            status,
          })
        : createAdminAiModel({
            name,
            version: version || undefined,
            model_path: modelPath || undefined,
            status,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "AI model updated" : "AI model created");
      qc.invalidateQueries({ queryKey: ["admin", "aiModels"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpen}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {isEdit ? "Edit AI Model" : "Create AI Model"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Model name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Version</Label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.0.0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Model Path</Label>
            <Input
              value={modelPath}
              onChange={(e) => setModelPath(e.target.value)}
              placeholder="/models/detector.pt"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.status", "Status")}</Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {t("common.active", "Active")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("common.inactive", "Inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={!name || mut.isPending}
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

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function AdminAiModelsView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAiModel | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useDebounceSearch("", 300);
  const [deleteTarget, setDeleteTarget] = useState<AdminAiModel | null>(null);

  const {
    data: models = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "aiModels"],
    queryFn: fetchAdminAiModels,
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) =>
      [m.name, m.version, m.modelPath, m.services]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [models, debouncedSearch]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminAiModel(id),
    onSuccess: () => {
      toast.success("AI model deleted");
      qc.invalidateQueries({ queryKey: ["admin", "aiModels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.aiModels"
        Icon={Bot}
        onRefresh={() =>
          qc.invalidateQueries({ queryKey: ["admin", "aiModels"] })
        }
        isRefreshing={isLoading}
        right={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add AI Model
          </Button>
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage="No AI models found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search AI models…"
        columns={[
          {
            key: "name",
            header: "Name",
            render: (m) => <span className="font-medium">{m.name}</span>,
          },
          {
            key: "version",
            header: "Version",
            render: (m) => <span>{m.version ?? "—"}</span>,
          },
          {
            key: "modelPath",
            header: "Model Path",
            render: (m) => (
              <span className="font-mono text-xs text-muted-foreground">
                {m.modelPath ?? "—"}
              </span>
            ),
          },
          {
            key: "services",
            header: "Services",
            render: (m) => <span>{m.services ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (m) => <StatusPill status={m.status} />,
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (m) => (
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
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(m);
                      setOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setDeleteTarget(m);
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", "Delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <AiModelDialog
        open={open}
        onOpenChange={setOpen}
        model={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete AI Model"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteTarget) delMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
