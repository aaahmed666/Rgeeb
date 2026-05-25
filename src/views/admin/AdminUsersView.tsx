"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatusPill } from "@/components/admin/AdminPageHeader";
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
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
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

// ─── User dialog (create / edit) ──────────────────────────────────────────────
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
  const qc = useQueryClient();
  const isEdit = !!user;

  const [form, setForm] = useState<AdminUserInput>({
    name: "",
    email: "",
    phone: "",
    password: "",
    status: "active",
  });

  // Pre-fill when editing
  useState(() => {
    if (open) {
      setForm({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        password: "",
        status: user?.status ?? "active",
      });
    }
  });

  // Reset on open
  const handleOpen = (v: boolean) => {
    if (v) {
      setForm({
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        password: "",
        status: user?.status ?? "active",
      });
    }
    onOpenChange(v);
  };

  const mut = useMutation({
    mutationFn: () =>
      isEdit ? updateAdminUser(user!.id, form) : createAdminUser(form),
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("users.updated", "User updated successfully")
          : t("users.created", "User created successfully")
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set =
    (field: keyof AdminUserInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpen}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isEdit
              ? t("users.editTitle", "Edit User")
              : t("users.createTitle", "Create New User")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">{t("users.name", "Full Name")} *</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={set("name")}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">{t("users.email", "Email")} *</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-phone">{t("users.phone", "Phone")}</Label>
              <Input
                id="u-phone"
                value={form.phone ?? ""}
                onChange={set("phone")}
                placeholder="+1 555 0100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password">
                {isEdit
                  ? t(
                      "users.passwordHint",
                      "New Password (leave blank to keep)"
                    )
                  : t("users.password", "Password") + " *"}
              </Label>
              <Input
                id="u-password"
                type="password"
                value={form.password ?? ""}
                onChange={set("password")}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("common.status", "Status")}</Label>
            <Select
              value={form.status ?? "active"}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  {t("common.active", "Active")}
                </SelectItem>
                <SelectItem value="inactive">
                  {t("common.inactive", "Inactive")}
                </SelectItem>
              </SelectContent>
            </Select>
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
            disabled={!form.name || !form.email || mut.isPending}
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
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
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
      [u.name, u.email, u.phone, u.country, u.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, search]);

  const total = users.length;
  const active = users.filter(
    (u) => (u.status ?? "active") === "active"
  ).length;
  const inactive = total - active;

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success(t("users.deleted", "User deleted"));
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setOpen(true);
  };

  const confirmDelete = (u: AdminUser) => {
    setDeleteTarget(u);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-primary p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {t("users.title", "Users")}
              </h1>
              <p className="text-sm text-white/80">
                {t("users.subtitle", "Manage platform users and their access")}
              </p>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="shrink-0 gap-2 bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur"
          >
            <Plus className="h-4 w-4" />
            {t("users.addUser", "Add User")}
          </Button>
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
          value={active}
          tone="emerald"
        />
        <StatCard
          icon={<UserX className="h-5 w-5" />}
          label={t("common.inactive", "Inactive")}
          value={inactive}
          tone="rose"
        />
      </div>

      {/* Table */}
      <DataTable
        title={t("users.allUsers", "All Users")}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error ? error.message : "Failed to load users"
        }
        emptyMessage={t("users.noResults", "No users found")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("users.searchPlaceholder", "Search users…")}
        actions={
          <Button
            size="sm"
            onClick={openCreate}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("users.addUser", "Add User")}
          </Button>
        }
        columns={[
          {
            key: "user",
            header: t("users.user", "User"),
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {u.avatar ? (
                    <AvatarImage
                      src={u.avatar}
                      alt={u.name}
                    />
                  ) : null}
                  <AvatarFallback className="text-xs font-bold">
                    {u.name?.slice(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium leading-tight">{u.name}</div>
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
            render: (u) => <StatusPill status={u.status} />,
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
                  <DropdownMenuItem
                    onClick={() => openEdit(u)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit", "Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => confirmDelete(u)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", "Delete")}
                  </DropdownMenuItem>
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
          "users.confirmDeleteDesc",
          `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
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
