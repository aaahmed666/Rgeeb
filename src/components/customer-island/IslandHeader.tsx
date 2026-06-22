"use client";

/**
 * Shared header for all Customer Island pages — parity port of the OLD
 * project's `components/customer-island/CustomerIslandHeader.tsx`.
 *
 * Filters (from / to / branch_id) live in the URL query string exactly like
 * the old implementation (router.query), so they persist across the section
 * tabs and deep links keep working.
 */
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Clock3,
  Filter as FilterIcon,
  LayoutDashboard,
  LineChart,
  MapPin,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, toLocalISODate } from "@/lib/utils";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";

const TABS = [
  {
    slug: "dashboard",
    labelKey: "island.tabs.dashboard",
    fallback: "Overview",
    icon: LayoutDashboard,
  },
  {
    slug: "traffic",
    labelKey: "island.tabs.traffic",
    fallback: "Traffic Analytics",
    icon: LineChart,
  },
  {
    slug: "conversion",
    labelKey: "island.tabs.conversion",
    fallback: "Conversion Funnel",
    icon: FilterIcon,
  },
  {
    slug: "employee-presence",
    labelKey: "island.tabs.presence",
    fallback: "Employee Presence",
    icon: UserCheck,
  },
  {
    slug: "response-time",
    labelKey: "island.tabs.responseTime",
    fallback: "Response Time",
    icon: Clock3,
  },
  {
    slug: "demographics",
    labelKey: "island.tabs.demographics",
    fallback: "Demographics",
    icon: Users,
  },
  {
    slug: "heatmap",
    labelKey: "island.tabs.heatmap",
    fallback: "Heatmap Analysis",
    icon: MapPin,
  },
  {
    slug: "violations",
    labelKey: "island.tabs.violations",
    fallback: "Violations",
    icon: AlertTriangle,
  },
  {
    slug: "compliance",
    labelKey: "island.tabs.compliance",
    fallback: "Compliance",
    icon: ShieldCheck,
  },
  {
    slug: "settings",
    labelKey: "island.tabs.settings",
    fallback: "Settings",
    icon: SettingsIcon,
  },
] as const;

export interface IslandQueryFilters {
  from?: string;
  to?: string;
  branch_id?: string;
}

/** Read the shared island filters from the URL. */
export function useIslandFilters(): IslandQueryFilters {
  const sp = useSearchParams();
  return {
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    branch_id: sp.get("branch_id") ?? undefined,
  };
}

export default function IslandHeader({
  onRefresh,
  refreshing,
}: {
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const branchId = sp.get("branch_id");

  const setQuery = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`);
    },
    [sp, router, pathname]
  );

  const qs = sp.toString();

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            {t("island.title", "Customer Island")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "island.subtitle",
              "Passers, stoppers, buyers and staff coverage analytics"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56">
            <SharedDateRangePicker
              value={from && to ? [new Date(from), new Date(to)] : null}
              onChange={(range) => {
                if (range) {
                  setQuery({
                    from: toLocalISODate(range[0]),
                    to: toLocalISODate(range[1]),
                  });
                } else {
                  setQuery({ from: null, to: null });
                }
              }}
              placeholder={t("island.dateRange", "Date range")}
            />
          </div>
          <div className="w-48">
            <AsyncPaginatedSelect
              endpoint="/customer/branches"
              labelKey="name"
              valueKey="id"
              extraParams={{ active: 1 }}
              value={branchId}
              onChange={(v: string | null) => setQuery({ branch_id: v })}
              placeholder={t("island.allBranches", "All Branches")}
              isClearable
            />
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label={t("common.refresh", "Refresh")}
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Section tab navigation */}
      <nav className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
        {TABS.map(({ slug, labelKey, fallback, icon: Icon }) => {
          const href = `/dashboard/customer-island/${slug}${qs ? `?${qs}` : ""}`;
          const active = pathname?.endsWith(`/${slug}`);
          return (
            <Link
              key={slug}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey, fallback)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
