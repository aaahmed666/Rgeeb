"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Globe, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { DataTable } from "@/components/ui/data-table";
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
      toast.success(editing ? "Country updated" : "Country created");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminCountry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast.success("Country deleted");
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

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.countries"
        Icon={Globe}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
        right={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Country
          </Button>
        }
      />

      <DataTable
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage="Failed to load countries"
        emptyMessage="No countries found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search countries…"
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
            key: "code",
            header: "Code",
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Country" : "Add Country"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name (EN) *</Label>
              <Input
                value={form.name_en}
                onChange={set("name_en")}
                placeholder="United Arab Emirates"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Name (AR)</Label>
              <Input
                dir="rtl"
                value={form.name_ar}
                onChange={set("name_ar")}
                placeholder="الإمارات العربية المتحدة"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>ISO Code</Label>
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name_en.trim()}
            >
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Country?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also remove all associated cities. This cannot be undone.
            </AlertDialogDescription>
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
