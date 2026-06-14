"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import {
  type AdminRole,
  type AdminPermission,
  fetchAdminRoles,
  fetchAdminPermissions,
  fetchAdminRoleSingle,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
} from "@/services/adminService";

function RoleDialog({
  open,
  onOpenChange,
  role,
  permissions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: AdminRole | null;
  permissions: AdminPermission[];
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!role;

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // When editing, fetch the role's current permission_ids (the list endpoint
  // may not include them).
  const singleQ = useQuery({
    queryKey: ["admin", "roles", "single", role?.id],
    queryFn: () => fetchAdminRoleSingle(role!.id),
    enabled: open && isEdit,
  });

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    const ids = singleQ.data?.permissionIds ?? role?.permissionIds ?? [];
    setSelected(new Set(ids));
  }, [open, role, singleQ.data]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const mut = useMutation({
    mutationFn: () => {
      const input = { name, permission_ids: Array.from(selected) };
      return isEdit ? updateAdminRole(role!.id, input) : createAdminRole(input);
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("adminRoles.updated", "Role updated")
          : t("adminRoles.created", "Role created")
      );
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Group permissions by their group for a tidy checklist.
  const grouped = useMemo(() => {
    const map = new Map<string, AdminPermission[]>();
    for (const p of permissions) {
      const g = p.group ?? t("adminRoles.general", "General");
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return Array.from(map.entries());
  }, [permissions, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isEdit
              ? t("adminRoles.edit", "Edit Role")
              : t("adminRoles.create", "Create Role")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("adminRoles.name", "Role Name")} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("adminRoles.namePlaceholder", "e.g. Branch Manager")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("adminRoles.permissions", "Permissions")}</Label>
              <span className="text-xs text-muted-foreground">
                {selected.size} {t("adminRoles.selected", "selected")}
              </span>
            </div>
            <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border p-3">
              {singleQ.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : permissions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("adminRoles.noPermissions", "No permissions available")}
                </p>
              ) : (
                grouped.map(([group, perms]) => (
                  <div key={group} className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {group}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selected.has(p.id)}
                            onCheckedChange={() => toggle(p.id)}
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            disabled={!name.trim() || mut.isPending}
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

export default function AdminRolesView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const can = usePermission("admin");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);

  const {
    data: roles = [],
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ["admin", "roles"], queryFn: fetchAdminRoles });

  const { data: permissions = [] } = useQuery({
    queryKey: ["admin", "roles", "permissions"],
    queryFn: fetchAdminPermissions,
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, debouncedSearch]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteAdminRole(id),
    onSuccess: () => {
      toast.success(t("adminRoles.deleted", "Role deleted"));
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="adminRoles.title"
        Icon={ShieldCheck}
        onRefresh={() => qc.invalidateQueries({ queryKey: ["admin", "roles"] })}
        isRefreshing={isLoading}
        right={
          can.create ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t("adminRoles.add", "Add Role")}
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        emptyMessage={t("adminRoles.empty", "No roles found")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t("adminRoles.search", "Search roles…")}
        columns={[
          {
            key: "name",
            header: t("adminRoles.name", "Role Name"),
            render: (r) => <span className="font-medium">{r.name || "—"}</span>,
          },
          {
            key: "permissions",
            header: t("adminRoles.permissions", "Permissions"),
            render: (r) => (
              <Badge variant="secondary">
                {r.permissionsCount}{" "}
                {t("adminRoles.permissionsCount", "permissions")}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            headClassName: "w-12",
            render: (r) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {can.update && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(r);
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
                      onClick={() => setDeleteTarget(r)}
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

      <RoleDialog
        open={open}
        onOpenChange={setOpen}
        role={editing}
        permissions={permissions}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("adminRoles.deleteTitle", "Delete role")}
        description={`${t("admin.common.confirmDelete", "Are you sure you want to delete")} "${deleteTarget?.name}"?`}
        confirmLabel={t("common.delete", "Delete")}
        cancelLabel={t("common.cancel", "Cancel")}
        isLoading={delMut.isPending}
        onConfirm={() => {
          if (deleteTarget) delMut.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
