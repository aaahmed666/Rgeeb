"use client";
import React from "react";

import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold sm:text-xl">{t(titleKey)}</h1>
          <p className="text-xs text-muted-foreground">{t("admin.sectionDescription")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {right}
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("common.refresh") || "Refresh"}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const s = (status ?? "").toLowerCase();
  const tone =
    s === "active" || s === "paid" || s === "success"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : s === "pending"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : s === "failed" || s === "inactive" || s === "cancelled"
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>
      {status ?? "—"}
    </span>
  );
}
