"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, MoreVertical, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DataTable  } from "@/components/ui/data-table";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ClientLifecyclePreviewDialog } from "@/components/admin/ClientLifecyclePreviewDialog";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
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
  fetchAdminClients,
  createAdminClient,
  updateAdminClient,
  deleteAdminClient,
  type AdminClient as AdminUser,
  type AdminClientInput as AdminUserInput,
} from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

const EMPTY: Partial<AdminUserInput> = {
  name_ar: "", name_en: "", email: "", phone: "",
  password: "", active: true,
};

export default function AdminClientsView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("clients");
  const qc = useQueryClient();
  const { searchValue, debouncedValue, handleSearchChange } = useDebounceSearch("", 300);

  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<AdminUser | null>(null);
  const [form,     setForm]     = useState<Partial<AdminUserInput>>(EMPTY);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  const [preview,  setPreview]  = useState<AdminUser | null>(null);

  const q = useQuery({ queryKey: ["admin", "clients"], queryFn: fetchAdminClients });

  const filtered = useMemo(() => {
    const s = debouncedValue.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((u) =>
      [u.name, u.nameAr, u.nameEn, u.email, u.phone, u.country, u.city]
        .filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [q.data, debouncedValue]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "clients"] });

  const createMut = useMutation({
    mutationFn: (v: AdminUserInput) => createAdminClient(v),
    onSuccess: () => { toast.success(t("admin.clients.clientAddedSuccess")); invalidate(); setOpen(false); },
    onError:   (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, v }: { id: string; v: Partial<AdminUserInput> }) => updateAdminClient(id, v),
    onSuccess: () => { toast.success(t("admin.clients.clientUpdatedSuccess")); invalidate(); setOpen(false); },
    onError:   (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminClient(id),
    onSuccess: () => { toast.success(t("admin.clients.clientDeletedSuccess")); invalidate(); setToDelete(null); },
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
    if (!form.name_en && !form.name_ar) { toast.error(t("admin.clients.nameRequired", "Name is required")); return; }
    if (!form.email) { toast.error(t("admin.clients.emailRequired", "Email is required")); return; }
    if (editing) {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // don't send blank password
      updateMut.mutate({ id: editing.id, v: payload });
    } else {
      if (!form.password) { toast.error(t("admin.clients.passwordRequired", "Password is required")); return; }
      if (!form.package_id) { toast.error(t("admin.clients.packageRequired", "Package is required")); return; }
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
          can.create ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> {t("admin.clients.addClient")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage={q.error instanceof Error ? q.error.message : t("admin.common.loadingFailed")}
        emptyMessage={t("admin.clients.noClientsFound")}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("common.searchPlaceholder")}
        columns={[
          {
            key: "user",
            header: t("admin.clients.clientName"),
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
            header: t("admin.clients.phone"),
            render: (u) => <span className="text-sm">{u.phone ?? "—"}</span>,
          },
          {
            key: "country",
            header: t("admin.clients.country"),
            render: (u) => <span className="text-sm">{u.country ?? "—"}</span>,
          },
          {
            key: "active",
            header: t("admin.clients.status"),
            render: (u) => (
              <div className="flex gap-1.5">
                {/* active is boolean on AdminUser */}
                <StatusPill status={u.active !== false ? "active" : "inactive"} />
                {u.mainAdmin && <Badge variant="secondary" className="text-xs">{t("common.admin")}</Badge>}
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
                  <DropdownMenuItem onClick={() => setPreview(u)}>
                    <Eye className="me-2 h-4 w-4" /> {t("common.preview", "Preview")}
                  </DropdownMenuItem>
                  {can.update && <DropdownMenuItem onClick={() => openEdit(u)}>
                    <Pencil className="me-2 h-4 w-4" /> {t("common.edit")}
                  </DropdownMenuItem>
                  }{can.delete && <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(u)}>
                    <Trash2 className="me-2 h-4 w-4" /> {t("common.delete")}
                  </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.clients.editClient") : t("admin.clients.addClient")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("admin.clients.clientName")} (EN) *</Label>
                <Input dir="ltr" value={form.name_en ?? ""} onChange={f("name_en")} placeholder={t("clients.placeholder_name", "John Doe")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("admin.clients.clientName")} (AR)</Label>
                <Input dir="rtl" value={form.name_ar ?? ""} onChange={f("name_ar")} placeholder={t("common.arabicNamePlaceholder", "الاسم")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.clients.email")} *</Label>
              <Input type="email" value={form.email ?? ""} onChange={f("email")} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.clients.phone")}</Label>
              <Input value={form.phone ?? ""} onChange={f("phone")} placeholder="+971 5xx xxx xxx" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.clients.package", "Package")} *</Label>
              <AsyncPaginatedSelect
                endpoint="/admin/packages"
                labelKey="name_en"
                valueKey="id"
                value={form.package_id ? String(form.package_id) : null}
                onChange={(v) =>
                  setForm((p) => ({ ...p, package_id: v ?? undefined }))
                }
                placeholder={t("admin.clients.selectPackage", "Select a package…")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? t("admin.users.password") + " (" + t("common.cancel").toLowerCase() + ")" : t("admin.users.password") + " *"}</Label>
              <Input type="password" value={form.password ?? ""} onChange={f("password")} placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>{t("common.active")}</Label>
              <Switch
                checked={!!form.active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>{t("admin.users.mainAdmin")}</Label>
              <Switch
                checked={!!form.main_admin}
                onCheckedChange={(v) => setForm((p) => ({ ...p, main_admin: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {editing ? t("common.save") : t("admin.form_add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("admin.clients.deleteClient")}
        description={`${t("admin.common.confirmDelete")} "${toDelete?.name}"?`}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        isLoading={deleteMut.isPending}
      />

      <ClientLifecyclePreviewDialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        clientId={preview?.id ?? null}
        clientName={preview ? (preview.nameEn || preview.name || preview.nameAr || "Customer") : undefined}
        onEdit={() => {
          const p = preview;
          setPreview(null);
          if (p) openEdit(p);
        }}
      />
    </div>
  );
}
