"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Plus,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import {
  Department,
  DepartmentInput,
  PaginatedResult,
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "@/services/organizationService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { usePermission } from "@/hooks/usePermission";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";

export default function DepartmentsView() {
  const { t } = useTranslation();
  const can = usePermission("departments");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  React.useEffect(() => { setPage(1); }, [debouncedSearch]);

  const {
    data: deptPage,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["org", "departments", { page, per_page: PER_PAGE, keyword: debouncedSearch }],
    queryFn: () => fetchDepartments({ page, per_page: PER_PAGE, keyword: debouncedSearch || undefined }),
  });

  const departments = (deptPage as unknown as PaginatedResult<Department>)?.items ?? (deptPage as Department[] ?? []);
  const total = (deptPage as unknown as PaginatedResult<Department>)?.total ?? (departments as Department[]).length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = departments as Department[];

  const delMut = useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      toast.success(t("departments.deleted", "Department deleted"));
      qc.invalidateQueries({ queryKey: ["org", "departments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">
              {t("departments.title", "Departments")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("departments.subtitle", "Organize teams by department")}
            </p>
          </div>
        </div>
        {can.create && (
        <Button
          data-tour="add-department"
          className="gap-2 shadow-sm shadow-primary/20"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t("departments.new", "Add New Department")}
        </Button>
        )}
      </header>

      <DataTable
        data={filtered as (Department & { id: string | number })[]}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage={t("departments.empty", "No departments yet")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t(
          "departments.searchPlaceholder",
          "Search departments…"
        )}
        columns={[
          {
            key: "nameEn",
            header: t("departments.nameEn", "English Name"),
            render: (d) => (
              <span className="font-medium">{d.nameEn || "—"}</span>
            ),
          },
          {
            key: "nameAr",
            header: t("departments.nameAr", "Arabic Name"),
            render: (d) => <span dir="rtl">{d.nameAr || "—"}</span>,
          },
          {
            key: "status",
            header: t("departments.status", "Status"),
            render: (d) => (
              <Badge
                className={
                  d.active
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                }
              >
                {d.active
                  ? t("common.active", "Active")
                  : t("common.inactive", "Inactive")}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (d) => (
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
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(d);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="me-2 h-4 w-4" />{" "}
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  )}
                  {can.delete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteTarget(d)}
                  >
                    <Trash2 className="me-2 h-4 w-4" />{" "}
                    {t("common.delete", "Delete")}
                  </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3 text-sm text-muted-foreground">
          <span>{t("common.showingOf", "Showing {{start}}–{{end}} of {{total}}", { start: (page-1)*PER_PAGE+1, end: Math.min(page*PER_PAGE, total), total })}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <DepartmentDrawer
        open={open}
        onOpenChange={setOpen}
        dept={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("departments.confirmDeleteTitle", "Delete Department")}
        description={t(
          "departments.confirmDeleteDesc",
          "Are you sure you want to delete this department? This action cannot be undone."
        )}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={() => {
          if (deleteTarget) delMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

interface DeptFormState extends DepartmentInput {
  manager_id?: string;
  branch_id?: string;
}

function DepartmentDrawer({
  open,
  onOpenChange,
  dept,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dept: Department | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<DeptFormState>({
    name_en: "",
    name_ar: "",
    active: true,
    manager_id: "",
    branch_id: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name_en: dept?.nameEn ?? "",
        name_ar: dept?.nameAr ?? "",
        active: dept?.active ?? true,
        manager_id: dept?.managerId ?? "",
        branch_id: dept?.branchId ?? "",
      });
    }
  }, [open, dept]);

  const mut = useMutation({
    mutationFn: () => {
      const payload: DepartmentInput & {
        manager_id?: string;
        branch_id?: string;
      } = {
        name_en: form.name_en,
        name_ar: form.name_ar,
        active: form.active,
      };
      if (form.manager_id) payload.manager_id = form.manager_id;
      if (form.branch_id) payload.branch_id = form.branch_id;
      return dept
        ? updateDepartment(dept.id, payload)
        : createDepartment(payload);
    },
    onSuccess: () => {
      toast.success(
        dept
          ? t("departments.updated", "Department updated")
          : t("departments.created", "Department created")
      );
      qc.invalidateQueries({ queryKey: ["org", "departments"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        side="right"
      >
        {/* Header */}
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <SheetTitle className="text-base font-semibold">
              {dept
                ? t("departments.edit", "Edit Department")
                : t("departments.new", "Add Department")}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("departments.nameEn", "English Name")}</Label>
              <Input
                placeholder="Enter name in English"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("departments.nameAr", "Arabic Name (optional)")}</Label>
              <Input
                dir="rtl"
                placeholder="أدخل الاسم بالعربي"
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("departments.manager", "Manager")}</Label>
            <AsyncPaginatedSelect
              endpoint="/customer/employees"
              labelKey="name"
              valueKey="id"
              extraParams={{ active: 1 }}
              value={form.manager_id || null}
              onChange={(v) => setForm({ ...form, manager_id: v ?? "" })}
              placeholder={t("common.selectManager", "Select Manager")}
              isClearable
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("departments.branch", "Branch")}</Label>
            <AsyncPaginatedSelect
              endpoint="/customer/branches"
              labelKey="name"
              valueKey="id"
              extraParams={{ active: 1 }}
              value={form.branch_id || null}
              onChange={(v) => setForm({ ...form, branch_id: v ?? "" })}
              placeholder={t("common.selectBranch", "Select Branch")}
              isClearable
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>{t("common.active", "Active")}</Label>
            <Switch
              checked={!!form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!form.name_en || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {dept
              ? t("common.save", "Save Changes")
              : t("departments.submit", "Add Department")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
