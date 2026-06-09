"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DataTable , ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useTranslation } from "react-i18next";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert, Download } from "lucide-react";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
// All mutations go through the service layer — no raw api/endpoints in views
import {
  AdminCity,
  AdminCountry,
  fetchAdminCities,
  fetchAdminCountries,
  createAdminCity,
  updateAdminCity,
  deleteAdminCity,
} from "@/services/adminService";

// Postman:
//   GET  /admin/cities              — list
//   GET  /admin/cities?country_id=1 — filtered by country
//   POST /api/admin/cities          fields: country_id, name_ar, name_en, latitude, longitude
//   PUT  /api/admin/cities/:id      fields: name_en (partial update)
//   DELETE /api/admin/cities/:id
//
// AdminCity interface: id, nameAr?, nameEn?, countryId?, countryName?, latitude?, longitude?
// AdminCityInput:      country_id*, name_ar*, name_en*, latitude?, longitude?

type FormState = {
  name_en: string;
  name_ar: string;
  country_id: string;
  latitude: string;
  longitude: string;
};

const EMPTY_FORM: FormState = {
  name_en: "", name_ar: "", country_id: "", latitude: "", longitude: "",
};

export default function AdminCitiesView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } =
    useDebounceSearch("", 300);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminCity | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const citiesQ = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: () => fetchAdminCities(),
  });

  // Countries for the dropdown — same endpoint used elsewhere
  const countriesQ = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: fetchAdminCountries,
  });

  const filtered = React.useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return citiesQ.data ?? [];
    return (citiesQ.data ?? []).filter((c) =>
      [c.nameEn, c.nameAr, c.countryName].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [citiesQ.data, debouncedSearch]);

  const saveMut = useMutation({
    mutationFn: (data: FormState) => {
      const input = {
        name_en: data.name_en,
        name_ar: data.name_ar,
        country_id: data.country_id,
        latitude:  data.latitude  ? Number(data.latitude)  : undefined,
        longitude: data.longitude ? Number(data.longitude) : undefined,
      };
      return editing
        ? updateAdminCity(editing.id, input)
        : createAdminCity({ ...input, country_id: input.country_id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      toast.success(t("validation.saveSuccess"));
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminCity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      toast.success(t("validation.deleteSuccess"));
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(c: AdminCity) {
    setEditing(c);
    setForm({
      name_en:    c.nameEn    ?? "",
      name_ar:    c.nameAr    ?? "",
      country_id: c.countryId ?? "",
      latitude:   c.latitude  != null ? String(c.latitude)  : "",
      longitude:  c.longitude != null ? String(c.longitude) : "",
    });
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
        titleKey="admin.cities"
        Icon={Building2}
        onRefresh={() => citiesQ.refetch()}
        isRefreshing={citiesQ.isFetching}
        right={
          can.create ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> {t("admin.cities_addCity")}
          </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={citiesQ.isLoading}
        isError={citiesQ.isError}
        errorMessage={t("admin.common.loadingFailed")}
        emptyMessage={t("admin.cities_empty")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("common.searchPlaceholder")}
        columns={[
          {
            key: "nameEn",
            header: t("admin.cities_nameEn"),
            render: (c) => <span className="font-medium">{c.nameEn ?? "—"}</span>,
          },
          {
            key: "nameAr",
            header: t("admin.cities_nameAr", "Name (AR)"),
            render: (c) => <span dir="rtl">{c.nameAr ?? "—"}</span>,
          },
          {
            key: "country",
            header: t("admin.cities_country"),
            render: (c) => <span>{c.countryName ?? "—"}</span>,
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
                  {can.delete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="me-2 h-4 w-4" /> {t("common.delete")}
                  </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.cities_editCity", "Edit City") : t("admin.cities_addCity", "Add City")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>{t("admin.cities_nameEn")}</Label>
              <Input value={form.name_en} onChange={set("name_en")} placeholder="Dubai" />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("admin.cities_nameAr")}</Label>
              <Input dir="rtl" value={form.name_ar} onChange={set("name_ar")} placeholder="دبي" />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("admin.cities_country")}</Label>
              <AsyncPaginatedSelect
                  endpoint="/admin/countries"
                  labelKey="name_en"
                  valueKey="id"
                  value={form.country_id || null}
                  onChange={(v) => setForm((f) => ({ ...f, country_id: v ?? "" }))}
                  placeholder={t("admin.cities_selectCountry", "Select country…")}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>{t("admin.cities_latitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={set("latitude")}
                  placeholder="25.2048"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("admin.cities_longitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={set("longitude")}
                  placeholder="55.2708"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name_en.trim() || !form.country_id}
            >
              {saveMut.isPending ? t("validation.saving", "Saving…") : t("admin.form_save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.cities_deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.cities_deleteDesc")}</AlertDialogDescription>
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
