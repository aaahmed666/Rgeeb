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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchAdminCountries, createAdminCountry, updateAdminCountry, deleteAdminCountry } from "@/services/adminService";

interface Country {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  flag?: string;
  citiesCount?: number;
}

function mapCountry(r: any): Country {
  return {
    id: String(r.id ?? ""),
    name: r.name ?? r.name_en ?? "",
    nameAr: r.name_ar,
    code: r.code ?? r.iso_code ?? r.iso,
    flag: r.flag ?? r.flag_url,
    citiesCount:
      typeof r.cities_count === "number" ? r.cities_count : undefined,
  };
}
function listFrom(res: unknown): any[] {
  if (Array.isArray(res)) return res;
  const d = (res as any)?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray((d as any)?.data)) return (d as any).data;
  return [];
}

export default function AdminCountriesView() {
  const qc = useQueryClient();
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useDebounceSearch("", 300);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Country | null>(null);
  const [form, setForm] = React.useState({ name: "", name_ar: "", code: "" });
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: async () =>
      fetchAdminCountries(),
  });

  const filtered = React.useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    return s
      ? (q.data ?? []).filter((c) =>
          [c.name, c.nameAr, c.code].join(" ").toLowerCase().includes(s)
        )
      : (q.data ?? []);
  }, [q.data, debouncedSearch]);

  const saveMut = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editing)
        return api.put(endpoints.admin.countryUpdate(editing.id), data);
      return createAdminCountry(data as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast.success(editing ? "Country updated" : "Country created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(endpoints.admin.countryDelete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast.success("Country deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", name_ar: "", code: "" });
    setOpen(true);
  }
  function openEdit(c: Country) {
    setEditing(c);
    setForm({ name: c.name, name_ar: c.nameAr ?? "", code: c.code ?? "" });
    setOpen(true);
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.countries"
        Icon={Globe}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
        right={
          <Button
            size="sm"
            onClick={openCreate}
          >
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
        actions={
          <Button
            size="sm"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Country
          </Button>
        }
        columns={[
          {
            key: "flag",
            header: "Flag",
            headClassName: "w-16",
            render: (c) =>
              c.flag ? (
                <img
                  src={c.flag}
                  alt=""
                  className="h-5 w-7 rounded-sm object-cover"
                />
              ) : (
                <span>🌍</span>
              ),
          },
          {
            key: "name",
            header: "Name (EN)",
            render: (c) => <span className="font-medium">{c.name}</span>,
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
              <span className="font-mono text-xs uppercase">
                {c.code ?? "—"}
              </span>
            ),
          },
          {
            key: "cities",
            header: "Cities",
            render: (c) => <span>{c.citiesCount ?? "—"}</span>,
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
                  <DropdownMenuItem onClick={() => openEdit(c)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Country" : "Add Country"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name (EN) *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Name (AR)</Label>
              <Input
                dir="rtl"
                value={form.name_ar}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name_ar: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label>ISO Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="SA, US, EG..."
                maxLength={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate(form)}
              disabled={saveMut.isPending || !form.name.trim()}
            >
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Country?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also remove all associated cities.
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
