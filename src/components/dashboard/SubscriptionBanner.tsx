"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  CalendarClock,
  Hourglass,
  Gauge,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchSubscription } from "@/services/subscriptionService";

const DAY_MS = 1000 * 60 * 60 * 24;
/** Show the amber "expiring soon" treatment at or below this many days. */
const EXPIRING_SOON_DAYS = 14;

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value: string | undefined, locale: string): string {
  const d = parseDate(value);
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function SubscriptionBanner() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en-GB";

  const sub = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000,
  });

  // ---- Loading skeleton ----
  if (sub.isLoading) {
    return (
      <section className="flex h-[120px] items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  const data = sub.data;
  const isExpiredOrNone =
    !data || ["expired", "cancelled"].includes(data.status ?? "");

  // ---- No active subscription ----
  if (isExpiredOrNone) {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-rose-300/50 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/15 p-2.5 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-600">
                {t("subscriptionBanner.noActiveTitle", "No active subscription")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(
                  "subscriptionBanner.noActiveDesc",
                  "Subscribe now to unlock all AI services."
                )}
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
          >
            <Link href="/dashboard/subscription">
              <Crown className="h-4 w-4" />
              {t("subscriptionBanner.subscribe", "Subscribe")}
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  // ---- Derived metrics ----
  const start = parseDate(data.start_date);
  const end = parseDate(data.end_date);

  // Total span of the plan (ms). Prefer real dates; fall back to months × 30d.
  const totalMs =
    start && end && end > start
      ? end.getTime() - start.getTime()
      : (data.duration_months || 0) * 30 * DAY_MS;

  // Days remaining: prefer the server value, else compute from end date.
  const daysRemaining =
    typeof data.days_remaining === "number" && data.days_remaining >= 0
      ? data.days_remaining
      : end
        ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / DAY_MS))
        : 0;

  // Percentage of the plan consumed so far.
  const usedMs =
    start && end
      ? Date.now() - start.getTime()
      : totalMs - daysRemaining * DAY_MS;
  const pctUsed = totalMs > 0 ? clampPct((usedMs / totalMs) * 100) : 0;

  const isExpiringSoon = daysRemaining <= EXPIRING_SOON_DAYS;

  // Theming: amber when close to expiry, indigo/violet otherwise.
  const accent = isExpiringSoon
    ? {
        ring: "border-amber-300/50",
        bg: "from-amber-500/12 via-amber-500/5 to-transparent",
        icon: "bg-amber-500/15 text-amber-600",
        bar: "[&>div]:bg-amber-500",
        pill: "bg-amber-500/15 text-amber-600",
        label: t("subscriptionBanner.statusExpiringSoon", "Expiring soon"),
      }
    : {
        ring: "border-indigo-300/40",
        bg: "from-indigo-500/10 via-violet-500/5 to-transparent",
        icon: "bg-indigo-500/15 text-indigo-600",
        bar: "[&>div]:bg-indigo-500",
        pill: "bg-emerald-500/15 text-emerald-600",
        label: t("subscriptionBanner.statusActive", "Active"),
      };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-r p-5 shadow-sm",
        accent.ring,
        accent.bg
      )}
      data-tour="subscription-banner"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Title + plan + status */}
        <div className="flex items-start gap-3">
          <div className={cn("rounded-xl p-2.5", accent.icon)}>
            <Crown className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold sm:text-base">
                {data.package_name || t("subscriptionBanner.plan", "Your Plan")}
              </h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  accent.pill
                )}
              >
                {accent.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "subscriptionBanner.subtitle",
                "Subscription overview at a glance"
              )}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:max-w-2xl">
          {/* Days remaining */}
          <Metric
            icon={<Hourglass className="h-4 w-4" />}
            label={t("subscriptionBanner.remaining", "Remaining")}
            value={
              <>
                {daysRemaining}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  {t("subscriptionBanner.days", "days")}
                </span>
              </>
            }
          />

          {/* Renewal / end date */}
          <Metric
            icon={<CalendarClock className="h-4 w-4" />}
            label={t("subscriptionBanner.renewalDate", "Renewal date")}
            value={
              <span className="text-base font-semibold">
                {formatDate(data.end_date, locale)}
              </span>
            }
          />

          {/* Consumed */}
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gauge className="h-4 w-4" />
              {t("subscriptionBanner.consumed", "Consumed")}
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={pctUsed}
                className={cn("h-2 flex-1", accent.bar)}
              />
              <span className="text-sm font-semibold tabular-nums">
                {pctUsed}%
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <Button
            asChild
            size="sm"
            className={cn(
              "gap-1.5 text-white",
              isExpiringSoon
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-indigo-500 hover:bg-indigo-600"
            )}
          >
            <Link href="/dashboard/subscription">
              {isExpiringSoon
                ? t("subscriptionBanner.renew", "Renew")
                : t("subscriptionBanner.upgrade", "Upgrade")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
    </div>
  );
}

export default SubscriptionBanner;
