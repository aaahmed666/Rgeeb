"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Tag,
  Briefcase,
  Package,
  Bot,
  Settings,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { fetchAdminDashboardStats } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

function AdminHub() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const stats = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: fetchAdminDashboardStats,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle>{t("errors.unauthorized")}</CardTitle>
            <CardDescription>{t("admin.noAccess")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const sections = [
    { href: "/dashboard/admin/clients", icon: Users, label: t("admin.clients") },
    { href: "/dashboard/admin/categories", icon: Tag, label: t("admin.categories") },
    { href: "/dashboard/admin/services", icon: Briefcase, label: t("admin.services") },
    { href: "/dashboard/admin/packages", icon: Package, label: t("admin.packages") },
    { href: "/dashboard/admin/ai-models", icon: Bot, label: t("admin.aiModels") },
    { href: "/dashboard/admin/settings", icon: Settings, label: t("admin.settings") },
    { href: "/dashboard/admin/subscriptions", icon: CreditCard, label: t("admin.subscriptions") },
  ] as const;

  const totals = stats.data?.totals ?? {};
  const totalEntries = Object.entries(totals).slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("admin.title")}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">{t("admin.description")}</p>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : stats.isError ? (
              <div className="col-span-full flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <RefreshCw className="h-4 w-4" />
                {stats.error instanceof Error ? stats.error.message : "Failed to load stats"}
              </div>
            ) : totalEntries.length === 0 ? null : (
              totalEntries.map(([k, v]) => (
                <Card key={k} className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {k.replace(/_/g, " ")}
                    </div>
                    <div className="mt-1 text-2xl font-bold">{String(v)}</div>
                  </CardContent>
                </Card>
              ))
            )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              to={s.href}
              className="group rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold">{s.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default AdminHub;
