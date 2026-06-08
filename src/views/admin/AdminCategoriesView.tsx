"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
  Upload,
} from "lucide-react";
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
import { DataTable , ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import {
  AdminPageHeader,
  StatusPill,
} from "@/components/admin/AdminPageHeader";
import {
  AdminCategory,
  AdminCategoryInput,
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "@/services/adminService";

// ─── Dialog ────────────────────────────────────────────────────────────────────
// Postman: POST /admin/categories/create  fields: name_en, name_ar, description, active
// Postman: POST /admin/categories/update  fields: name_ar, name_en, description, active, id
// AdminCategory interface: id, nameAr?, nameEn?, description?, image?, active?
// AdminCategoryInput:      name_ar, name_en, description?, active?, category_image?
function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: AdminCategory | null;
}) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const isEdit = !!category;

  const [nameAr, setNameAr] = useState(category?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(category?.nameEn ?? "");
  const [desc, setDesc] = useState(category?.description ?? "");
  // active (boolean) — NOT status (string)
  const [active, setActive] = useState<"active" | "inactive">(
    category?.active === false ? "inactive" : "active"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    category?.image ?? null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // useEffect to reset form when dialog opens with new category
  useEffect(() => {
    if (open) {
      setNameAr(category?.nameAr ?? "");
      setNameEn(category?.nameEn ?? "");
      setDesc(category?.description ?? "");
      setActive(category?.active === false ? "inactive" : "active");
      setImageFile(null);
      setImagePreview(category?.image ?? null);
    }
  }, [open, category]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const buildInput = (): AdminCategoryInput => ({
    name_ar: nameAr,
    name_en: nameEn,
    description: desc || undefined,
    active: active === "active",
    category_image: imageFile ?? undefined,
  });

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminCategory(category!.id, buildInput())
        : createAdminCategory(buildInput()),
    onSuccess: () => {
      toast.success(isEdit ? "Category updated" : "Category created");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {isEdit
              ? t("categories.edit", "Edit Category")
              : t("categories.create", "Create Category")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("categories.nameAr", "Arabic Name")} *</Label>
            <Input
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="الاسم بالعربية"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("categories.nameEn", "English Name")} *</Label>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="English name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("categories.description", "Description")}</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("categories.image", "Category Image")}</Label>
            <div
              className="flex items-center gap-3 rounded-lg border border-dashed p-3 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt=""
                  className="h-16 w-16 rounded object-cover shrink-0"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded bg-muted shrink-0">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {imageFile ? imageFile.name : "Click to upload image"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
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
export default function AdminCategoriesView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchAdminCategories,
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      [c.nameEn, c.nameAr, c.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [categories, debouncedSearch]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
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
        titleKey="admin.categories"
        Icon={Tag}
        onRefresh={() =>
          qc.invalidateQueries({ queryKey: ["admin", "categories"] })
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
            {t("categories.add", "Add Category")}
          </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage={t("categories.noResults", "No categories found")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t(
          "categories.searchPlaceholder",
          "Search categories…"
        )}
        columns={[
          {
            key: "image",
            header: t("categories.image", "Image"),
            headClassName: "w-16",
            render: (c) =>
              c.image ? (
                <img
                  src={c.image}
                  alt=""
                  className="h-9 w-9 rounded object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded bg-muted" />
              ),
          },
          {
            key: "nameAr",
            header: t("categories.nameAr", "Arabic Name"),
            render: (c) => <span dir="rtl">{c.nameAr ?? "—"}</span>,
          },
          {
            key: "nameEn",
            header: t("categories.nameEn", "English Name"),
            render: (c) => c.nameEn ?? "—",
          },
          {
            key: "description",
            header: t("categories.description", "Description"),
            cellClassName: "max-w-xs truncate text-muted-foreground",
            render: (c) => c.description ?? "—",
          },
          {
            key: "status",
            header: t("common.status", "Status"),
            // AdminCategory.active is boolean — derive status string for StatusPill
            render: (c) => (
              <StatusPill status={c.active !== false ? "active" : "inactive"} />
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (c) => (
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
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>)}
                  {can.delete && (<DropdownMenuItem
                    onClick={() => setDeleteTarget(c)}
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

      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        category={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Category"
        description={`Delete "${deleteTarget?.nameEn ?? deleteTarget?.nameAr}"? This cannot be undone.`}
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
