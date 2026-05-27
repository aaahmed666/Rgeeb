"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";

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
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { fetchAdminCities, createAdminCity, updateAdminCity, deleteAdminCity, fetchAdminCountries } from "@/services/adminService";

interface City {
  id: string;
  name: string;
  nameAr?: string;
  countryId?: string;
  countryName?: string;
}

function mapCity(r: any): City {
  return {
    id: String(r.id ?? ""),
    name: r.name ?? r.name_en ?? "",
    nameAr: r.name_ar,
    countryId: String(r.country_id ?? r.country?.id ?? ""),
    countryName: r.country?.name ?? r.country_name,
  };
}
function listFrom(res: unknown): any[] {
  if (Array.isArray(res)) return res;
  const d = (res as any)?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray((d as any)?.data)) return (d as any).data;
  return [];
}

export default function AdminCitiesView() {
  const qc = useQueryClient();
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useDebounceSearch("", 300);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<City | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    name_ar: "",
    country_id: "",
  });
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: async () =>
      fetchAdminCities(),
  });

  const filtered = React.useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    return s
      ? (q.data ?? []).filter((c) =>
          [c.name, c.nameAr, c.countryName].join(" ").toLowerCase().includes(s)
        )
      : (q.data ?? []);
  }, [q.data, debouncedSearch]);

  const saveMut = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editing) return api.put(endpoints.admin.cityUpdate(editing.id), data);
      return createAdminCity(data as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      toast.success(editing ? "City updated" : "City created");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(endpoints.admin.cityDelete(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cities"] });
      toast.success("City deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", name_ar: "", country_id: "" });
    setOpen(true);
  }
  function openEdit(c: City) {
    setEditing(c);
    setForm({
      name: c.name,
      name_ar: c.nameAr ?? "",
      country_id: c.countryId ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.cities"
        Icon={Building2}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
        right={
          <Button
            size="sm"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add City
          </Button>
        }
      />

      <DataTable
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage="Failed to load cities"
        emptyMessage="No cities found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search cities…"
        actions={
          <Button
            size="sm"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add City
          </Button>
        }
        columns={[
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
            <DialogTitle>{editing ? "Edit City" : "Add City"}</DialogTitle>
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
              <Label>Country ID</Label>
              <Input
                value={form.country_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country_id: e.target.value }))
                }
                placeholder="Country ID"
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
            <AlertDialogTitle>Delete City?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
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
