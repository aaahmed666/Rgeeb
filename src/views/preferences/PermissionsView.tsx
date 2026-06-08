"use client";

/**
 * PermissionsView — manage individual permissions and their role assignments.
 *
 * Endpoints used (Postman collection):
 *   GET  /customer/roles/permissions   — list all permissions
 *   GET  /customer/roles              — list all roles (to show role ↔ permission matrix)
 *   GET  /customer/roles/:id/permissions — permissions attached to a specific role
 *   POST /customer/roles/create        — create role with permissions
 *   POST /customer/roles/update        — update role permissions
 *   POST /customer/roles/delete        — delete role
 *
 * This view surfaces raw permissions grouped by resource so administrators
 * can inspect what exists on the platform, and see which roles carry each
 * permission.  Full role CRUD is handled in RolesView; here the focus is the
 * permission registry itself.
 */

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  KeyRound,
  Search,
  ChevronRight,
  Box,
  Shield,
  LayoutGrid,
  List,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { fetchAllPermissions, fetchRoles } from "@/services/rolesService";
import type { Permission, Role } from "@/services/rolesService";
import { cn } from "@/lib/utils";
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
  tone: "indigo" | "amber" | "emerald" | "violet";
}) {
  const tones = {
    indigo:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
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

// ─── Resource group card ───────────────────────────────────────────────────────
function ResourceCard({
  resource,
  permissions,
  roles,
}: {
  resource: string;
  permissions: Permission[];
  roles: Role[];
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  // Which roles have at least one permission for this resource?
  const coveredByRoles = roles.filter((r) =>
    permissions.some((p) => r.permissions.includes(p.name))
  );

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold text-sm uppercase">
          {resource.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold capitalize">{resource}</div>
          <div className="text-xs text-muted-foreground">
            {permissions.length} {t("permissions.perms", "permissions")}
            {coveredByRoles.length > 0 && (
              <>
                {" "}
                · {coveredByRoles.length} {t("permissions.roles", "roles")}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {coveredByRoles.slice(0, 3).map((r) => (
            <Badge
              key={r.id}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {r.name}
            </Badge>
          ))}
          {coveredByRoles.length > 3 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              +{coveredByRoles.length - 3}
            </Badge>
          )}
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {permissions.map((p) => {
              const inRoles = roles.filter((r) =>
                r.permissions.includes(p.name)
              );
              return (
                <div
                  key={p.id}
                  className="rounded-md border bg-muted/30 p-3 space-y-1"
                >
                  <div className="text-xs font-mono font-medium text-foreground truncate">
                    {p.action ??
                      p.name.split(/[._-]/).slice(1).join("_") ??
                      p.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {p.name}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {inRoles.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground italic">
                        {t("permissions.noRoles", "No roles assigned")}
                      </span>
                    ) : (
                      inRoles.map((r) => (
                        <Badge
                          key={r.id}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {r.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Flat table tab ────────────────────────────────────────────────────────────
function PermissionsTable({
  permissions,
  roles,
  search,
  onSearchChange,
}: {
  permissions: Permission[];
  roles: Role[];
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((p) =>
      [p.name, p.resource, p.action]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [permissions, search]);

  return (
    <DataTable
      title={t("permissions.allPermissions", "All Permissions")}
      data={filtered}
      emptyMessage={t("permissions.noResults", "No permissions found")}
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={t(
        "permissions.searchPlaceholder",
        "Search permissions…"
      )}
      columns={[
        {
          key: "name",
          header: t("permissions.name", "Permission"),
          render: (p) => (
            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
              {p.name}
            </code>
          ),
        },
        {
          key: "resource",
          header: t("permissions.resource", "Resource"),
          render: (p) => (
            <Badge
              variant="outline"
              className="capitalize"
            >
              {p.resource}
            </Badge>
          ),
        },
        {
          key: "action",
          header: t("permissions.action", "Action"),
          render: (p) => (
            <span className="text-sm text-muted-foreground capitalize">
              {p.action ?? "—"}
            </span>
          ),
        },
        {
          key: "roles",
          header: t("permissions.assignedTo", "Assigned to Roles"),
          render: (p) => {
            const inRoles = roles.filter((r) => r.permissions.includes(p.name));
            if (inRoles.length === 0) {
              return (
                <span className="text-xs italic text-muted-foreground">
                  {t("permissions.unassigned", "Unassigned")}
                </span>
              );
            }
            return (
              <div className="flex flex-wrap gap-1">
                {inRoles.map((r) => (
                  <Badge
                    key={r.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {r.name}
                  </Badge>
                ))}
              </div>
            );
          },
        },
      ]}
    />
  );
}

// ─── Role × Permission matrix tab ─────────────────────────────────────────────
function RolePermissionMatrix({
  permissions,
  roles,
}: {
  permissions: Permission[];
  roles: Role[];
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const resources = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.resource))).sort(),
    [permissions]
  );

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter((r) => r.toLowerCase().includes(q));
  }, [resources, search]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <h2 className="text-base font-semibold">
          {t("permissions.matrix", "Role × Resource Matrix")}
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("permissions.searchResource", "Filter resources…")}
            className="w-56 ps-9"
          />
        </div>
      </div>
      <CardContent className="p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground sticky left-0 bg-muted/30">
                {t("permissions.resource", "Resource")}
              </th>
              {roles.map((r) => (
                <th
                  key={r.id}
                  className="px-3 py-3 text-center font-medium whitespace-nowrap"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-[11px] font-bold uppercase text-indigo-600">
                      {r.name.charAt(0)}
                    </div>
                    <span className="text-xs">{r.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredResources.map((resource) => {
              const resourcePerms = permissions.filter(
                (p) => p.resource === resource
              );
              return (
                <tr
                  key={resource}
                  className="border-b hover:bg-muted/20"
                >
                  <td className="px-4 py-3 font-medium capitalize sticky left-0 bg-background">
                    {resource}
                    <div className="text-[10px] text-muted-foreground">
                      {resourcePerms.length} perms
                    </div>
                  </td>
                  {roles.map((role) => {
                    const count = resourcePerms.filter((p) =>
                      role.permissions.includes(p.name)
                    ).length;
                    const total = resourcePerms.length;
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <td
                        key={role.id}
                        className="px-3 py-3 text-center"
                      >
                        {count === 0 ? (
                          <span className="text-muted-foreground/40">—</span>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <div
                              className={cn(
                                "h-2 w-12 rounded-full",
                                pct === 100
                                  ? "bg-emerald-500"
                                  : pct > 50
                                    ? "bg-amber-500"
                                    : "bg-rose-400"
                              )}
                              style={{
                                width: `${Math.max(pct, 8)}%`,
                                minWidth: "8px",
                                maxWidth: "48px",
                              }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {count}/{total}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {filteredResources.length === 0 && (
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="py-10 text-center text-muted-foreground"
                >
                  {t(
                    "permissions.noResources",
                    "No resources match your search"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function PermissionsView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [flatSearch, setFlatSearch] = useState("");

  const { data: permissions = [], isLoading: loadingPerms } = useQuery<Permission[]>({
    queryKey: ["roles", "permissions"],
    queryFn: () => fetchAllPermissions(),
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles(),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    permissions.forEach((p) => {
      const arr = map.get(p.resource) ?? [];
      arr.push(p);
      map.set(p.resource, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter(
      ([res, perms]) =>
        res.toLowerCase().includes(q) ||
        perms.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [grouped, search]);

  const totalResources = grouped.length;
  const unassigned = permissions.filter(
    (p) => !roles.some((r) => r.permissions.includes(p.name))
  ).length;

  const isLoading = loadingPerms || loadingRoles;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-700 to-violet-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3 backdrop-blur">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {t("permissions.title", "Permissions")}
            </h1>
            <p className="text-sm text-white/80">
              {t(
                "permissions.subtitle",
                "Inspect the full permission registry and see which roles carry each right"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<KeyRound className="h-5 w-5" />}
          label={t("permissions.total", "Total Permissions")}
          value={permissions.length}
          tone="indigo"
        />
        <StatCard
          icon={<Box className="h-5 w-5" />}
          label={t("permissions.resources", "Resources")}
          value={totalResources}
          tone="violet"
        />
        <StatCard
          icon={<Shield className="h-5 w-5" />}
          label={t("permissions.roles", "Roles")}
          value={roles.length}
          tone="emerald"
        />
        <StatCard
          icon={<KeyRound className="h-5 w-5 opacity-40" />}
          label={t("permissions.unassigned", "Unassigned")}
          value={unassigned}
          tone="amber"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grouped">
        <TabsList className="mb-4">
          <TabsTrigger
            value="grouped"
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            {t("permissions.grouped", "By Resource")}
          </TabsTrigger>
          <TabsTrigger
            value="flat"
            className="gap-2"
          >
            <List className="h-4 w-4" />
            {t("permissions.flat", "All Permissions")}
          </TabsTrigger>
          <TabsTrigger
            value="matrix"
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            {t("permissions.matrixTab", "Role Matrix")}
          </TabsTrigger>
        </TabsList>

        {/* ── Grouped by resource ── */}
        <TabsContent
          value="grouped"
          className="space-y-3"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "permissions.filterResource",
                "Filter by resource or permission…"
              )}
              className="ps-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map(([resource, perms]) => (
                <ResourceCard
                  key={resource}
                  resource={resource}
                  permissions={perms}
                  roles={roles}
                />
              ))}
              {filteredGroups.length === 0 && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    {t(
                      "permissions.noResults",
                      "No permissions match your search"
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Flat table ── */}
        <TabsContent value="flat">
          <PermissionsTable
            permissions={permissions}
            roles={roles}
            search={flatSearch}
            onSearchChange={setFlatSearch}
          />
        </TabsContent>

        {/* ── Matrix ── */}
        <TabsContent value="matrix">
          {isLoading ? (
            <Card>
              <CardContent className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-muted"
                  />
                ))}
              </CardContent>
            </Card>
          ) : (
            <RolePermissionMatrix
              permissions={permissions}
              roles={roles}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
