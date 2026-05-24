"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package as PackageIcon,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Badge } from "@/components/ui/badge";
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
import { DataTable } from "@/components/ui/data-table";
import {
  AdminPageHeader,
  StatusPill,
} from "@/components/admin/AdminPageHeader";
import { AdminPackage, fetchAdminPackages } from "@/services/adminService";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

// ─── CRUD helpers ──────────────────────────────────────────────────────────────
async function createPackage(input: {
  name_ar: string;
  name_en: string;
  description?: string;
  price?: string | number;
  duration?: string;
  status?: string;
}) {
  return api.post(endpoints.admin.packageCreate, input);
}

async function updatePackage(
  input: { id: string } & Partial<{
    name_ar: string;
    name_en: string;
    description?: string;
    price?: string | number;
    duration?: string;
    status?: string;
  }>
) {
  return api.post(endpoints.admin.packageUpdate, input);
}

async function deletePackage(id: string) {
  return api.post(endpoints.admin.packageDelete, { id });
}

// ─── Dialog ────────────────────────────────────────────────────────────────────
function PackageDialog({
  open,
  onOpenChange,
  pkg,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pkg: AdminPackage | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!pkg;

  const [nameAr, setNameAr] = useState(pkg?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(pkg?.nameEn ?? "");
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [price, setPrice] = useState(String(pkg?.price ?? ""));
  const [duration, setDuration] = useState(pkg?.duration ?? "");
  const [status, setStatus] = useState(pkg?.status ?? "active");

  const handleOpen = (v: boolean) => {
    if (v) {
      setNameAr(pkg?.nameAr ?? "");
      setNameEn(pkg?.nameEn ?? "");
      setDescription(pkg?.description ?? "");
      setPrice(String(pkg?.price ?? ""));
      setDuration(pkg?.duration ?? "");
      setStatus(pkg?.status ?? "active");
    }
    onOpenChange(v);
  };

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updatePackage({
            id: pkg!.id,
            name_ar: nameAr,
            name_en: nameEn,
            description,
            price: price ? Number(price) : undefined,
            duration,
            status,
          })
        : createPackage({
            name_ar: nameAr,
            name_en: nameEn,
            description,
            price: price ? Number(price) : undefined,
            duration,
            status,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Package updated" : "Package created");
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
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
            <PackageIcon className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Package" : "Create Package"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Arabic Name *</Label>
            <Input
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="الاسم بالعربية"
            />
          </div>
          <div className="space-y-1.5">
            <Label>English Name *</Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="English name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Package description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Duration</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 1y or 6m"
              />
            </div>
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
            disabled={!nameAr || !nameEn || mut.isPending}
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
export default function AdminPackagesView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPackage | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminPackage | null>(null);

  const {
    data: packages = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: fetchAdminPackages,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter((p) =>
      [p.nameEn, p.nameAr, p.description, p.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [packages, search]);

  const delMut = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: () => {
      toast.success("Package deleted");
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.packages"
        Icon={PackageIcon}
        onRefresh={() =>
          qc.invalidateQueries({ queryKey: ["admin", "packages"] })
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
            Add Package
          </Button>
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage="No packages found"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search packages…"
        columns={[
          {
            key: "category",
            header: "Category",
            render: (p) => <span>{p.category ?? "—"}</span>,
          },
          {
            key: "nameAr",
            header: "Arabic Name",
            render: (p) => <span dir="rtl">{p.nameAr ?? "—"}</span>,
          },
          {
            key: "nameEn",
            header: "English Name",
            render: (p) => (
              <span className="font-medium">{p.nameEn ?? "—"}</span>
            ),
          },
          {
            key: "price",
            header: "Price",
            render: (p) => <span>{p.price != null ? `$${p.price}` : "—"}</span>,
          },
          {
            key: "duration",
            header: "Duration",
            render: (p) => <span>{p.duration || "—"}</span>,
          },
          {
            key: "services",
            header: "Services",
            render: (p) =>
              p.services?.length ? (
                <div className="flex flex-wrap gap-1">
                  {p.services.slice(0, 3).map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-xs"
                    >
                      {s}
                    </Badge>
                  ))}
                  {p.services.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      +{p.services.length - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                "—"
              ),
          },
          {
            key: "status",
            header: "Status",
            render: (p) => <StatusPill status={p.status} />,
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (p) => (
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
                      setEditing(p);
                      setOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setDeleteTarget(p);
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

      <PackageDialog
        open={open}
        onOpenChange={setOpen}
        pkg={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Package"
        description={`Are you sure you want to delete "${deleteTarget?.nameEn ?? deleteTarget?.nameAr}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => { if (deleteTarget) delMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />
    </div>
  );
}
