"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { usePermission } from "@/hooks/usePermission";
import { Search, ChevronDown, ChevronUp, Brain, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_SERVICES } from "@/views/ai-services/aiServicesData";
import { dashboardService } from "@/services/dashboardService";
import type { AIServiceItem } from "@/services/dashboardService";

// TABS labels are now resolved via t() in render — see tLabel() below
const TAB_IDS = [
  "all",
  "safety",
  "analytics",
  "operations",
  "monitoring",
] as const;
type Tab = (typeof TAB_IDS)[number];

const CATEGORY_PATH: Record<string, string> = {
  Safety: "safety",
  Analytics: "analytics",
  Operations: "operations",
  Monitoring: "monitoring",
};

const INITIAL_VISIBLE = 18;

// Map API service key -> static service id for detection count overlay
const KEY_TO_ID: Record<string, string> = {
  age_gender: "age-gender",
  attendance: "face-attendance",
  behavior: "behavior-analysis",
  cash_register: "cash-register",
  clean_tables: "clean-tables",
  cup_counting: "cup-counting",
  customer_traffic: "customer-traffic",
  delivery_tracking: "delivery-tracking",
  drive_thru: "drive-thru",
  face_detection: "face-detection",
  fire_detection: "fire-detection",
  smoke_detection: "smoke-detection",
  gate_monitoring: "gate-monitoring",
  helmet: "helmet-detection",
  kitchen_ppe: "kitchen-ppe",
  license_plate: "license-plate",
  mask: "mask-detection",
  motion: "motion-detection",
  object: "object-detection",
  overcrowd: "overcrowd-violation",
  people_counting: "people-counting",
  person: "person-detection",
  queue: "queue-management",
  receipt: "receipt-detection",
  restricted: "restricted-area",
  sandwich: "sandwich-counting",
  smoking: "smoking-detection",
  spill: "spill-detection",
  vehicle: "vehicle-tracking",
  waiting: "waiting-customer",
};

export default function AiServicesView({
  defaultTab,
}: { defaultTab?: string } = {}) {
  const { t } = useTranslation();
  const can = usePermission("ai-services");

  // Resolve tab label via i18n
  const tLabel = (id: string): string => {
    const keys: Record<string, string> = {
      all: t("aiServices.all", "All"),
      safety: t("aiServices.safety", "Safety"),
      analytics: t("aiServices.analytics", "Analytics"),
      operations: t("aiServices.operations", "Operations"),
      monitoring: t("aiServices.monitoring", "Monitoring"),
    };
    return keys[id] ?? id;
  };
  const [tab, setTab] = React.useState<string>("all");
  const [query, setQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  // live detection counts from API keyed by static service id
  const [liveCounts, setLiveCounts] = React.useState<Record<string, number>>(
    {}
  );

  React.useEffect(() => {
    dashboardService
      .listAIServices({})
      .then((items: AIServiceItem[]) => {
        const map: Record<string, number> = {};
        items.forEach((item) => {
          const staticId = KEY_TO_ID[item.key];
          if (staticId && item.detections) map[staticId] = item.detections;
        });
        setLiveCounts(map);
      })
      .catch(() => {
        /* silent */
      });
  }, []);

  const filtered = ALL_SERVICES.filter((s) => {
    const matchTab = tab === "all" || s.category.toLowerCase() === tab;
    const matchQuery =
      !query ||
      s.label.toLowerCase().includes(query.toLowerCase()) ||
      (s.labelKey ? t(s.labelKey, s.label) : s.label)
        .toLowerCase()
        .includes(query.toLowerCase());
    return matchTab && matchQuery;
  });

  const counts: Record<string, number> = { all: ALL_SERVICES.length };
  ALL_SERVICES.forEach((s) => {
    counts[s.category.toLowerCase()] =
      (counts[s.category.toLowerCase()] ?? 0) + 1;
  });

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  // Read guard handled via auth aliases — isAdmin bypasses all

  // Read guard — same `ai-services` permission that gates the sidebar group,
  // so the page can't be reached directly without it. Admins bypass via usePermission.
  if (!can.read) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          {t("common.notAuthorized", "You are not authorized to perform this action")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("common.noPermission", "You don't have permission to view this page.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header card */}
      <div className="rounded-2xl border bg-card shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold sm:text-xl">
                  {t("aiServices.title", "AI Services Hub")}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                >
                  {ALL_SERVICES.length} {t("aiServices.activeShort")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                "aiServices.searchPlaceholder",
                "Search services..."
              )}
              className="pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAll(true);
              }}
            />
          </div>
        </div>

        {/* Tabs */}
        <style>{`
          @keyframes slideUnderline {
            from {
              width: 0;
              left: 0;
            }
            to {
              width: 100%;
              left: 0;
            }
          }
          
          .tab-item {
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .tab-item::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 0;
            height: 2px;
            background: currentColor;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .tab-item.active::after {
            width: 100%;
          }
          
          .tab-item:not(.active):hover::after {
            width: 100%;
            opacity: 0.4;
          }
        `}</style>
        <div className="mt-4 flex gap-1 border-b overflow-x-auto">
          {TAB_IDS.map((tabId) => (
            <button
              key={tabId}
              onClick={() => {
                setTab(tabId);
                setShowAll(false);
              }}
              className={cn(
                "tab-item shrink-0 px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out",
                tab === tabId
                  ? "active text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tLabel(tabId)}
              <span className="ms-1.5 text-xs opacity-60">
                ({(counts as Record<string, number>)[tabId] ?? 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visible.map((svc) => {
          const Icon = svc.icon;
          const href = `/dashboard/ai-services/${CATEGORY_PATH[svc.category]}/${svc.id}`;
          const liveCount = liveCounts[svc.id] ?? 0;
          const displayCount =
            liveCount > 0 ? liveCount : svc.stats.todayDetections;
          return (
            <Link
              key={svc.id}
              href={href}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: svc.bgColor }}
              >
                <Icon
                  className="h-6 w-6"
                  style={{ color: svc.color }}
                />
              </div>
              <div className="w-full">
                <p className="text-xs font-semibold leading-snug text-foreground line-clamp-2">
                  {svc.labelKey ? t(svc.labelKey, svc.label) : svc.label}
                </p>
                <p className="mt-1 text-[10px] text-emerald-600 font-medium">
                  {t("aiServices.activeStatus")}
                </p>
                {displayCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="mt-1.5 h-4 px-1.5 text-[10px]"
                  >
                    {displayCount.toLocaleString()}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Show More / Less */}
      {hasMore && !query && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4" /> {t("aiServices.showLess")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />{" "}
                {t("aiServices.showAll", { n: filtered.length })}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
