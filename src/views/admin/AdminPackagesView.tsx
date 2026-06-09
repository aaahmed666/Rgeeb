"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert } from "lucide-react";
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
import { DataTable , ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AdminPageHeader,
  StatusPill,
} from "@/components/admin/AdminPageHeader";
import {
  AdminPackage,
  AdminPackageInput,
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  fetchAdminServices,
  fetchAdminCategories,
} from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

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
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const isEdit = !!pkg;

  // FIX: use correct AdminPackage fields (descriptionAr/En, durationMonths, maxCameras, maxBranches)
  const [nameAr, setNameAr] = useState(pkg?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(pkg?.nameEn ?? "");
  const [descAr, setDescAr] = useState(pkg?.descriptionAr ?? "");
  const [descEn, setDescEn] = useState(pkg?.descriptionEn ?? "");
  const [price, setPrice] = useState(String(pkg?.price ?? ""));
  const [durationMonths, setDurationMonths] = useState(
    String(pkg?.durationMonths ?? "")
  );
  const [maxCameras, setMaxCameras] = useState(String(pkg?.maxCameras ?? ""));
  const [maxBranches, setMaxBranches] = useState(
    String(pkg?.maxBranches ?? "")
  );
  // FIX: active (boolean) not status (string)
  const [active, setActive] = useState<"active" | "inactive">(
    pkg?.active === false ? "inactive" : "active"
  );
  const [serviceIds, setServiceIds] = useState<string[]>(pkg?.serviceIds ?? []);
  const [categoryId, setCategoryId] = useState<string>(pkg?.categoryId ?? "");

  const servicesQ = useQuery({
    queryKey: ["admin", "services"],
    queryFn: fetchAdminServices,
  });
  const categoriesQ = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchAdminCategories,
  });

  useEffect(() => {
    if (open) {
      setNameAr(pkg?.nameAr ?? "");
      setNameEn(pkg?.nameEn ?? "");
      setDescAr(pkg?.descriptionAr ?? "");
      setDescEn(pkg?.descriptionEn ?? "");
      setPrice(String(pkg?.price ?? ""));
      setDurationMonths(String(pkg?.durationMonths ?? ""));
      setMaxCameras(String(pkg?.maxCameras ?? ""));
      setMaxBranches(String(pkg?.maxBranches ?? ""));
      setActive(pkg?.active === false ? "inactive" : "active");
      setServiceIds(pkg?.serviceIds ?? []);
      setCategoryId(pkg?.categoryId ?? "");
    }
  }, [open, pkg]);

  // FIX: build correct AdminPackageInput (duration_months number, description_ar/en)
  const buildInput = (): AdminPackageInput => ({
    name_ar: nameAr,
    name_en: nameEn,
    description_ar: descAr || undefined,
    description_en: descEn || undefined,
    price: price ? Number(price) : 0,
    duration_months: durationMonths ? Number(durationMonths) : 1,
    max_cameras: maxCameras ? Number(maxCameras) : undefined,
    max_branches: maxBranches ? Number(maxBranches) : undefined,
    active: active === "active",
    category_id: categoryId || undefined,
    "service_ids[]": serviceIds.length > 0 ? serviceIds : undefined,
  });

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminPackage(pkg!.id, buildInput())
        : createAdminPackage(buildInput()),
    onSuccess: () => {
      toast.success(isEdit ? t("admin.packages.packageUpdatedSuccess") : t("admin.packages.packageAddedSuccess"));
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-primary" />
            {isEdit ? t("admin.packages.editPackage") : t("admin.packages.addPackage")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("admin.packages.arabicName")} *</Label>
              <Input
                dir="rtl"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="الاسم بالعربية"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.packages.englishName")} *</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="English name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description (AR)</Label>
            <Textarea
              dir="rtl"
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
              placeholder="الوصف بالعربية"
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description (EN)</Label>
            <Textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              placeholder="English description"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Price *</Label>
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
              <Label>Duration (months) *</Label>
              <Input
                type="number"
                min={1}
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Max Cameras</Label>
              <Input
                type="number"
                min={0}
                value={maxCameras}
                onChange={(e) => setMaxCameras(e.target.value)}
                placeholder="10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max Branches</Label>
              <Input
                type="number"
                min={0}
                value={maxBranches}
                onChange={(e) => setMaxBranches(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <AsyncPaginatedSelect
              endpoint="/admin/categories"
              labelKey="name_en"
              valueKey="id"
              value={categoryId || null}
              onChange={(v) => setCategoryId(v ?? "")}
              placeholder="Select category (optional)"
              isClearable
            />
          </div>
          <div className="space-y-1.5">
            <Label>Services</Label>
            <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
              {servicesQ.isLoading ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Loading services…
                </div>
              ) : (
                (servicesQ.data ?? []).map((svc) => (
                  <label
                    key={svc.id}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={serviceIds.includes(svc.id)}
                      onCheckedChange={(checked) =>
                        setServiceIds((prev) =>
                          checked
                            ? [...prev, svc.id]
                            : prev.filter((id) => id !== svc.id)
                        )
                      }
                    />
                    <span className="text-sm">
                      {svc.nameEn ?? svc.nameAr ?? svc.id}
                    </span>
                  </label>
                ))
              )}
              {!servicesQ.isLoading && !servicesQ.data?.length && (
                <div className="p-2 text-sm text-muted-foreground">
                  No services available
                </div>
              )}
            </div>
            {serviceIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {serviceIds.map((sid) => {
                  const svc = servicesQ.data?.find((s) => s.id === sid);
                  return (
                    <Badge
                      key={sid}
                      variant="secondary"
                      className="text-xs"
                    >
                      {svc?.nameEn ?? svc?.nameAr ?? sid}
                    </Badge>
                  );
                })}
              </div>
            )}
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={
              !nameAr || !nameEn || !price || !durationMonths || mut.isPending
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

// ─── Main view ─────────────────────────────────────────────────────────────────
export default function AdminPackagesView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPackage | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);
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
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return packages;
    // FIX: use real AdminPackage fields (descriptionEn, categoryName, serviceNames)
    return packages.filter((p) =>
      [p.nameEn, p.nameAr, p.descriptionEn, p.categoryName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [packages, debouncedSearch]); // FIX: was [packages, search] — wrong dep

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminPackage(id),
    onSuccess: () => {
      toast.success(t("admin.packages.packageDeletedSuccess"));
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
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
        titleKey="admin.packages"
        Icon={PackageIcon}
        onRefresh={() =>
          qc.invalidateQueries({ queryKey: ["admin", "packages"] })
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
            {t("admin.packages.addPackage")}
          </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : t("admin.common.loadingFailed")}
        emptyMessage={t("admin.packages.noPackagesFound")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("common.searchPlaceholder")}
        columns={[
          {
            key: "nameAr",
            header: t("admin.packages.arabicName"),
            render: (p) => <span dir="rtl">{p.nameAr ?? "—"}</span>,
          },
          {
            key: "nameEn",
            header: t("admin.packages.englishName"),
            render: (p) => (
              <span className="font-medium">{p.nameEn ?? "—"}</span>
            ),
          },
          {
            // FIX: was p.category — field is categoryName
            key: "categoryName",
            header: t("admin.packages.category"),
            render: (p) => <span>{p.categoryName ?? "—"}</span>,
          },
          {
            key: "price",
            header: t("admin.packages.price"),
            render: (p) => <span>{p.price != null ? `$${p.price}` : "—"}</span>,
          },
          {
            // FIX: was p.duration — field is durationMonths
            key: "durationMonths",
            header: t("admin.packages.duration"),
            render: (p) => (
              <span>{p.durationMonths ? `${p.durationMonths} mo` : "—"}</span>
            ),
          },
          {
            key: "maxCameras",
            header: t("admin.packages.maxCameras"),
            render: (p) => <span>{p.maxCameras ?? "—"}</span>,
          },
          {
            // FIX: was p.services — field is serviceNames
            key: "services",
            header: t("admin.packages.services"),
            render: (p) =>
              p.serviceNames?.length ? (
                <div className="flex flex-wrap gap-1">
                  {p.serviceNames.slice(0, 2).map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-xs"
                    >
                      {s}
                    </Badge>
                  ))}
                  {p.serviceNames.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      +{p.serviceNames.length - 2}
                    </Badge>
                  )}
                </div>
              ) : (
                "—"
              ),
          },
          {
            key: "status",
            header: t("common.status"),
            // FIX: was p.status — field is active (boolean)
            render: (p) => (
              <StatusPill status={p.active !== false ? "active" : "inactive"} />
            ),
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
                  {can.update && (<DropdownMenuItem
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>)}
                  {can.delete && (<DropdownMenuItem
                    onClick={() => setDeleteTarget(p)}
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

      <PackageDialog
        open={open}
        onOpenChange={setOpen}
        pkg={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("admin.packages.deletePackage")}
        description={`${t("admin.common.confirmDelete")} "${deleteTarget?.nameEn ?? deleteTarget?.nameAr}"?`}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (deleteTarget) delMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
