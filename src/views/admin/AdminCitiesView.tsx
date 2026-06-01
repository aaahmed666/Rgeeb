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
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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
      toast.success(editing ? "City updated" : "City created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminCity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      toast.success("City deleted");
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

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.cities"
        Icon={Building2}
        onRefresh={() => citiesQ.refetch()}
        isRefreshing={citiesQ.isFetching}
        right={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add City
          </Button>
        }
      />

      <DataTable
        data={filtered}
        isLoading={citiesQ.isLoading}
        isError={citiesQ.isError}
        errorMessage="Failed to load cities"
        emptyMessage="No cities found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search cities…"
        columns={[
          {
            key: "nameEn",
            header: "Name (EN)",
            render: (c) => <span className="font-medium">{c.nameEn ?? "—"}</span>,
          },
          {
            key: "nameAr",
            header: "Name (AR)",
            render: (c) => <span dir="rtl">{c.nameAr ?? "—"}</span>,
          },
          {
            key: "country",
            header: "Country",
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
                  <DropdownMenuItem onClick={() => openEdit(c)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
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
            <DialogTitle>{editing ? "Edit City" : "Add City"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name (EN) *</Label>
              <Input value={form.name_en} onChange={set("name_en")} placeholder="Dubai" />
            </div>
            <div className="grid gap-1.5">
              <Label>Name (AR)</Label>
              <Input dir="rtl" value={form.name_ar} onChange={set("name_ar")} placeholder="دبي" />
            </div>
            <div className="grid gap-1.5">
              <Label>Country *</Label>
              {countriesQ.data?.length ? (
                <Select
                  value={form.country_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, country_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(countriesQ.data as AdminCountry[]).map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.nameEn ?? country.nameAr ?? country.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.country_id}
                  onChange={set("country_id")}
                  placeholder="Country ID"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={set("latitude")}
                  placeholder="25.2048"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Longitude</Label>
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name_en.trim() || !form.country_id}
            >
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
