"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Plus,
  Loader2,
  Search,
  Trash2,
  Pencil,
  Copy,
  KeyRound,
  Box,
  Settings as Cog,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import {
  Role,
  createRole,
  deleteRole,
  fetchAllPermissions,
  fetchRoles,
  updateRole,
  Permission,
} from "@/services/rolesService";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

// ─── Constants ────────────────────────────────────────────────────────────────
// Permissions that must be active when certain "parent" permissions are selected.
const REQUIRED_DEPS: Record<string, string[]> = {};

// ─── Types ────────────────────────────────────────────────────────────────────
interface GroupedPermission {
  resource: string;
  perms: Permission[];
  /** IDs of "parent" permissions in this group */
  parentIds: Set<string>;
  /** For each child perm id: the id of its parent */
  childOf: Map<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildGroups(allPerms: Permission[]): GroupedPermission[] {
  const map = new Map<string, Permission[]>();
  allPerms.forEach((p) => {
    const arr = map.get(p.resource) ?? [];
    arr.push(p);
    map.set(p.resource, arr);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resource, perms]) => {
      const parentIds = new Set<string>();
      const childOf = new Map<string, string>();

      // Actions that act as parents (enable/disable children)
      const PARENT_ACTIONS = new Set(["update", "create"]);
      // Actions that are children of "update"
      const CHILD_ACTIONS = new Set([
        "assign",
        "updateStatus",
        "addComment",
        "addAttachment",
        "updatestatus",
        "addcomment",
        "addattachment",
        "children",
        "taskLogs",
        "tasklogs",
      ]);

      const updatePerm = perms.find((p) => p.action === "update");
      if (updatePerm) {
        parentIds.add(updatePerm.id);
        perms.forEach((p) => {
          if (p.action && CHILD_ACTIONS.has(p.action)) {
            childOf.set(p.id, updatePerm.id);
          }
        });
      }

      return { resource, perms, parentIds, childOf };
    });
}

// Resource icons mapping — covers all permission groups in the API
const RESOURCE_ICONS: Record<string, string> = {
  branches: "🏢",
  employees: "👥",
  departments: "🏗️",
  cameras: "📷",
  attendances: "🕐",
  attendance: "🕐",
  departments_create: "🏗️",
  roles: "🔐",
  subscriptions: "💳",
  packages: "📦",
  services: "⚙️",
  detections: "👁️",
  reports: "📄",
  alerts: "🔔",
  settings: "🛠️",
  analytics: "📈",
  logs: "📋",
  users: "👤",
  notifications: "🔔",
  notification: "🔔",
  notification_settings: "🔔",
  schedules: "📅",
  zones: "📍",
  visitors: "🚶",
  projects: "🗂️",
  task_management: "📋",
  my_tasks: "✅",
  task_analytics: "📊",
  task_rules: "📏",
  task_reports: "📑",
  task_templates: "🗒️",
  escalation: "⚠️",
  smart_scheduler: "🤖",
  productivity: "🚀",
  realtime: "⚡",
  fatoorah: "💰",
  foodics: "🍔",
  drive_thru: "🚗",
  service_monitor: "🖥️",
  default: "🔑",
};

function resourceIcon(r: string) {
  const lower = r.toLowerCase().replace(/[^a-z_]/g, "_");
  return RESOURCE_ICONS[lower] ?? RESOURCE_ICONS.default;
}

// ─── Components ───────────────────────────────────────────────────────────────

export default function RolesView() {
  const { t } = useTranslation();
  const can = usePermission("roles");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
  } = useDebounceSearch("", 300);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles(),
  });
  const { data: allPerms = [] } = useQuery<Permission[]>({
    queryKey: ["roles", "permissions"],
    queryFn: () => fetchAllPermissions(),
  });

  const totalPermissions = allPerms.length;
  const totalResources = useMemo(
    () => new Set(allPerms.map((p) => p.resource)).size,
    [allPerms]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, debouncedSearch]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      toast.success(t("roles.deleted", "Role deleted"));
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-50 via-white to-orange-50 dark:from-indigo-950/30 dark:via-transparent dark:to-orange-950/20">
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
            <Shield className="h-6 w-6" />
          </div>
          <p className="flex-1 text-sm text-muted-foreground">
            {t(
              "roles.subtitle",
              "Manage access roles and assign granular permissions to control what each administrator can see and do"
            )}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          value={roles.length}
          label={t("roles.totalRoles", "Total Roles")}
          tone="indigo"
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          value={totalPermissions}
          label={t("roles.totalPermissions", "Total Permissions")}
          tone="rose"
        />
        <StatCard
          icon={<Box className="h-5 w-5" />}
          value={totalResources}
          label={t("roles.totalResources", "Resources")}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {roles.map((r) => (
              <RoleCard
                key={r.id}
                role={r}
                totalPermissions={totalPermissions}
                onEdit={() => {
                  setEditing(r);
                  setOpen(true);
                }}
              />
            ))}
            {can.create && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-6 w-6" />
              <p className="font-semibold">{t("roles.add", "Add New Role")}</p>
              <p className="text-xs">
                {t("roles.addHint", "Add role, if it doesn't exist.")}
              </p>
            </button>
            )}
          </>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {t("roles.allRoles", "All Roles")}
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("roles.searchPlaceholder", "Search roles...")}
                className="w-64 ps-9"
              />
            </div>
          </div>
          <DataTable
            data={filtered}
            isLoading={isLoading}
            emptyMessage={t("roles.noResults", "No roles found")}
            columns={[
              {
                key: "name", header: t("roles.name", "Role Name"),
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold uppercase text-indigo-600">{r.name.charAt(0)}</div>
                    <div>
                      <div className="font-medium">{r.name}</div>
                      {r.guard && <div className="text-xs text-muted-foreground">{r.guard}</div>}
                    </div>
                  </div>
                ),
              },
              {
                key: "permissionsCount", header: t("roles.permissions", "Permissions"),
                render: (r) => <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">{r.permissionsCount} {t("roles.permissionsShort", "permissions")}</Badge>,
              },
              {
                key: "createdAt", header: t("roles.createdAt", "Created At"),
                render: (r) => <span className="text-sm text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</span>,
              },
              {
                key: "actions", header: t("common.actions", "Actions"), headClassName: "text-right", cellClassName: "text-right",
                render: (r) => (
                  <div className="flex items-center justify-end gap-1">
                    {can.update && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>}
                    {can.delete && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <RoleDialog
        open={open}
        onOpenChange={setOpen}
        role={editing}
        totalPermissions={totalPermissions}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("roles.confirmDeleteTitle", "Delete Role")}
        description={t(
          "roles.confirmDeleteDesc",
          "Are you sure you want to delete this role? This action cannot be undone."
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

// ─── RoleCard ─────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  totalPermissions,
  onEdit,
}: {
  role: Role;
  totalPermissions: number;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const pct = totalPermissions
    ? Math.round((role.permissionsCount / totalPermissions) * 100)
    : 0;
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-rose-500" />
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
          >
            {role.permissionsCount} {t("roles.permissionsShort", "permissions")}
          </Badge>
          {role.required && (
            <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/15">
              {t("roles.required", "Required")}
            </Badge>
          )}
          <div className="ms-auto flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 font-bold uppercase text-indigo-600">
            {role.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{role.name}</div>
            {role.guard && (
              <div className="text-xs text-muted-foreground">{role.guard}</div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t("roles.coverage", "Permission Coverage")}
            </span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <Progress
            value={pct}
            className="h-1.5"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {role.resources.slice(0, 6).map((res) => (
            <div
              key={res}
              className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-semibold uppercase text-muted-foreground"
            >
              {res.charAt(0)}
            </div>
          ))}
          {role.resources.length > 6 && (
            <div className="flex h-6 items-center justify-center rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
              +{role.resources.length - 6}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>
            {role.resourcesCount} {t("roles.resources", "resources")}
          </span>
          <button
            onClick={onEdit}
            className="font-medium text-indigo-600 hover:underline"
          >
            {t("roles.manage", "Manage")} →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "indigo" | "rose" | "emerald";
}) {
  const tones = {
    indigo:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            tones[tone]
          )}
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

// ─── RoleDialog ───────────────────────────────────────────────────────────────
function RoleDialog({
  open,
  onOpenChange,
  role,
  totalPermissions,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: Role | null;
  totalPermissions: number;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!role;
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [missingDeps, setMissingDeps] = useState<
    { name: string; resource: string }[]
  >([]);
  const [showMissingDepsDialog, setShowMissingDepsDialog] = useState(false);

  const { data: allPerms = [], isLoading: permsLoading } = useQuery<Permission[]>({
    queryKey: ["roles", "permissions"],
    queryFn: () => fetchAllPermissions(),
    staleTime: 5 * 60 * 1000,
  });
  // Keep a ref to allPerms so useEffect can read latest value without it in deps
  const allPermsRef = useRef(allPerms);
  useEffect(() => {
    allPermsRef.current = allPerms;
  }, [allPerms]);

  useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      if (role) {
        // The roles API returns permissions with name only (no id).
        // Use ref to read latest allPerms without adding the array to deps
        // (adding an array to deps causes "deps changed size" errors).
        const nameToId = new Map(
          allPermsRef.current.map((p) => [p.name, p.id])
        );
        const byName = (role.permissionNames ?? role.permissions ?? [])
          .map((n) => nameToId.get(n))
          .filter((id): id is string => !!id);
        const byId = (role.permissionIds ?? []).filter(Boolean);
        const resolved = byName.length > 0 ? byName : byId;
        setSelected(new Set(resolved));
      } else {
        setSelected(new Set());
      }
      setPermSearch("");
      setMissingDeps([]);
    }
  }, [open, role]); // stable deps — allPerms read via ref

  const groups = useMemo(() => buildGroups(allPerms), [allPerms]);

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        perms: g.perms.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            g.resource.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.perms.length > 0);
  }, [groups, permSearch]);

  // Count helpers
  const selectedInGroup = (g: GroupedPermission) =>
    g.perms.filter((p) => selected.has(p.id)).length;
  const allInGroupSelected = (g: GroupedPermission) =>
    g.perms.length > 0 && g.perms.every((p) => selected.has(p.id));
  const someInGroupSelected = (g: GroupedPermission) =>
    g.perms.some((p) => selected.has(p.id)) && !allInGroupSelected(g);

  // Toggle all in group
  const toggleGroup = (g: GroupedPermission, value: boolean) => {
    const next = new Set(selected);
    g.perms.forEach((p) => {
      // Don't toggle child perms independently — they follow their parent
      if (!g.childOf.has(p.id)) {
        if (value) next.add(p.id);
        else next.delete(p.id);
      }
    });
    setSelected(next);
  };

  // Toggle single permission
  const togglePerm = (p: Permission, g: GroupedPermission, value: boolean) => {
    const next = new Set(selected);
    if (value) {
      next.add(p.id);
      // If this is a parent, also enable children? No — children need separate toggle. Just enable parent.
    } else {
      next.delete(p.id);
      // If this is a parent, disable its children too
      if (g.parentIds.has(p.id)) {
        g.childOf.forEach((parentId, childId) => {
          if (parentId === p.id) next.delete(childId);
        });
      }
    }
    setSelected(next);
  };

  // Toggle child — requires parent to be active
  const toggleChild = (p: Permission, g: GroupedPermission, value: boolean) => {
    const parentId = g.childOf.get(p.id);
    const next = new Set(selected);
    if (value) {
      next.add(p.id);
      // Enable parent automatically
      if (parentId) next.add(parentId);
    } else {
      next.delete(p.id);
    }
    setSelected(next);
  };

  // Select all / deselect all
  const selectAll = () => setSelected(new Set(allPerms.map((p) => p.id)));
  const deselectAll = () => setSelected(new Set());
  const allSelected =
    allPerms.length > 0 && allPerms.every((p) => selected.has(p.id));

  // Check if a child perm is disabled (parent not selected)
  const isChildDisabled = (p: Permission, g: GroupedPermission) => {
    const parentId = g.childOf.get(p.id);
    return !!parentId && !selected.has(parentId);
  };

  // Validate dependencies before save
  const findMissingDeps = () => {
    const missing: { name: string; resource: string }[] = [];
    // If any "update"-type permission is selected, check for branch.read + employee.read
    const hasUpdatePerm = allPerms.some(
      (p) => selected.has(p.id) && p.action === "update"
    );
    if (hasUpdatePerm) {
      const branchRead = allPerms.find(
        (p) =>
          p.resource.toLowerCase().includes("branch") && p.action === "read"
      );
      const employeeRead = allPerms.find(
        (p) =>
          p.resource.toLowerCase().includes("employee") && p.action === "read"
      );
      if (branchRead && !selected.has(branchRead.id)) {
        missing.push({ name: "Branches.Read", resource: "branches" });
      }
      if (employeeRead && !selected.has(employeeRead.id)) {
        missing.push({ name: "Employees.Read", resource: "employees" });
      }
    }
    return missing;
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a role name");
      return;
    }
    const missing = findMissingDeps();
    if (missing.length > 0) {
      setMissingDeps(missing);
      setShowMissingDepsDialog(true);
      return;
    }
    doSave();
  };

  const mut = useMutation({
    mutationFn: () => {
      const permission_ids = Array.from(selected);
      return isEdit
        ? updateRole(role.id, { name, permission_ids })
        : createRole({ name, permission_ids });
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? t("roles.updated", "Role updated")
          : t("roles.created", "Role created")
      );
      qc.invalidateQueries({ queryKey: ["roles"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doSave = () => mut.mutate();

  const pct = totalPermissions
    ? Math.round((selected.size / totalPermissions) * 100)
    : 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              {isEdit
                ? t("roles.edit", "Edit Role")
                : t("roles.new", "Create New Role")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-0 max-h-[80vh] overflow-hidden">
            {/* Role name */}
            <div className="px-6 py-4 space-y-1.5 border-b">
              <Label>{t("roles.name", "Role Name")}</Label>
              <Input
                placeholder={t("roles.namePlaceholder", "Enter Role Name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Permissions section */}
            <div className="flex flex-col flex-1 overflow-hidden px-6 py-4 gap-3">
              {/* Header row: Permissions count + Select All */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {t("roles.permissions", "Permissions")}
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    {selected.size} / {totalPermissions}
                  </Badge>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => (allSelected ? deselectAll() : selectAll())}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    (allSelected ? deselectAll() : selectAll())
                  }
                  className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition cursor-pointer select-none"
                >
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => (v ? selectAll() : deselectAll())}
                    className="h-3.5 w-3.5 pointer-events-none"
                  />
                  {t("roles.selectAll", "Select All")}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder={t(
                    "roles.searchPermissions",
                    "Search resources..."
                  )}
                  className="ps-9"
                />
              </div>

              {/* Hierarchy hint */}
              <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-200 p-3 dark:bg-sky-950/20 dark:border-sky-800">
                <Info className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                <p className="text-xs text-sky-700 dark:text-sky-300">
                  <span className="font-semibold">
                    {t("roles.permHierarchy", "Permission Hierarchy")}{" "}
                  </span>
                  {t(
                    "roles.permHierarchyDesc",
                    "Parent permissions enable child permissions. Update permissions require branch.read and employee.read to be active."
                  )}
                </p>
              </div>

              {/* Groups list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {permsLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("roles.loadingPermissions", "Loading permissions...")}
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t(
                      "roles.noPermissionsAvailable",
                      "No permissions available"
                    )}
                  </p>
                ) : (
                  filteredGroups.map((g) => (
                    <PermissionGroup
                      key={g.resource}
                      group={g}
                      selected={selected}
                      onToggleGroup={toggleGroup}
                      onTogglePerm={togglePerm}
                      onToggleChild={toggleChild}
                      isChildDisabled={isChildDisabled}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4 flex flex-row items-center justify-between gap-3">
            {/* Bottom status bar */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              {selected.size > 0
                ? `${selected.size} ${t("roles.permissionsSelected", "permissions selected across")} ${new Set(allPerms.filter((p) => selected.has(p.id)).map((p) => p.resource)).size} ${t("roles.resources", "resources")}`
                : t("roles.noPermissionsSelected", "No permissions selected")}
              <span className="ml-1 font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                disabled={!name.trim() || mut.isPending}
                onClick={handleSave}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-95"
              >
                {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4" />
                {isEdit
                  ? t("roles.updateRole", "Update Role")
                  : t("roles.createRole", "Create Role")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missing dependencies dialog */}
      <Dialog
        open={showMissingDepsDialog}
        onOpenChange={setShowMissingDepsDialog}
      >
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/30">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold">
                {t("roles.missingDepsTitle", "Required Permissions Missing")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  "roles.missingDepsDesc",
                  "The following permissions must be enabled to save this role:"
                )}
              </p>
            </div>
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 dark:border-amber-800 dark:bg-amber-950/20">
              {missingDeps.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-500 text-[10px] font-bold">
                    ✕
                  </span>
                  <span className="font-medium">{d.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t(
                "roles.missingDepsHint",
                "Please enable the above permissions in the permissions list to proceed with saving this role."
              )}
            </p>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
              onClick={() => setShowMissingDepsDialog(false)}
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("roles.gotIt", "Got It")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── PermissionGroup ──────────────────────────────────────────────────────────
function PermissionGroup({
  group,
  selected,
  onToggleGroup,
  onTogglePerm,
  onToggleChild,
  isChildDisabled,
}: {
  group: GroupedPermission;
  selected: Set<string>;
  onToggleGroup: (g: GroupedPermission, v: boolean) => void;
  onTogglePerm: (p: Permission, g: GroupedPermission, v: boolean) => void;
  onToggleChild: (p: Permission, g: GroupedPermission, v: boolean) => void;
  isChildDisabled: (p: Permission, g: GroupedPermission) => boolean;
}) {
  const selCount = group.perms.filter((p) => selected.has(p.id)).length;
  const allSel =
    group.perms.length > 0 && group.perms.every((p) => selected.has(p.id));
  const someSel = selCount > 0 && !allSel;

  // Separate top-level perms from children
  const topLevel = group.perms.filter((p) => !group.childOf.has(p.id));
  const children = group.perms.filter((p) => group.childOf.has(p.id));

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Checkbox
          checked={allSel}
          data-state={
            someSel ? "indeterminate" : allSel ? "checked" : "unchecked"
          }
          onCheckedChange={(v) => onToggleGroup(group, !!v)}
          className="h-4 w-4"
        />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm">
            {resourceIcon(group.resource)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold capitalize">
              {group.resource.replace(/_/g, " ")}
            </div>
            <div className="text-xs text-muted-foreground">
              {selCount}/{group.perms.length}{" "}
              {selCount === 1 ? "selected" : "selected"}
            </div>
          </div>
        </div>
      </div>

      {/* Permission rows */}
      <div className="divide-y">
        {topLevel.map((p) => {
          const isParent = group.parentIds.has(p.id);
          const myChildren = isParent
            ? children.filter((c) => group.childOf.get(c.id) === p.id)
            : [];
          const isSelected = selected.has(p.id);

          return (
            <div key={p.id}>
              {/* Top-level row */}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition",
                  isSelected && "bg-indigo-50/50 dark:bg-indigo-950/10"
                )}
              >
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isSelected ? "bg-indigo-500" : "bg-muted-foreground/30"
                  )}
                />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm">{p.name}</span>
                  {isParent && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-300"
                    >
                      Parent
                    </Badge>
                  )}
                </div>
                <Switch
                  checked={isSelected}
                  onCheckedChange={(v) => onTogglePerm(p, group, v)}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {/* Child rows (indented) */}
              {myChildren.length > 0 && (
                <div className="bg-muted/20 border-t">
                  {myChildren.map((child) => {
                    const disabled = isChildDisabled(child, group);
                    const childSelected = selected.has(child.id);
                    return (
                      <div
                        key={child.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 pl-10 transition",
                          childSelected &&
                            !disabled &&
                            "bg-indigo-50/40 dark:bg-indigo-950/10",
                          disabled && "opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            childSelected && !disabled
                              ? "bg-indigo-400"
                              : "bg-muted-foreground/20"
                          )}
                        />
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {child.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-300"
                          >
                            Child
                          </Badge>
                        </div>
                        <Switch
                          checked={childSelected}
                          disabled={disabled}
                          onCheckedChange={(v) =>
                            onToggleChild(child, group, v)
                          }
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
