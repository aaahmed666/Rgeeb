"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable , ExportCSVButton, ExportPDFButton } from "@/components/ui/data-table";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
// right= prop (not action=)
import { AdminPageHeader, StatusPill } from "@/components/admin/AdminPageHeader";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Postman: POST /admin/users/create  fields: name_ar, name_en, email, password, phone, active, main_admin, client_id
// Postman: POST /admin/users/update  fields: name_ar, name_en, email, password, phone, active, id, main_admin, client_id
// AdminUser:      id, nameAr?, nameEn?, name, email?, phone?, active?, mainAdmin?, clientId?, country?, city?, avatar?
// AdminUserInput: name_ar*, name_en*, email*, password?, phone?, active?, main_admin?, client_id?
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  type AdminUser,
  type AdminUserInput,
} from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

const EMPTY: Partial<AdminUserInput> = {
  name_ar: "", name_en: "", email: "", phone: "",
  password: "", active: true, main_admin: false,
};

export default function AdminClientsView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { searchValue, debouncedValue, handleSearchChange } = useDebounceSearch("", 300);

  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<AdminUser | null>(null);
  const [form,     setForm]     = useState<Partial<AdminUserInput>>(EMPTY);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);

  const q = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAdminUsers });

  const filtered = useMemo(() => {
    const s = debouncedValue.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((u) =>
      [u.name, u.nameAr, u.nameEn, u.email, u.phone, u.country, u.city]
        .filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [q.data, debouncedValue]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const createMut = useMutation({
    mutationFn: (v: AdminUserInput) => createAdminUser(v),
    onSuccess: () => { toast.success("User created"); invalidate(); setOpen(false); },
    onError:   (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: Partial<AdminUserInput> }) => updateAdminUser(id, v),
    onSuccess: () => { toast.success("User updated"); invalidate(); setOpen(false); },
    onError:   (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => { toast.success("User deleted"); invalidate(); setToDelete(null); },
    onError:   (e: Error) => toast.error(e.message),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit   = (u: AdminUser) => {
    setEditing(u);
    setForm({
      name_ar:    u.nameAr     ?? "",
      name_en:    u.nameEn     ?? u.name ?? "",
      email:      u.email      ?? "",
      phone:      u.phone      ?? "",
      active:     u.active     ?? true,
      main_admin: u.mainAdmin  ?? false,
      // don't pre-fill password on edit
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name_en && !form.name_ar) { toast.error("Name is required"); return; }
    if (!form.email) { toast.error("Email is required"); return; }
    if (editing) {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // don't send blank password
      updateMut.mutate({ id: editing.id, v: payload });
    } else {
      if (!form.password) { toast.error("Password is required"); return; }
      createMut.mutate(form as AdminUserInput);
    }
  };

  const busy = createMut.isPending || updateMut.isPending;
  const f = (k: keyof AdminUserInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

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
      {/* AdminPageHeader only accepts `right` prop — not `action` */}
      <AdminPageHeader
        titleKey="admin.clients"
        Icon={Users}
        onRefresh={invalidate}
        isRefreshing={q.isFetching}
        right={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add User
          </Button>
        }
      />

      <DataTable
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage={q.error instanceof Error ? q.error.message : "Failed to load"}
        emptyMessage="No users found"
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search users…"
        columns={[
          {
            key: "user",
            header: "User",
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {u.avatar && <AvatarImage src={u.avatar} alt={u.name} />}
                  <AvatarFallback>{(u.name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{u.nameEn || u.name}</div>
                  {u.nameAr && <div className="text-xs text-muted-foreground" dir="rtl">{u.nameAr}</div>}
                  {u.email  && <div className="text-xs text-muted-foreground">{u.email}</div>}
                </div>
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            render: (u) => <span className="text-sm">{u.phone ?? "—"}</span>,
          },
          {
            key: "country",
            header: "Country",
            render: (u) => <span className="text-sm">{u.country ?? "—"}</span>,
          },
          {
            key: "active",
            header: "Status",
            render: (u) => (
              <div className="flex gap-1.5">
                {/* active is boolean on AdminUser */}
                <StatusPill status={u.active !== false ? "active" : "inactive"} />
                {u.mainAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (u) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(u)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(u)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name (EN) *</Label>
                <Input value={form.name_en ?? ""} onChange={f("name_en")} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label>Name (AR)</Label>
                <Input dir="rtl" value={form.name_ar ?? ""} onChange={f("name_ar")} placeholder="الاسم" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email ?? ""} onChange={f("email")} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={f("phone")} placeholder="+971 5xx xxx xxx" />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? "New Password (leave blank to keep)" : "Password *"}</Label>
              <Input type="password" value={form.password ?? ""} onChange={f("password")} placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Active</Label>
              <Switch
                checked={!!form.active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Main Admin</Label>
              <Switch
                checked={!!form.main_admin}
                onCheckedChange={(v) => setForm((p) => ({ ...p, main_admin: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete User"
        description={`Delete "${toDelete?.name}"? This cannot be undone.`}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
