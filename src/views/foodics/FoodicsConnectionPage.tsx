"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plug,
  RefreshCw,
  Unlink,
  AlertCircle,
  Receipt,
  ShieldCheck,
  Wallet,
  LayoutGrid,
  Activity,
  PlugZap,
  HeartPulse,
  Brain,
  Webhook,
  Cpu } from "lucide-react";
import { foodicsService, FoodicsStatus } from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { usePermission } from "@/hooks/usePermission";

// Service tiles — parity with the legacy production System Health page
// (old src/pages/apps/foodics/health.tsx). Each service derives its status
// from the connection + a live /health probe rather than a backend `services`
// payload, and renders a gradient icon tile + pulsing status dot.
const SERVICE_ICONS = [
  { key: "foodics_api", labelKey: "foodics.svcApiLabel", descKey: "foodics.svcApiDesc", icon: PlugZap },
  { key: "health_endpoint", labelKey: "foodics.svcHealthLabel", descKey: "foodics.svcHealthDesc", icon: HeartPulse },
  { key: "order_sync", labelKey: "foodics.svcOrderSyncLabel", descKey: "foodics.svcOrderSyncDesc", icon: RefreshCw },
  { key: "ai_workers", labelKey: "foodics.svcAiWorkersLabel", descKey: "foodics.svcAiWorkersDesc", icon: Brain },
  { key: "webhook_receiver", labelKey: "foodics.svcWebhookLabel", descKey: "foodics.svcWebhookDesc", icon: Webhook },
  { key: "bridge_api", labelKey: "foodics.svcBridgeLabel", descKey: "foodics.svcBridgeDesc", icon: Cpu },
];

// Foodics Intelligence Modules — quick-access cards (parity with the legacy
// single foodics page). Titles/subtitles use existing i18n keys.
const FEATURE_MODULES = [
  {
    titleKey: "foodics.orders",
    titleFallback: "Orders",
    descKey: "foodics.ordersDesc",
    descFallback: "View and sync Foodics orders",
    icon: Receipt,
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    path: "/dashboard/foodics/orders",
  },
  {
    titleKey: "foodics.refund",
    titleFallback: "Refund Verification",
    descKey: "foodics.refundDesc",
    descFallback: "AI-verified refund monitoring",
    icon: ShieldCheck,
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    path: "/dashboard/foodics/refund-verification",
  },
  {
    titleKey: "foodics.cashDrawer",
    titleFallback: "Cash Drawer Audit",
    descKey: "foodics.cashDrawerDesc",
    descFallback: "Detect suspicious drawer opens",
    icon: Wallet,
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    path: "/dashboard/foodics/cash-drawer-audit",
  },
  {
    titleKey: "foodics.dashboard",
    titleFallback: "Foodics Dashboard",
    descKey: "foodics.dashboardDesc",
    descFallback: "AI insights & analytics overview",
    icon: LayoutGrid,
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    path: "/dashboard/foodics/dashboard",
  },
];

export default function FoodicsConnectionPage() {
  const can = usePermission("foodics");
  const router = useRouter();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = React.useState(false);
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<FoodicsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Live health probe + last-checked time (parity with legacy production page).
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  const fetchStatus = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [data, isHealthy] = await Promise.all([
        foodicsService.getStatus(),
        foodicsService.checkHealth(),
      ]);
      setStatus(data);
      setHealthOk(isHealthy);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setError(t("foodics.loadStatusFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await foodicsService.getConnectUrl();
      if (url) {
        window.location.href = url;
      } else {
        setError(t("foodics.initConnectionFailed"));
        setConnecting(false);
      }
    } catch {
      setError(t("foodics.initConnectionFailed"));
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await foodicsService.disconnect();
      await fetchStatus();
    } catch {
      setError(t("foodics.disconnectFailed"));
    } finally {
      setDisconnecting(false);
    }
  };

  // Derive each service's status the same way the legacy production page did,
  // rather than trusting a backend `services` payload (which the status
  // endpoint does not return — that was why this showed 0%/all-red).
  //   foodics_api / order_sync / webhook_receiver → ok when connected
  //   health_endpoint → ok when the live /health probe succeeds
  //   ai_workers / bridge_api → always ok (configured pipelines)
  const isConnected = !!status?.connected;
  const serviceStatus: Record<string, "ok" | "warn" | "error"> = {
    foodics_api: isConnected ? "ok" : "error",
    health_endpoint:
      healthOk === null ? "warn" : healthOk ? "ok" : "error",
    order_sync: isConnected ? "ok" : "warn",
    ai_workers: "ok",
    webhook_receiver: isConnected ? "ok" : "warn",
    bridge_api: "ok",
  };
  const totalServices = SERVICE_ICONS.length;
  const operationalCount = SERVICE_ICONS.filter(
    (s) => serviceStatus[s.key] === "ok"
  ).length;
  const healthPct = Math.round((operationalCount / totalServices) * 100);
  const healthColor =
    healthPct >= 80 ? "#22c55e" : healthPct >= 50 ? "#f59e0b" : "#ef4444";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not connected state
  if (!status?.connected) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <Plug className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-card-foreground mb-2">
              {t("foodics.connect")}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {t("foodics.connectDesc")}
            </p>
          </div>
          <div className="flex gap-4 flex-wrap justify-center">
            {[
              { label: t("foodics.orderSync"), color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
              { label: t("foodics.refundAudit"), color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
              { label: t("foodics.drawerMonitor"), color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
              { label: t("foodics.aiAnalytics"), color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
            ].map((f) => (
              <span
                key={f.label}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${f.color}`}
              >
                {f.label}
              </span>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition disabled:opacity-60"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plug className="w-4 h-4" />
            )}
            {t("foodics.connectToFoodics")}
          </button>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {t("foodics.connectDesc")}
          </p>
        </div>
      </div>
    );
  }

  // Connected state - matches System Health screen
  if (!hasPermission("foodics.status")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {t("foodics.accessDenied")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("foodics.noPermissionConnection")}
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Health Header */}
      <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-6">
        {/* Circle progress */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 80 80"
          >
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke={healthColor}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - healthPct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-card-foreground">
            {healthPct}%
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Activity className="w-6 h-6" />
            {t("foodics.systemHealth")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {operationalCount}/{totalServices}{" "}
            {t("foodics.servicesOperational", "services operational")}
            {lastChecked
              ? ` • ${t("foodics.lastChecked", "Last checked")}: ${lastChecked}`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {t("common.refresh")}
          </button>
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition"
          >
            {disconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Unlink className="w-4 h-4" />
            )}
            {t("foodics.disconnect")}
          </button>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_ICONS.map((svc) => {
          const st = serviceStatus[svc.key];
          const Icon = svc.icon;
          const tone =
            st === "ok" ? "#22c55e" : st === "warn" ? "#f59e0b" : "#ef4444";
          return (
            <div
              key={svc.key}
              className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 transition-transform hover:-translate-y-0.5"
            >
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 text-white"
                style={{
                  background: `linear-gradient(135deg, ${tone}, ${tone}99)`,
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{
                      background: tone,
                      boxShadow: `0 0 8px ${tone}`,
                    }}
                  />
                  <p className="text-sm font-semibold text-card-foreground">
                    {t(svc.labelKey)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(svc.descKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          {t("foodics.connectionDetails")}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-32">{t("foodics.status")}</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold">
              {t("foodics.connected")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-32">{t("foodics.connectedAt")}</span>
            <span className="text-card-foreground">
              {status?.connected_at ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-32">{t("foodics.businessId")}</span>
            <span className="text-card-foreground font-mono text-xs">
              {status?.business_id ?? "—"}
            </span>
          </div>
          {status?.business_name && (
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-32">{t("foodics.businessName")}</span>
              <span className="text-card-foreground">
                {status.business_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Foodics Intelligence Modules */}
      <div>
        <h3 className="text-sm font-semibold text-card-foreground mb-3">
          {t("foodics.intelligenceModules", "Foodics Intelligence Modules")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.path}
                onClick={() => router.push(mod.path)}
                className="group rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center gap-3 transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: mod.gradient }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">
                    {t(mod.titleKey, mod.titleFallback)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t(mod.descKey, mod.descFallback)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
    <ConfirmDeleteDialog
      open={showDisconnectConfirm}
      onOpenChange={setShowDisconnectConfirm}
      title={t("foodics.disconnect", "Disconnect Foodics")}
      description={t("foodics.disconnectConfirm", "Are you sure you want to disconnect Foodics? This will remove the integration.")}
      confirmLabel={t("foodics.disconnect", "Disconnect")}
      cancelLabel={t("common.cancel", "Cancel")}
      onConfirm={() => { setShowDisconnectConfirm(false); void handleDisconnect(); }}
    />
    </>
  );
}
