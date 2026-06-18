"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { ShieldAlert } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
  UserCheck,
  UserX,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { DataTable } from "@/components/ui/data-table";
import { StatusPill } from "@/components/admin/AdminPageHeader";
// Postman: POST /admin/users/create  fields: name_ar, name_en, email, password, phone, active, main_admin, client_id
// Postman: POST /admin/users/update  fields: name_ar, name_en, email, password, phone, active, id, main_admin, client_id
// AdminUser:      id, nameAr?, nameEn?, name, email?, phone?, active?(bool), mainAdmin?(bool), ...
// AdminUserInput: name_ar*, name_en*, email*, password?, phone?, active?, main_admin?, client_id?
import {
  AdminUser,
  AdminUserInput,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "slate" | "emerald" | "rose";
}) {
  const tones = {
    slate:
      "bg-slate-100  text-slate-700  dark:bg-slate-800  dark:text-slate-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    rose: "bg-rose-100   text-rose-700   dark:bg-rose-950/40   dark:text-rose-400",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── User dialog ──────────────────────────────────────────────────────────────
function UserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: AdminUser | null;
}) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const isEdit = !!user;

  // Form state mirrors AdminUserInput exactly
  const [nameAr, setNameAr] = useState(user?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(user?.nameEn ?? user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(user?.active !== false);
  const [mainAdmin, setMainAdmin] = useState(user?.mainAdmin ?? false);
  const [clientId, setClientId] = useState<string>(user?.clientId ?? "");

  // useEffect (not useState callback — that never runs) to reset when dialog opens
  useEffect(() => {
    if (open) {
      setNameAr(user?.nameAr ?? "");
      setNameEn(user?.nameEn ?? user?.name ?? "");
      setEmail(user?.email ?? "");
      setPhone(user?.phone ?? "");
      setPassword("");
      setActive(user?.active !== false);
      setMainAdmin(user?.mainAdmin ?? false);
      setClientId(user?.clientId ?? "");
    }
  }, [open, user]);

  const buildInput = (): AdminUserInput => {
    const inp: AdminUserInput = {
      name_ar: nameAr,
      name_en: nameEn,
      email,
      phone: phone || undefined,
      active,
      main_admin: mainAdmin,
      client_id: clientId || undefined,
    };
    if (password) inp.password = password;
    return inp;
  };

  const mut = useMutation({
    mutationFn: () =>
      isEdit
        ? updateAdminUser(user!.id, buildInput())
        : createAdminUser(buildInput()),
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("users.updated", "User updated")
          : t("users.created", "User created")
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isEdit
              ? t("users.editTitle", "Edit User")
              : t("users.createTitle", "Create User")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("admin.users.nameEn", "Name (EN)")} *</Label>
              <Input
                dir="ltr"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.users.nameAr", "Name (AR)")}</Label>
              <Input
                dir="rtl"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={t("common.arabicNamePlaceholder", "الاسم")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.users.email", "Email")} *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.users.phone", "Phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 5xx xxx xxx"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.users.client", "Client")} *</Label>
            <AsyncPaginatedSelect
              endpoint="/admin/clients"
              labelKey="name_en"
              valueKey="id"
              value={clientId || null}
              onChange={(v) => setClientId(v ?? "")}
              defaultOption={
                user?.clientId
                  ? {
                      value: user.clientId,
                      label: user.clientName ?? user.clientId,
                    }
                  : undefined
              }
              placeholder={t("admin.users.selectClient", "Select a client…")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              {isEdit
                ? t(
                    "admin.users.newPassword",
                    "New Password (leave blank to keep)"
                  )
                : `${t("admin.users.password", "Password")} *`}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>{t("common.active", "Active")}</Label>
            <Switch
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>{t("admin.users.mainAdmin", "Main Admin")}</Label>
            <Switch
              checked={mainAdmin}
              onCheckedChange={setMainAdmin}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={
              !nameEn ||
              !email ||
              !clientId ||
              (!isEdit && !password) ||
              mut.isPending
            }
            onClick={() => mut.mutate()}
            className="gap-2"
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function AdminUsersView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.nameEn, u.nameAr, u.email, u.phone, u.country, u.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, debouncedSearch]); // debouncedSearch, NOT search

  const total = users.length;
  // active is boolean on AdminUser — not a status string
  const activeCount = users.filter((u) => u.active !== false).length;
  const inactiveCount = total - activeCount;

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success(t("users.deleted", "User deleted"));
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">
            {t("errors.unauthorized", "Access Denied")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.noAccess")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: "linear-gradient(to right, #1e293b, #334155, var(--color-primary, #f97316))" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                {t("users.title", "Users")}
              </h1>
              <p className="text-sm text-white/80">
                {t("users.subtitle", "Manage platform users and their access")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                qc.invalidateQueries({ queryKey: ["admin", "users"] })
              }
              disabled={isLoading}
              className="shrink-0 border-0 bg-white/20 text-white backdrop-blur hover:bg-white/30"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            {can.create && (
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="shrink-0 gap-2 border-0 bg-white/20 text-white backdrop-blur hover:bg-white/30"
              >
                <Plus className="h-4 w-4" /> {t("users.addUser", "Add User")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("users.total", "Total Users")}
          value={total}
          tone="slate"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label={t("common.active", "Active")}
          value={activeCount}
          tone="emerald"
        />
        <StatCard
          icon={<UserX className="h-5 w-5" />}
          label={t("common.inactive", "Inactive")}
          value={inactiveCount}
          tone="rose"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error
            ? error.message
            : t("errors.loadFailed", "Failed to load")
        }
        emptyMessage={t("users.noResults", "No users found")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("users.searchPlaceholder", "Search users…")}
        columns={[
          {
            key: "user",
            header: t("users.user", "User"),
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {u.avatar && (
                    <AvatarImage
                      src={u.avatar}
                      alt={u.name}
                    />
                  )}
                  <AvatarFallback className="text-xs font-bold">
                    {u.name?.slice(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium leading-tight">
                    {u.nameEn || u.name}
                  </div>
                  {u.nameAr && (
                    <div
                      className="text-xs text-muted-foreground"
                      dir="rtl"
                    >
                      {u.nameAr}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {u.email ?? "—"}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "phone",
            header: t("users.phone", "Phone"),
            render: (u) => <span className="text-sm">{u.phone ?? "—"}</span>,
          },
          {
            key: "location",
            header: t("users.location", "Location"),
            render: (u) => (
              <span className="text-sm text-muted-foreground">
                {[u.city, u.country].filter(Boolean).join(", ") || "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: t("common.status", "Status"),
            render: (u) => (
              <div className="flex gap-1.5">
                {/* active is boolean — derive status string */}
                <StatusPill
                  status={u.active !== false ? "active" : "inactive"}
                />
                {u.mainAdmin && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    Admin
                  </Badge>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (u) => (
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
                        setEditing(u);
                        setOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {t("common.edit", "Edit")}
                    </DropdownMenuItem>
                  )}
                  {can.delete && (
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(u)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete", "Delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <UserDialog
        open={open}
        onOpenChange={setOpen}
        user={editing}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("users.confirmDeleteTitle", "Delete User")}
        description={t(
          "admin.common.confirmDeleteDesc",
          'Are you sure you want to delete "{{name}}"? This cannot be undone.',
          { name: deleteTarget?.name }
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
