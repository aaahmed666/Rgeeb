"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Globe, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert } from "lucide-react";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { DataTable , ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// All mutations go through the service layer — no raw api/endpoints in views
import {
  AdminCountry,
  fetchAdminCountries,
  createAdminCountry,
  updateAdminCountry,
  deleteAdminCountry,
} from "@/services/adminService";

// Postman:
//   GET    /admin/countries            — list
//   POST   /api/admin/countries        fields: name_ar, name_en, code
//   PUT    /admin/countries/:id        fields: name_en  (partial)
//   DELETE /api/admin/countries/:id
//
// AdminCountry interface: id, nameAr?, nameEn?, code?
// AdminCountryInput:      name_ar*, name_en*, code?

type FormState = { name_en: string; name_ar: string; code: string };
const EMPTY: FormState = { name_en: "", name_ar: "", code: "" };

export default function AdminCountriesView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } =
    useDebounceSearch("", 300);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminCountry | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: fetchAdminCountries,
  });

  const filtered = React.useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((c) =>
      [c.nameEn, c.nameAr, c.code].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [q.data, debouncedSearch]);

  const saveMut = useMutation({
    mutationFn: (data: FormState) =>
      editing
        ? updateAdminCountry(editing.id, {
            name_en: data.name_en,
            name_ar: data.name_ar,
            code: data.code || undefined,
          })
        : createAdminCountry({
            name_en: data.name_en,
            name_ar: data.name_ar,
            code: data.code || undefined,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast.success(t("validation.saveSuccess"));
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminCountry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast.success(t("validation.deleteSuccess"));
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(c: AdminCountry) {
    setEditing(c);
    // AdminCountry has nameEn / nameAr (not name)
    setForm({ name_en: c.nameEn ?? "", name_ar: c.nameAr ?? "", code: c.code ?? "" });
    setOpen(true);
  }

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

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
        titleKey="admin.countries"
        Icon={Globe}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
        right={
          can.create ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> {t("admin.countries_addCountry")}
          </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage={t("admin.common.loadingFailed")}
        emptyMessage={t("admin.countries_empty")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("common.searchPlaceholder")}
        columns={[
          {
            key: "nameEn",
            header: t("admin.countries_nameEn"),
            render: (c) => <span className="font-medium">{c.nameEn ?? "—"}</span>,
          },
          {
            key: "nameAr",
            header: t("admin.countries_nameAr", "Name (AR)"),
            render: (c) => <span dir="rtl">{c.nameAr ?? "—"}</span>,
          },
          {
            key: "code",
            header: t("admin.countries_code"),
            render: (c) => (
              <span className="font-mono text-xs uppercase">{c.code ?? "—"}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (c) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {can.update && (
                  <DropdownMenuItem onClick={() => openEdit(c)}>
                    <Pencil className="me-2 h-4 w-4" /> {t("common.edit")}
                  </DropdownMenuItem>
                  )}
                  {can.delete && (<DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="me-2 h-4 w-4" /> {t("common.delete")}
                  </DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.countries_editCountry", "Edit Country") : t("admin.countries_addCountry", "Add Country")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>{t("admin.countries_nameEn")}</Label>
              <Input
                value={form.name_en}
                onChange={set("name_en")}
                placeholder="United Arab Emirates"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("admin.countries_nameAr")}</Label>
              <Input
                dir="rtl"
                value={form.name_ar}
                onChange={set("name_ar")}
                placeholder="الإمارات العربية المتحدة"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("admin.countries_code")}</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="AE, SA, EG…"
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name_en.trim()}
            >
              {saveMut.isPending ? t("validation.saving", "Saving…") : t("admin.form_save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.countries_deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.countries_deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
