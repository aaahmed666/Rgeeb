"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  RefreshCw,
  Camera,
  Building2,
  CheckCircle2,
  Plus,
  Loader2,
  RotateCcw,
  Package,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  fetchSubscription,
  fetchUsage,
  fetchTransactions,
  fetchAvailableServices,
  addServices,
} from "@/services/subscriptionService";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

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
    <Badge
      variant="outline"
      className={cn("capitalize", map[status] ?? "")}
    >
      {status}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Add-services modal                                                   */
/* ------------------------------------------------------------------ */

function AddServicesModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.dir() === "rtl";
  const [selected, setSelected] = useState<string[]>([]);

  const servicesQ = useQuery({
    queryKey: ["available-services"],
    queryFn: fetchAvailableServices,
    enabled: open,
  });

  const addMut = useMutation({
    mutationFn: () => addServices(selected),
    onSuccess: () => {
      toast.success(
        t("subscription.servicesAdded", "Services added successfully")
      );
      onSuccess();
      onClose();
      setSelected([]);
    },
    onError: () =>
      toast.error(
        t("subscription.servicesAddFailed", "Failed to add services")
      ),
  });

  if (!open) return null;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2">
            <Package className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h3 className="font-semibold">
              {t("subscription.addServices", "Add Services")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                "subscription.addServicesDesc",
                "Select additional services to add to your plan"
              )}
            </p>
          </div>
        </div>

        {servicesQ.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (servicesQ.data ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t(
              "subscription.noAvailableServices",
              "No additional services available"
            )}
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {(servicesQ.data ?? []).map((svc) => {
              const active = selected.includes(svc.id);
              const name = isAr && svc.name_ar ? svc.name_ar : svc.name;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => !svc.included && toggle(svc.id)}
                  disabled={svc.included}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                    svc.included
                      ? "cursor-default border-emerald-300/40 bg-emerald-500/5 text-emerald-700"
                      : active
                        ? "border-violet-400 bg-violet-500/10 text-foreground"
                        : "border-border bg-muted/30 text-foreground hover:bg-muted/60"
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {svc.included && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {svc.included
                      ? t("subscription.included", "Included")
                      : svc.price !== undefined
                        ? `+${svc.price} SAR`
                        : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            className="flex-1"
            disabled={selected.length === 0 || addMut.isPending}
            onClick={() => addMut.mutate()}
          >
            {addMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t("subscription.addSelected", "Add Selected")}{" "}
            {selected.length > 0 && `(${selected.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subscribe modal (for users with no active subscription)             */
/* ------------------------------------------------------------------ */

async function fetchPackages() {
  const res = await apiFetch<unknown>(endpoints.lookups.packages);
  const obj = res as Record<string, unknown>;
  const list = (obj?.data ?? obj) as Array<Record<string, unknown>>;
  return Array.isArray(list) ? list : [];
}

async function subscribeToPackage(packageId: string) {
  await apiFetch(endpoints.subscription.subscribe, {
    method: "POST",
    body: { package_id: packageId },
  });
}

async function renewSubscription() {
  await apiFetch(endpoints.subscription.renew, { method: "POST" });
}

function SubscribeModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.dir() === "rtl";
  const [selected, setSelected] = useState("");

  const packagesQ = useQuery({
    queryKey: ["packages-for-subscribe"],
    queryFn: fetchPackages,
    enabled: open,
  });

  const subMut = useMutation({
    mutationFn: () => subscribeToPackage(selected),
    onSuccess: () => {
      toast.success(
        t("subscription.subscribeSuccess", "Subscription activated!")
      );
      onSuccess();
      onClose();
    },
    onError: () =>
      toast.error(
        t("subscription.subscribeFailed", "Failed to activate subscription")
      ),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold">
              {t("subscription.choosePlan", "Choose a Plan")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                "subscription.choosePlanDesc",
                "Select a package to activate your subscription"
              )}
            </p>
          </div>
        </div>

        {packagesQ.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {(packagesQ.data ?? []).map((pkg) => {
              const id = String(pkg.id);
              const active = selected === id;
              const name = isAr
                ? String(pkg.name_ar ?? pkg.name_en ?? pkg.name ?? "")
                : String(pkg.name_en ?? pkg.name ?? "");
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                    active
                      ? "border-amber-400 bg-amber-500/10 text-foreground"
                      : "border-border bg-muted/30 hover:bg-muted/60"
                  )}
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {pkg.price ? `${pkg.price} ${pkg.currency ?? "SAR"}` : ""}
                    {pkg.duration
                      ? ` / ${pkg.duration} ${pkg.duration_unit ?? "mo"}`
                      : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
            disabled={!selected || subMut.isPending}
            onClick={() => subMut.mutate()}
          >
            {subMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            {t("subscription.activatePlan", "Activate Plan")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main view                                                            */
/* ------------------------------------------------------------------ */

export default function SubscriptionView() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.dir() === "rtl";
  const qc = useQueryClient();

  const [addServicesOpen, setAddServicesOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const sub = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
  });
  const usage = useQuery({
    queryKey: ["subscription-usage"],
    queryFn: fetchUsage,
  });
  const tx = useQuery({
    queryKey: ["subscription-tx"],
    queryFn: fetchTransactions,
  });

  const renewMut = useMutation({
    mutationFn: renewSubscription,
    onSuccess: () => {
      toast.success(
        t("subscription.renewSuccess", "Subscription renewed successfully")
      );
      invalidateAll();
    },
    onError: () =>
      toast.error(
        t("subscription.renewFailed", "Failed to renew subscription")
      ),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["subscription"] });
    qc.invalidateQueries({ queryKey: ["subscription-usage"] });
    qc.invalidateQueries({ queryKey: ["subscription-tx"] });
  };

  const refresh = () => {
    sub.refetch();
    usage.refetch();
    tx.refetch();
  };

  const loading = sub.isLoading || usage.isLoading;
  const hasActiveSub = sub.data?.status === "active";
  const isExpiredOrNone =
    !sub.data || ["expired", "cancelled"].includes(sub.data.status ?? "");

  return (
    <>
      <AddServicesModal
        open={addServicesOpen}
        onClose={() => setAddServicesOpen(false)}
        onSuccess={invalidateAll}
      />
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        onSuccess={invalidateAll}
      />

      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
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
                {t(
                  "subscription.subtitle",
                  "Plan details, usage, and billing history"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpiredOrNone && (
              <Button
                size="sm"
                className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                onClick={() => setSubscribeOpen(true)}
              >
                <Crown className="h-4 w-4" />
                {t("subscription.subscribe", "Subscribe")}
              </Button>
            )}
            {hasActiveSub && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={renewMut.isPending}
                onClick={() => renewMut.mutate()}
              >
                {renewMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {t("subscription.renew", "Renew")}
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              className="shrink-0"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  (sub.isFetching || tx.isFetching) && "animate-spin"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Plan card + usage */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Plan card */}
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
                      / {sub.data.duration_months}{" "}
                      {t("subscription.months", "months")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("subscription.startDate", "Start Date")}
                      </p>
                      <p className="font-medium">
                        {sub.data.start_date || "—"}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">
                        {t("subscription.endDate", "End Date")}
                      </p>
                      <p className="font-medium">{sub.data.end_date || "—"}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t("subscription.timeRemaining", "Time Remaining")}
                      </span>
                      <span className="font-medium">
                        {sub.data.days_remaining}{" "}
                        {t("subscription.daysLeft", "days left")}
                      </span>
                    </div>
                    <Progress
                      value={
                        sub.data.duration_months
                          ? (sub.data.days_remaining /
                              (sub.data.duration_months * 30)) *
                            100
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
                  <Button
                    size="sm"
                    className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                    onClick={() => setSubscribeOpen(true)}
                  >
                    <Crown className="h-4 w-4" />
                    {t("subscription.getStarted", "Get Started")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage + services */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <h3 className="mb-4 text-base font-semibold">
                  {t("subscription.resourceUsage", "Resource Usage")}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: Camera,
                      label: t("subscription.cameras", "Cameras"),
                      used: usage.data?.cameras.used ?? 0,
                      total: usage.data?.cameras.total ?? 0,
                    },
                    {
                      icon: Building2,
                      label: t("subscription.branches", "Branches"),
                      used: usage.data?.branches.used ?? 0,
                      total: usage.data?.branches.total ?? 0,
                    },
                  ].map(({ icon: Icon, label, used, total }) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{label}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {used} / {total}
                        </span>
                      </div>
                      <Progress value={total ? (used / total) * 100 : 0} />
                    </div>
                  ))}
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
                      {sub.data?.services?.length ?? 0}{" "}
                      {t("subscription.services", "services")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setAddServicesOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    {t("subscription.addServices", "Add Services")}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(isAr && sub.data?.service_names_ar?.length
                    ? sub.data.service_names_ar
                    : (sub.data?.services ?? [])
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

        {/* Billing history */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-3">
              <h3 className="text-base font-semibold">
                {t("subscription.billingHistory", "Billing History")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(
                  "subscription.allTransactions",
                  "All subscription transactions"
                )}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscription.col.date", "Date")}</TableHead>
                  <TableHead>{t("subscription.col.type", "Type")}</TableHead>
                  <TableHead>
                    {t("subscription.col.package", "Package")}
                  </TableHead>
                  <TableHead>
                    {t("subscription.col.amount", "Amount")}
                  </TableHead>
                  <TableHead>
                    {t("subscription.col.status", "Status")}
                  </TableHead>
                  <TableHead>
                    {t("subscription.col.method", "Method")}
                  </TableHead>
                  <TableHead>
                    {t("subscription.col.period", "Period")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tx.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center"
                    >
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}
                {!tx.isLoading && (tx.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {t("subscription.emptyTx", "No transactions yet")}
                    </TableCell>
                  </TableRow>
                )}
                {(tx.data ?? []).map((t2) => (
                  <TableRow key={t2.id}>
                    <TableCell>
                      {t2.date ? new Date(t2.date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize"
                      >
                        {t2.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{t2.package_name}</TableCell>
                    <TableCell className="font-semibold">
                      {t2.amount.toFixed(2)} {t2.currency}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={t2.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t2.method ?? "—"}
                    </TableCell>
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
    </>
  );
}
