"use client";

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

const STAT_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  clients:             { label: "Clients",              icon: Users,     color: "text-blue-500   bg-blue-500/10"   },
  categories:          { label: "Categories",           icon: Tag,       color: "text-purple-500 bg-purple-500/10" },
  services:            { label: "Services",             icon: Briefcase, color: "text-orange-500 bg-orange-500/10" },
  packages:            { label: "Packages",             icon: Package,   color: "text-pink-500   bg-pink-500/10"   },
  aiModels:            { label: "AI Models",            icon: Bot,       color: "text-teal-500   bg-teal-500/10"   },
  subscriptions:       { label: "Subscriptions",        icon: CreditCard,color: "text-green-500  bg-green-500/10"  },
  activeSubscriptions: { label: "Active Subscriptions", icon: ShieldCheck,color:"text-emerald-500 bg-emerald-500/10"},
};

const NAV_SECTIONS = [
  { href: "/dashboard/admin/clients",       icon: Users,     labelKey: "admin.clients"       },
  { href: "/dashboard/admin/categories",    icon: Tag,       labelKey: "admin.categories"    },
  { href: "/dashboard/admin/services",      icon: Briefcase, labelKey: "admin.services"      },
  { href: "/dashboard/admin/packages",      icon: Package,   labelKey: "admin.packages"      },
  { href: "/dashboard/admin/ai-models",     icon: Bot,       labelKey: "admin.aiModels"      },
  { href: "/dashboard/admin/subscriptions", icon: CreditCard,labelKey: "admin.subscriptions" },
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

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">{t("errors.unauthorized")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.noAccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-10">
      {/* Header */}
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
          ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : Object.entries(STAT_LABELS).map(([key, meta]) => {
              const value = stats.data?.[key as keyof typeof stats.data] ?? 0;
              const Icon = meta.icon;
              const [textColor, bgColor] = meta.color.split(" ");
              return (
                <Card key={key} className="border-border/60 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                      <p className="text-2xl font-bold">{String(value)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Navigation grid */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-muted-foreground uppercase tracking-wide">
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
