"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tag, Plus, Loader2, Pencil, Trash2, MoreVertical } from "lucide-react";
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
import {
  AdminCategory, fetchAdminCategories,
  createAdminCategory, updateAdminCategory, deleteAdminCategory,
  type AdminCategoryInput,
} from "@/services/adminService";



// ─── Dialog ────────────────────────────────────────────────────────────────────
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
  const qc = useQueryClient();
  const isEdit = !!category;

  const [nameAr, setNameAr] = useState(category?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(category?.nameEn ?? "");
  const [desc, setDesc] = useState(category?.description ?? "");
  const [status, setStatus] = useState(category?.status ?? "active");

  const handleOpen = (v: boolean) => {
    if (v) {
      setNameAr(category?.nameAr ?? "");
      setNameEn(category?.nameEn ?? "");
      setDesc(category?.description ?? "");
      setStatus(category?.status ?? "active");
    }
    onOpenChange(v);
  };

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminCategory(category!.id, { name_ar: nameAr, name_en: nameEn, description: desc })
        : createAdminCategory({ name_ar: nameAr, name_en: nameEn, description: desc }),
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("categories.updated", "Category updated")
          : t("categories.created", "Category created")
      );
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
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
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
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
      toast.success(t("categories.deleted", "Category deleted"));
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
            render: (c) => <StatusPill status={c.status} />,
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
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setDeleteTarget(c);
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

      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        category={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Category"
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
