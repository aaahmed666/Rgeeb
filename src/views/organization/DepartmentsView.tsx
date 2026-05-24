"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
  fetchBranches,
  fetchEmployees,
} from "@/services/organizationService";

export default function DepartmentsView() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const {
    data: departments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["org", "departments"],
    queryFn: fetchDepartments,
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return departments;
    return departments.filter((d) =>
      [d.nameEn, d.nameAr].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [departments, search]);

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
          <div className="rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 p-3 text-white shadow-lg">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("departments.title", "Departments")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("departments.subtitle", "Organize teams by department")}
            </p>
          </div>
        </div>
        <Button
          data-tour="add-department"
          className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:opacity-95"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t("departments.new", "Add New Department")}
        </Button>
      </header>

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : "Failed to load"}
        emptyMessage={t("departments.empty", "No departments yet")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t(
          "departments.searchPlaceholder",
          "Search departments…"
        )}
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />{" "}
            {t("departments.new", "Add New Department")}
          </Button>
        }
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
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(d);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="me-2 h-4 w-4" />{" "}
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteTarget(d)}
                  >
                    <Trash2 className="me-2 h-4 w-4" />{" "}
                    {t("common.delete", "Delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

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
          `Are you sure you want to delete "${deleteTarget?.nameEn ?? deleteTarget?.nameAr}"? This action cannot be undone.`
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

  const { data: branches = [] } = useQuery({
    queryKey: ["org", "branches"],
    queryFn: fetchBranches,
    enabled: open,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["org", "employees"],
    queryFn: fetchEmployees,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name_en: dept?.nameEn ?? "",
        name_ar: dept?.nameAr ?? "",
        active: dept?.active ?? true,
        manager_id: "",
        branch_id: "",
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white">
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
            <Select
              value={form.manager_id || undefined}
              onValueChange={(v) => setForm({ ...form, manager_id: v })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("common.selectManager", "Select Manager")}
                />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem
                    key={e.id}
                    value={e.id}
                  >
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("departments.branch", "Branch")}</Label>
            <Select
              value={form.branch_id || undefined}
              onValueChange={(v) => setForm({ ...form, branch_id: v })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("common.selectBranch", "Select Branch")}
                />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            className="flex-1 gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-95"
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
