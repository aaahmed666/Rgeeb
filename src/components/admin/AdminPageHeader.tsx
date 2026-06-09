"use client";
import React from "react";

import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Some titleKey values (e.g. "admin.categories") point to an *object* in the
 * i18n JSON rather than a plain string.  Calling t("admin.categories") returns
 * the whole object and i18next logs a warning.
 *
 * Fix: map every object-key to its dedicated ".title" sub-key which IS a string
 * in both en.json and ar.json.
 */
const TITLE_KEY_MAP: Record<string, string> = {
  "admin.categories":    "admin.categories.title",
  "admin.services":      "admin.services.title",
  "admin.packages":      "admin.packages.title",
  "admin.aiModels":      "admin.aiModels.title",
  "admin.clients":       "admin.clients.title",
  "admin.subscriptions": "admin.subscriptions.title",
  "admin.dashboard":     "admin.dashboard.title",
  "admin.users":         "admin.users.title",
};

export function AdminPageHeader({
  titleKey,
  Icon,
  onRefresh,
  isRefreshing,
  right,
}: {
  titleKey: string;
  Icon: LucideIcon;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  right?: React.ReactNode;
}) {
  const { t } = useTranslation();
  // Resolve any object-key to its ".title" sub-key so t() always gets a string
  const resolvedKey = TITLE_KEY_MAP[titleKey] ?? titleKey;
  const title = t(resolvedKey);
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold sm:text-lg">{title}</h1>
          <p className="text-xs text-muted-foreground">{t("admin.sectionDescription")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {right}
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`me-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("common.refresh") || "Refresh"}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const { t } = useTranslation();
  const s = (status ?? "").toLowerCase();
  const tone =
    s === "active" || s === "paid" || s === "success"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : s === "pending"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : s === "failed" || s === "inactive" || s === "cancelled"
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-muted text-muted-foreground";

  const label =
    s === "active"    ? t("common.active")
    : s === "inactive"  ? t("common.inactive")
    : s === "paid"      ? t("admin.subscriptions.paid")
    : s === "pending"   ? t("admin.subscriptions.pending")
    : s === "failed"    ? t("admin.subscriptions.failed")
    : s === "cancelled" ? t("tasks.statusLabel.cancelled")
    : (status ?? "—");

  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>
      {label}
    </span>
  );
}
