"use client";

/**
 * Customer Island — Compliance & Settings views (parity ports of the OLD
 * project's pages/apps/store-intelligence/{compliance,settings}.tsx).
 *
 * Compliance (old behavior replicated):
 *  - reads from/to/branch_id from the URL (shared island filters)
 *  - compliance score ring, PPE breakdown donut, phone-incident summary
 *  - PPE-by-hour and phone-usage-by-hour bar charts
 *  - loading skeletons per card, error alert with the API message
 *
 * Settings (old behavior replicated):
 *  - no filters; loads once on mount
 *  - queue-threshold slider (1–20) + two alert toggles
 *  - "no telegram configured" warning when has_telegram_setting is false
 *  - save button is enabled only when the form is dirty; success toast
 *  - update gated behind the `island` update permission (old <Can> wrapper)
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle,
  BellRing,
  Save,
  ShieldCheck,
  SmartphoneNfc,
  UserX,
  Users,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import IslandHeader from "@/components/customer-island/IslandHeader";
import {
  IslandError,
  IslandGuard,
  useIslandData,
} from "@/views/customer-island/IslandViews";
import {
  islandService,
  type IslandComplianceData,
  type IslandSettings,
} from "@/services/islandService";

/* ─── Compliance ───────────────────────────────────────────────────────── */

const PPE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export function IslandComplianceView() {
  const { t } = useTranslation();
  const { data, loading, error, load } = useIslandData<IslandComplianceData>(
    (f) => islandService.compliance(f)
  );

  const score = data?.compliance_score ?? 0;
  // Old project's threshold colors: >=90 success, >=70 warning, else error.
  const scoreColor =
    score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  const ppeDonut = React.useMemo(
    () => [
      {
        name: t("island.compliance.noGlove", "No Glove"),
        value: data?.ppe_breakdown?.no_glove ?? 0,
        color: PPE_COLORS[0],
      },
      {
        name: t("island.compliance.noMask", "No Mask"),
        value: data?.ppe_breakdown?.no_mask ?? 0,
        color: PPE_COLORS[1],
      },
      {
        name: t("island.compliance.noHairnet", "No Hairnet"),
        value: data?.ppe_breakdown?.no_hairnet ?? 0,
        color: PPE_COLORS[2],
      },
      {
        name: t("island.compliance.otherPpe", "Other"),
        value: data?.ppe_breakdown?.other ?? 0,
        color: PPE_COLORS[3],
      },
    ],
    [data, t]
  );

  const ppeHourly = React.useMemo(
    () =>
      (data?.ppe_hourly ?? []).map((h) => ({
        hour: `${String(h.hour).padStart(2, "0")}:00`,
        count: h.count,
      })),
    [data]
  );

  const phoneHourly = React.useMemo(
    () =>
      (data?.phone_hourly ?? []).map((h) => ({
        hour: `${String(h.hour).padStart(2, "0")}:00`,
        count: h.count,
      })),
    [data]
  );

  const hasPpe = (data?.ppe_violations_total ?? 0) > 0;

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader
          onRefresh={load}
          refreshing={loading}
        />
        <IslandError message={error} />

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Compliance score ring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.compliance.score", "Compliance Score")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {loading ? (
                <Skeleton className="h-40 w-40 rounded-full" />
              ) : (
                <div
                  className="flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${scoreColor} ${score * 3.6}deg, var(--muted) 0deg)`,
                  }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-card">
                    <span
                      className="text-4xl font-extrabold"
                      style={{ color: scoreColor }}
                    >
                      {score}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PPE breakdown donut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.compliance.ppeViolations", "PPE Violations")}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({data?.ppe_violations_total ?? 0}{" "}
                  {t("island.compliance.violationsCount", "violations")})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : hasPpe ? (
                <ResponsiveContainer
                  width="100%"
                  height={240}
                >
                  <PieChart>
                    <Pie
                      data={ppeDonut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {ppeDonut.map((d) => (
                        <Cell
                          key={d.name}
                          fill={d.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <ShieldCheck className="h-12 w-12 text-emerald-500" />
                  <p className="text-sm text-emerald-600">
                    {t("island.compliance.noViolations", "No violations found")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone incidents summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.compliance.phoneIncidents", "Phone Incidents")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <div
                    className="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl text-white"
                    style={{
                      background:
                        (data?.phone_incidents_total ?? 0) > 0
                          ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                          : "linear-gradient(135deg, #10b981, #34d399)",
                    }}
                  >
                    <SmartphoneNfc className="h-9 w-9" />
                  </div>
                  <span className="text-4xl font-extrabold">
                    {data?.phone_incidents_total ?? 0}
                  </span>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {t("island.compliance.phoneIncidents", "Phone Incidents")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* PPE violations by hour */}
          <Card className="lg:col-span-1 lg:col-start-1 lg:row-start-2 lg:col-end-2 lg:!col-span-3 lg:!col-end-3 xl:!col-span-1">
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.compliance.ppeByHour", "PPE Violations by Hour")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <ComposedChart data={ppeHourly}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="hour"
                      fontSize={11}
                      interval={1}
                    />
                    <YAxis
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name={t(
                        "island.compliance.ppeViolations",
                        "PPE Violations"
                      )}
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Phone usage by hour */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.compliance.phoneByHour", "Phone Usage by Hour")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <ComposedChart data={phoneHourly}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="hour"
                      fontSize={11}
                      interval={1}
                    />
                    <YAxis
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name={t(
                        "island.compliance.phoneIncidents",
                        "Phone Incidents"
                      )}
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </IslandGuard>
  );
}

/* ─── Settings ─────────────────────────────────────────────────────────── */

export function IslandSettingsView() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("island");

  const [settings, setSettings] = React.useState<IslandSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Local editable copy (old project kept threshold + two toggles in state)
  const [queueThreshold, setQueueThreshold] = React.useState(5);
  const [queueAlert, setQueueAlert] = React.useState(true);
  const [absentAlert, setAbsentAlert] = React.useState(true);
  const [dirty, setDirty] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await islandService.settings();
      setSettings(s);
      setQueueThreshold(s.store_queue_threshold);
      setQueueAlert(s.store_queue_alert_enabled);
      setAbsentAlert(s.store_employee_absent_alert_enabled);
      setDirty(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to fetch store settings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await islandService.updateSettings({
        store_queue_threshold: queueThreshold,
        store_queue_alert_enabled: queueAlert,
        store_employee_absent_alert_enabled: absentAlert,
      });
      setSettings((prev) => ({
        ...(prev ?? ({} as IslandSettings)),
        ...updated,
      }));
      setDirty(false);
      toast.success(t("island.settings.saved", "Settings saved successfully"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("island.settings.saveError", "Failed to update settings")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <IslandGuard>
      <div className="p-4 sm:p-6">
        <IslandHeader
          onRefresh={load}
          refreshing={loading}
        />
        <IslandError message={error} />

        {/* No-telegram warning (old project showed this when unset) */}
        {settings && !settings.has_telegram_setting && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t(
              "island.settings.noTelegramWarning",
              "No Telegram integration configured — alerts won't be delivered until it's set up."
            )}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Queue threshold */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                {t("island.settings.queueThreshold", "Queue Threshold")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "island.settings.queueThresholdHelp",
                      "Trigger a queue alert when the number of waiting customers reaches this value."
                    )}
                  </p>
                  <div className="text-center">
                    <span className="text-5xl font-extrabold">
                      {queueThreshold}
                    </span>
                    <span className="ms-2 text-base text-muted-foreground">
                      {t("island.settings.people", "people")}
                    </span>
                  </div>
                  <Slider
                    value={[queueThreshold]}
                    min={1}
                    max={20}
                    step={1}
                    disabled={!canUpdate}
                    onValueChange={(v) => {
                      setQueueThreshold(v[0]);
                      setDirty(true);
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("island.settings.alerts", "Alerts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="space-y-4">
                  {/* Queue alert toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                        style={{
                          background: queueAlert
                            ? "linear-gradient(135deg, #ef4444, #f59e0b)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        <BellRing className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {t("island.settings.queueAlert", "Queue Alert")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "island.settings.queueAlertHelp",
                            "Notify when the queue threshold is exceeded."
                          )}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={queueAlert}
                      disabled={!canUpdate}
                      onCheckedChange={(c) => {
                        setQueueAlert(c);
                        setDirty(true);
                      }}
                    />
                  </div>

                  {/* Employee absent alert toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                        style={{
                          background: absentAlert
                            ? "linear-gradient(135deg, #06b6d4, #4f46e5)"
                            : "var(--muted-foreground)",
                        }}
                      >
                        <UserX className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {t(
                            "island.settings.absentAlert",
                            "Employee Absent Alert"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            "island.settings.absentAlertHelp",
                            "Notify when no employee is present at the island."
                          )}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={absentAlert}
                      disabled={!canUpdate}
                      onCheckedChange={(c) => {
                        setAbsentAlert(c);
                        setDirty(true);
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Save button — only rendered/enabled when the user can update */}
        {canUpdate && (
          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              disabled={!dirty || saving || loading}
              onClick={handleSave}
            >
              <Save className="me-2 h-4 w-4" />
              {saving
                ? t("common.saving", "Saving…")
                : t("island.settings.save", "Save Settings")}
            </Button>
          </div>
        )}
      </div>
    </IslandGuard>
  );
}
