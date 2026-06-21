"use client";
import { useTranslation } from "react-i18next";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plug,
  RefreshCw,
  Unlink,
  AlertCircle } from "lucide-react";
import { foodicsService, FoodicsStatus } from "@/services/foodicsService";
import { useAuth } from "@/lib/auth";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { usePermission } from "@/hooks/usePermission";

const SERVICE_ICONS = [
  {
    key: "foodics_api",
    label: "Foodics API Connection",
    desc: "Connected & authenticated",
  },
  {
    key: "health_endpoint",
    label: "Health Endpoint",
    desc: "Responding normally",
  },
  { key: "order_sync", label: "Order Sync", desc: "Ready for sync" },
  {
    key: "ai_workers",
    label: "AI Workers",
    desc: "Refund, Drawer, PrepTime, Inventory pipelines configured",
  },
  {
    key: "webhook_receiver",
    label: "Webhook Receiver",
    desc: "Listening for events",
  },
  {
    key: "bridge_api",
    label: "Bridge API (AI)",
    desc: "Stock audit & snapshot endpoints configured",
  },
];

export default function FoodicsConnectionPage() {
  const can = usePermission("foodics");
  const [showDisconnectConfirm, setShowDisconnectConfirm] = React.useState(false);
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<FoodicsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await foodicsService.getStatus();
      setStatus(data);
    } catch {
      setError("Failed to load connection status.");
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
        setError("Failed to initiate connection.");
        setConnecting(false);
      }
    } catch {
      setError("Failed to initiate connection.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await foodicsService.disconnect();
      await fetchStatus();
    } catch {
      setError("Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  const operationalCount = status
    ? Object.values(status.services ?? {}).filter(Boolean).length
    : 0;
  const totalServices = SERVICE_ICONS.length;
  const healthPct = status
    ? Math.round((operationalCount / totalServices) * 100)
    : 0;

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
              {
                label: "Order Sync",
                color:
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
              },
              {
                label: "Refund Audit",
                color:
                  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
              },
              {
                label: "Drawer Monitor",
                color:
                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
              },
              {
                label: "AI Analytics",
                color:
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
              },
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
            Connect to Foodics
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
          Access Denied
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have permission to view Foodics Connection.
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
              stroke="currentColor"
              strokeWidth="8"
              className="text-green-500"
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
          <h2 className="text-xl font-bold text-card-foreground">
            System Health
          </h2>
          <p className="text-sm text-muted-foreground">
            {operationalCount}/{totalServices} {t("foodics.connectionStatus")}
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
            Refresh
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
            Disconnect
          </button>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_ICONS.map((svc) => {
          const isUp =
            status?.services?.[svc.key as keyof typeof status.services];
          return (
            <div
              key={svc.key}
              className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isUp
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <CheckCircle2
                  className={`w-5 h-5 ${isUp ? "text-green-600" : "text-red-500"}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${isUp ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <p className="text-sm font-semibold text-card-foreground">
                    {svc.label}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {svc.desc}
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
          Connection Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-32">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold">
              Connected
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-32">Connected At</span>
            <span className="text-card-foreground">
              {status?.connected_at ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-32">Business ID</span>
            <span className="text-card-foreground font-mono text-xs">
              {status?.business_id ?? "—"}
            </span>
          </div>
          {status?.business_name && (
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-32">Business Name</span>
              <span className="text-card-foreground">
                {status.business_name}
              </span>
            </div>
          )}
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
