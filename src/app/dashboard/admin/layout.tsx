"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Shared layout guard for all /dashboard/admin/* routes.
 * Enforces isAdmin check at the layout level so every child page
 * is protected without needing individual guards.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">
            {t("errors.unauthorized", "Access Denied")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.noAccess", "You don't have permission to access this area.")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
