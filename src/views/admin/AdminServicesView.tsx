"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { DataTable , ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import {
  AdminPageHeader,
  StatusPill,
} from "@/components/admin/AdminPageHeader";
import {
  AdminService,
  AdminServiceInput,
  fetchAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
} from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

// ─── Dialog ────────────────────────────────────────────────────────────────────
function ServiceDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: AdminService | null;
}) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const isEdit = !!service;

  const [nameEn, setNameEn] = useState(service?.nameEn ?? "");
  const [nameAr, setNameAr] = useState(service?.nameAr ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(String(service?.price ?? ""));
  const [active, setActive] = useState<"active" | "inactive">(
    service?.active === false ? "inactive" : "active"
  );

  useEffect(() => {
    if (open) {
      setNameEn(service?.nameEn ?? "");
      setNameAr(service?.nameAr ?? "");
      setDescription(service?.description ?? "");
      setPrice(String(service?.price ?? ""));
      setActive(service?.active === false ? "inactive" : "active");
    }
  }, [open, service]);

  const buildInput = (): AdminServiceInput => ({
    name_en: nameEn,
    name_ar: nameAr,
    description,
    price: price ? Number(price) : undefined,
    active: active === "active",
  });

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminService(service!.id, buildInput())
        : createAdminService(buildInput()),
    onSuccess: () => {
      toast.success(isEdit ? "Service updated" : "Service created");
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Service" : "Create Service"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name (EN) *</Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Service name in English"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Name (AR)</Label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="اسم الخدمة بالعربية"
              dir="rtl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Service description"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.status", "Status")}</Label>
            <Select
              value={active}
              onValueChange={(v) => setActive(v as "active" | "inactive")}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={!nameEn || mut.isPending}
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
export default function AdminServicesView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);
  const [deleteTarget, setDeleteTarget] = useState<AdminService | null>(null);

  const {
    data: services = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => fetchAdminServices(),
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) =>
      [s.nameEn, s.nameAr, s.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [services, debouncedSearch]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminService(id),
    onSuccess: () => {
      toast.success("Service deleted");
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("admin.noAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.services"
        Icon={Briefcase}
        onRefresh={() =>
          qc.invalidateQueries({ queryKey: ["admin", "services"] })
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
            Add Service
          </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage="No services found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search services…"
        columns={[
          {
            key: "nameEn",
            header: "Name (EN)",
            render: (s) => <span className="font-medium">{s.nameEn ?? s.nameAr ?? "—"}</span>,
          },
          {
            key: "nameAr",
            header: "Name (AR)",
            render: (s) => <span dir="rtl">{s.nameAr ?? "—"}</span>,
          },
          {
            key: "description",
            header: "Description",
            cellClassName: "max-w-xs truncate text-muted-foreground",
            render: (s) => s.description ?? "—",
          },
          {
            key: "price",
            header: "Price",
            render: (s) => <span>{s.price != null ? `$${s.price}` : "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (s) => <StatusPill status={s.active !== false ? "active" : "inactive"} />,
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (s) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {can.update && (<DropdownMenuItem
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>)}
                  {can.delete && (<DropdownMenuItem
                    onClick={() => setDeleteTarget(s)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", "Delete")}
                  </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <ServiceDialog
        open={open}
        onOpenChange={setOpen}
        service={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Service"
        description={`Are you sure you want to delete "${deleteTarget?.nameEn ?? deleteTarget?.nameAr}"? This action cannot be undone.`}
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
