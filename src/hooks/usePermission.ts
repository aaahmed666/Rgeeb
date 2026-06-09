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

export interface PermissionSet {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  /** true if the user has ANY permission for this resource */
  any: boolean;
}

const ACTIONS = ["read", "create", "update", "delete"] as const;

export function usePermission(resource: string): PermissionSet {
  const { isAdmin, user } = useAuth();

  return useMemo(() => {
    // Admins always have full access
    if (isAdmin) {
      return { read: true, create: true, update: true, delete: true, any: true };
    }

    const perms: string[] = (user as { permissions?: string[] })?.permissions ?? [];

    // If user has no permissions array at all, grant read-only access
    // (backend may not send permissions for all roles)
    if (perms.length === 0) {
      return { read: true, create: false, update: false, delete: false, any: true };
    }

    // Normalise resource key — "ai_task_rules" → "ai-task-rules" etc.
    const normalised = resource.toLowerCase().replace(/_/g, "-").replace(/\./g, "-");
    const normalised2 = resource.toLowerCase().replace(/-/g, "_").replace(/\./g, "_");

    const has = (action: string) =>
      perms.some((p) => {
        const pl = p.toLowerCase();
        return (
          pl === `${normalised}.${action}` ||
          pl === `${normalised}.*` ||
          pl === `${normalised2}.${action}` ||
          pl === `${normalised2}.*` ||
          pl === `*.${action}` ||
          pl === "*" ||
          // Broad match: if permission starts with the resource name
          pl.startsWith(`${normalised}.`) ||
          pl.startsWith(`${normalised2}.`)
        );
      });

    const result: PermissionSet = {
      read:   has("read"),
      create: has("create"),
      update: has("update"),
      delete: has("delete"),
      any:    false,
    };
    result.any = result.read || result.create || result.update || result.delete;
    return result;
  }, [isAdmin, user, resource]);
}
