"use client";
import React from "react";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Tag, Briefcase, Package, Bot, Settings,
  CreditCard, ShieldAlert, ShieldCheck, Globe, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { fetchAdminDashboardStats } from "@/services/adminService";

/* ─── Stat card meta — labels via i18n ──────────────────────────────────── */
const STAT_KEYS: Array<{
  key: string;
  labelKey: string;
  icon: React.ElementType;
  textColor: string;
  bgColor: string;
}> = [
  { key: "clients",             labelKey: "admin.statClients",             icon: Users,      textColor: "text-blue-500",    bgColor: "bg-blue-500/10"    },
  { key: "categories",          labelKey: "admin.statCategories",          icon: Tag,        textColor: "text-purple-500",  bgColor: "bg-purple-500/10"  },
  { key: "services",            labelKey: "admin.statServices",            icon: Briefcase,  textColor: "text-orange-500",  bgColor: "bg-orange-500/10"  },
  { key: "packages",            labelKey: "admin.statPackages",            icon: Package,    textColor: "text-pink-500",    bgColor: "bg-pink-500/10"    },
  { key: "aiModels",            labelKey: "admin.statAiModels",            icon: Bot,        textColor: "text-teal-500",    bgColor: "bg-teal-500/10"    },
  { key: "subscriptions",       labelKey: "admin.statSubscriptions",       icon: CreditCard, textColor: "text-green-500",   bgColor: "bg-green-500/10"   },
  { key: "activeSubscriptions", labelKey: "admin.statActiveSubscriptions", icon: ShieldCheck,textColor: "text-emerald-500", bgColor: "bg-emerald-500/10" },
];

const NAV_SECTIONS = [
  { href: "/dashboard/admin/clients",       icon: Users,     labelKey: "admin.clients.title"       },
  { href: "/dashboard/admin/categories",    icon: Tag,       labelKey: "admin.categories.title"    },
  { href: "/dashboard/admin/services",      icon: Briefcase, labelKey: "admin.services.title"      },
  { href: "/dashboard/admin/packages",      icon: Package,   labelKey: "admin.packages.title"      },
  { href: "/dashboard/admin/ai-models",     icon: Bot,       labelKey: "admin.aiModels.title"      },
  { href: "/dashboard/admin/subscriptions", icon: CreditCard,labelKey: "admin.subscriptions.title" },
  { href: "/dashboard/admin/countries",     icon: Globe,     labelKey: "admin.countries"     },
  { href: "/dashboard/admin/cities",        icon: Building2, labelKey: "admin.cities"        },
  { href: "/dashboard/admin/settings",      icon: Settings,  labelKey: "admin.settings"      },
] as const;

export default function AdminDashboardView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const stats = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: fetchAdminDashboardStats,
    enabled: isAdmin,
    staleTime: 60_000,
  });

  /* ── Access denied ── */
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.noAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-10">

      {/* ── Header ── */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold sm:text-xl">{t("admin.title")}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">{t("admin.description")}</p>
      </header>

      {/* ── Stats grid — responsive 2/3/4 cols ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.isLoading
          ? Array.from({ length: STAT_KEYS.length }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : STAT_KEYS.map(({ key, labelKey, icon: Icon, textColor, bgColor }) => {
              const value = (stats.data as Record<string, unknown> | undefined)?.[key] ?? 0;
              return (
                <Card key={key} className="border-border/60 shadow-sm transition hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground">
                        {t(labelKey)}
                      </p>
                      <p className="text-2xl font-bold tabular-nums">{String(value)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* ── Navigation grid ── */}
      <div>
        <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-muted-foreground">
          {t("admin.sections", "Management")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-base font-semibold">{t(s.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
