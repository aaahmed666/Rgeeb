"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Crown,
  RefreshCw,
  Camera,
  Building2,
  CheckCircle2,
  Plus,
  Loader2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/ui/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import {
  fetchSubscription,
  fetchUsage,
  fetchTransactions,
} from "@/services/subscriptionService";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "border-emerald-300/60 bg-emerald-500/10 text-emerald-600",
    paid: "border-emerald-300/60 bg-emerald-500/10 text-emerald-600",
    pending: "border-amber-300/60 bg-amber-500/10 text-amber-600",
    failed: "border-rose-300/60 bg-rose-500/10 text-rose-600",
    expired: "border-rose-300/60 bg-rose-500/10 text-rose-600",
    cancelled: "border-muted bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", map[status] ?? "")}>{status}</Badge>
  );
}

export default function SubscriptionView() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.dir() === "rtl";
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } = useDebounceSearch("", 300);

  const sub = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });
  const usage = useQuery({ queryKey: ["subscription-usage"], queryFn: fetchUsage });
  const tx = useQuery({ queryKey: ["subscription-tx"], queryFn: fetchTransactions });

  const refresh = () => {
    sub.refetch();
    usage.refetch();
    tx.refetch();
  };

  const loading = sub.isLoading || usage.isLoading;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 text-white shadow-md">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("subscription.title", "Subscription")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("subscription.subtitle", "Plan details, usage, and billing history")}
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={refresh} className="shrink-0">
          <RefreshCw className={cn("h-4 w-4", (sub.isFetching || tx.isFetching) && "animate-spin")} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-1">
          <CardContent className="p-5">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sub.data ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <Badge className="gap-1.5 bg-indigo-500 text-white hover:bg-indigo-500">
                    <Crown className="h-3.5 w-3.5" />
                    {sub.data.package_name}
                  </Badge>
                  <StatusPill status={sub.data.status} />
                </div>
                <div className="py-4 text-center">
                  <div className="text-4xl font-bold">
                    {sub.data.price.toLocaleString()}{" "}
                    <span className="text-base font-medium text-muted-foreground">
                      {sub.data.currency}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    / {sub.data.duration_months} {t("subscription.months", "months")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("subscription.startDate", "Start Date")}</p>
                    <p className="font-medium">{sub.data.start_date || "—"}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-muted-foreground">{t("subscription.endDate", "End Date")}</p>
                    <p className="font-medium">{sub.data.end_date || "—"}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("subscription.timeRemaining", "Time Remaining")}
                    </span>
                    <span className="font-medium">
                      {sub.data.days_remaining} {t("subscription.daysLeft", "days left")}
                    </span>
                  </div>
                  <Progress
                    value={
                      sub.data.duration_months
                        ? (sub.data.days_remaining / (sub.data.duration_months * 30)) * 100
                        : 0
                    }
                  />
                </div>
              </>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Crown className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("subscription.noPlan", "No active subscription")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <h3 className="mb-4 text-base font-semibold">
                {t("subscription.resourceUsage", "Resource Usage")}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <span>{t("subscription.cameras", "Cameras")}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usage.data?.cameras.used ?? 0} / {usage.data?.cameras.total ?? 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      usage.data?.cameras.total
                        ? (usage.data.cameras.used / usage.data.cameras.total) * 100
                        : 0
                    }
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{t("subscription.branches", "Branches")}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {usage.data?.branches.used ?? 0} / {usage.data?.branches.total ?? 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      usage.data?.branches.total
                        ? (usage.data.branches.used / usage.data.branches.total) * 100
                        : 0
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">
                    {t("subscription.includedServices", "Included Services")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {(sub.data?.services?.length ?? 0)} {t("subscription.services", "services")}
                  </p>
                </div>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t("subscription.addServices", "Add Services")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(isAr && sub.data?.service_names_ar?.length
                  ? sub.data.service_names_ar
                  : sub.data?.services ?? []
                ).map((s, idx) => (
                  <Badge
                    key={`${s}-${idx}`}
                    variant="outline"
                    className="gap-1 border-emerald-300/60 bg-emerald-500/10 text-emerald-700"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {s}
                  </Badge>
                ))}
                {!sub.data?.services?.length && (
                  <p className="text-sm text-muted-foreground">
                    {t("subscription.noServices", "No services included")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3">
            <h3 className="text-base font-semibold">
              {t("subscription.billingHistory", "Billing History")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("subscription.allTransactions", "All subscription transactions")}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("subscription.col.date", "Date")}</TableHead>
                <TableHead>{t("subscription.col.type", "Type")}</TableHead>
                <TableHead>{t("subscription.col.package", "Package")}</TableHead>
                <TableHead>{t("subscription.col.amount", "Amount")}</TableHead>
                <TableHead>{t("subscription.col.status", "Status")}</TableHead>
                <TableHead>{t("subscription.col.method", "Method")}</TableHead>
                <TableHead>{t("subscription.col.period", "Period")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!tx.isLoading && (tx.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {t("subscription.emptyTx", "No transactions yet")}
                  </TableCell>
                </TableRow>
              )}
              {(tx.data ?? []).map((t2) => (
                <TableRow key={t2.id}>
                  <TableCell>{t2.date ? new Date(t2.date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{t2.type}</Badge>
                  </TableCell>
                  <TableCell>{t2.package_name}</TableCell>
                  <TableCell className="font-semibold">
                    {t2.amount.toFixed(2)} {t2.currency}
                  </TableCell>
                  <TableCell><StatusPill status={t2.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{t2.method ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t2.period_from && t2.period_to
                      ? `${t2.period_from} → ${t2.period_to}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
