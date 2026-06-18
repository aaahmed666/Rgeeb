"use client";

/**
 * usePermission — component-level CRUD permission hook.
 *
 * Returns { read, create, update, delete, any } for a given resource key.
 * Admins get all permissions. Otherwise checks the user's permissions list.
 *
 * Usage:
 *   const can = usePermission("branches");
 *   {can.create && <Button>Add Branch</Button>}
 *   {can.delete && <Trash2 onClick={...} />}
 */


import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { canAccess, permissionMatchesAction } from "@/lib/permissions";

export interface PermissionSet {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  /** true if the user has ANY permission for this resource */
  any: boolean;
}

export function usePermission(resource: string): PermissionSet {
  const { isAdmin, user } = useAuth();

  return useMemo(() => {
    // Admins always have full access
    if (isAdmin) {
      return { read: true, create: true, update: true, delete: true, any: true };
    }

    const perms: string[] = (user as { permissions?: string[] })?.permissions ?? [];
    const rbacProvided = (user as { rbacProvided?: boolean })?.rbacProvided;

    // `read` goes through the SHARED canAccess — the exact same function
    // hasPermission/the sidebar use — so "shows in sidebar" === "page opens",
    // including the legacy/empty-RBAC fallback. A user needs read to view.
    const read = canAccess(resource, {
      isAdmin,
      userPerms: perms,
      rbacProvided,
    });

    // create/update/delete: if the backend sent no RBAC data at all, this is a
    // legacy account — keep the historical read-only default (no write actions).
    if (perms.length === 0) {
      return { read, create: false, update: false, delete: false, any: read };
    }

    const result: PermissionSet = {
      read,
      create: permissionMatchesAction(resource, "create", perms),
      update: permissionMatchesAction(resource, "update", perms),
      delete: permissionMatchesAction(resource, "delete", perms),
      any: false,
    };
    result.any = result.read || result.create || result.update || result.delete;
    return result;
  }, [isAdmin, user, resource]);
}
