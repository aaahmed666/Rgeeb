"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Brain,
  Search,
  Plus,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Camera,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  RefreshCcw,
  Hand,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react";

import {
  HardHatIcon,
  ChefHatIcon,
  LockIcon as LockServiceIcon,
  FlameIcon,
  CigaretteIcon,
  DropletsIcon,
  UsersIcon as AiUsersIcon,
  ActivityIcon as AiActivityIcon,
  TrendingUpIcon as AiTrendingUpIcon,
  UserCheckIcon as AiUserCheckIcon,
  ScanFaceIcon,
  AlignJustifyIcon,
  ClockIcon as AiClockIcon,
  CreditCardIcon as AiCreditCardIcon,
  UtensilsCrossedIcon,
  CoffeeIcon,
  TruckIcon,
  CarIcon,
  ReceiptIcon,
  SandwichIcon,
  NavigationIcon,
  IdCardIcon,
  EyeIcon,
  RadioIcon,
  BoxIcon,
  AlertOctagonIcon,
  PersonStandingIcon,
  SearchPersonIcon,
  BusIcon,
} from "@/components/ai-service-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SharedDateRangePicker from "@/components/Shareddaterangepicker";
import type { DateRange } from "rsuite/DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AsyncPaginatedSelect } from "@/components/AsyncPaginatedSelect";
import { useAuth } from "@/lib/auth";
import { dashboardService, invalidateDashboardCache } from "@/services/dashboardService";
import type {
  AIServiceItem,
  AttendanceData,
  BranchSummary,
  ComplianceData,
  DashboardSummary,
  DetectionBreakdownItem,
  LiveActivity,
  TaskSummary,
  VisitorFlowPoint,
} from "@/services/dashboardService";

const AI_CATEGORIES: Array<{
  key: "all" | AIServiceItem["category"];
  labelKey: string;
}> = [
  { key: "all", labelKey: "aiServices.all" },
  { key: "safety", labelKey: "aiServices.safety" },
  { key: "analytics", labelKey: "aiServices.analytics" },
  { key: "operations", labelKey: "aiServices.operations" },
  { key: "monitoring", labelKey: "aiServices.monitoring" },
];

const CATEGORY_COLORS: Record<AIServiceItem["category"], string> = {
  safety: "from-rose-500 to-red-500",
  analytics: "from-indigo-500 to-blue-500",
  operations: "from-amber-500 to-orange-500",
  monitoring: "from-emerald-500 to-teal-500",
};

// Maps API service key → custom icon component
const SERVICE_ICON_MAP: Record<string, React.ElementType> = {
  age_gender: AiUsersIcon,
  attendance: AiUserCheckIcon,
  behavior: AiActivityIcon,
  cash_register: AiCreditCardIcon,
  clean_tables: UtensilsCrossedIcon,
  cup_counting: CoffeeIcon,
  customer_traffic: AiTrendingUpIcon,
  delivery_tracking: TruckIcon,
  drive_thru: CarIcon,
  face_detection: ScanFaceIcon,
  fire_detection: FlameIcon,
  gate_monitoring: NavigationIcon,
  helmet: HardHatIcon,
  kitchen_ppe: ChefHatIcon,
  license_plate: IdCardIcon,
  mask: EyeIcon,
  motion: RadioIcon,
  object: BoxIcon,
  overcrowd: AlertOctagonIcon,
  people_counting: PersonStandingIcon,
  person: SearchPersonIcon,
  queue: AlignJustifyIcon,
  receipt: ReceiptIcon,
  restricted: LockServiceIcon,
  sandwich: SandwichIcon,
  smoking: CigaretteIcon,
  spill: DropletsIcon,
  vehicle: BusIcon,
  waiting: AiClockIcon,
};

// Maps API service key → {category slug, page slug}
const SERVICE_KEY_MAP: Record<string, { cat: string; slug: string }> = {
  age_gender: { cat: "analytics", slug: "age-gender" },
  attendance: { cat: "analytics", slug: "face-attendance" },
  behavior: { cat: "analytics", slug: "behavior-analysis" },
  cash_register: { cat: "operations", slug: "cash-register" },
  clean_tables: { cat: "operations", slug: "clean-tables" },
  cup_counting: { cat: "analytics", slug: "cup-counting" },
  customer_traffic: { cat: "analytics", slug: "customer-traffic" },
  delivery_tracking: { cat: "operations", slug: "delivery-tracking" },
  drive_thru: { cat: "operations", slug: "drive-thru" },
  face_detection: { cat: "analytics", slug: "face-detection" },
  fire_detection: { cat: "safety", slug: "smoke-fire" },
  gate_monitoring: { cat: "monitoring", slug: "gate-monitoring" },
  helmet: { cat: "safety", slug: "helmet-detection" },
  kitchen_ppe: { cat: "safety", slug: "kitchen-ppe" },
  license_plate: { cat: "monitoring", slug: "license-plate" },
  mask: { cat: "monitoring", slug: "mask-detection" },
  motion: { cat: "monitoring", slug: "motion-detection" },
  object: { cat: "monitoring", slug: "object-detection" },
  overcrowd: { cat: "monitoring", slug: "overcrowd-violation" },
  people_counting: { cat: "monitoring", slug: "people-counting" },
  person: { cat: "monitoring", slug: "person-detection" },
  queue: { cat: "analytics", slug: "queue-management" },
  receipt: { cat: "operations", slug: "receipt-detection" },
  restricted: { cat: "safety", slug: "restricted-area" },
  sandwich: { cat: "operations", slug: "sandwich-counting" },
  smoking: { cat: "safety", slug: "smoking-detection" },
  spill: { cat: "safety", slug: "spill-detection" },
  vehicle: { cat: "monitoring", slug: "vehicle-tracking" },
  waiting: { cat: "analytics", slug: "waiting-customer" },
};

function serviceHref(s: AIServiceItem): string {
  const mapped = SERVICE_KEY_MAP[s.key];
  if (mapped) return `/dashboard/ai-services/${mapped.cat}/${mapped.slug}`;
  // fallback: use category + slugified name
  const slug = s.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `/dashboard/ai-services/${s.category}/${slug}`;
}

export default function DashboardView() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = useAuth();
  const { user } = useAuth();

  // useMemo so todayStr is computed once per mount, not on every render
  const today = React.useMemo(() => new Date(), []);
  const todayStr = today.toISOString().slice(0, 10);
  const [dateRange, setDateRange] = React.useState<DateRange | null>([
    today,
    today,
  ]);
  const from = dateRange?.[0]?.toISOString().slice(0, 10) ?? todayStr;
  const to = dateRange?.[1]?.toISOString().slice(0, 10) ?? todayStr;
  const [branchId, setBranchId] = React.useState<string>("all");

  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [services, setServices] = React.useState<AIServiceItem[]>([]);
  const [tasks, setTasks] = React.useState<TaskSummary | null>(null);
  const [flow, setFlow] = React.useState<VisitorFlowPoint[]>([]);
  const [activity, setActivity] = React.useState<LiveActivity[]>([]);
  const [attendance, setAttendance] = React.useState<AttendanceData | null>(
    null
  );
  const [compliance, setCompliance] = React.useState<ComplianceData | null>(
    null
  );
  const [breakdown, setBreakdown] = React.useState<DetectionBreakdownItem[]>(
    []
  );
  const [branches, setBranches] = React.useState<BranchSummary[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [assignedToMe, setAssignedToMe] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [category, setCategory] = React.useState<
    "all" | AIServiceItem["category"]
  >("all");
  const [serviceQuery, setServiceQuery] = React.useState("");
  const [showAllServices, setShowAllServices] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const filters = {
      from,
      to,
      branchId: branchId === "all" ? undefined : branchId,
    };
    // getUnreadNotifications is handled by the polling interval below — skip here
    const [s, ai, tk, vf, la, at, co, bd, br] = await Promise.all([
      dashboardService.getSummary(filters),
      dashboardService.listAIServices(filters),
      dashboardService.getTaskSummary({ ...filters, assignedToMe }),
      dashboardService.getVisitorFlow(filters),
      dashboardService.getLiveActivity(filters),
      dashboardService.getAttendance(filters),
      dashboardService.getCompliance(filters),
      dashboardService.getDetectionBreakdown(filters),
      dashboardService.getBranches(filters),
    ]);
    setSummary(s);
    setServices(ai);
    setTasks(tk);
    setFlow(vf);
    setActivity(la);
    setAttendance(at);
    setCompliance(co);
    setBreakdown(bd);
    setBranches(br);
    setLoading(false);
  }, [from, to, branchId, assignedToMe]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Poll unread-count every 60s (initial fetch on mount, then every minute)
  React.useEffect(() => {
    // Fetch immediately on mount
    dashboardService.getUnreadNotifications().then(setUnread);
    // Then poll every 60s
    const t = setInterval(() => {
      dashboardService.getUnreadNotifications().then(setUnread);
    }, 60_000);
    return () => clearInterval(t);
  }, []); // empty deps → runs once, cleans up on unmount

  const displayName = user?.name ?? "there";

  const filteredServices = React.useMemo(() => {
    let list = services;
    if (category !== "all") list = list.filter((s) => s.category === category);
    if (serviceQuery.trim()) {
      const q = serviceQuery.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [services, category, serviceQuery]);

  const visibleServices = showAllServices
    ? filteredServices
    : filteredServices.slice(0, 24);
  const visitorIn = flow.reduce((acc, p) => acc + p.in, 0);
  const visitorOut = flow.reduce((acc, p) => acc + p.out, 0);
  const maxFlow = Math.max(1, ...flow.map((p) => p.in));

  // Read guard handled via auth aliases — isAdmin bypasses all

  return (
    <div
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      data-tour="dashboard-content"
    >
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#a855f7] p-6 text-white shadow-xl">
        <div className="absolute -end-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">
                {t("dashboard.welcome", { name: displayName })}
              </h1>
              <Hand className="h-7 w-7 -rotate-12" />
            </div>
            <p className="text-sm opacity-90">
              {t("dashboard.realtimeOverview")}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/20 px-3 py-1 font-medium backdrop-blur">
                {summary?.cameras.online}/{summary?.cameras.total}{" "}
                {t("dashboard.cameras")}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 font-medium backdrop-blur">
                {summary?.aiServicesActive} {t("dashboard.aiActive")}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 font-medium backdrop-blur">
                {summary?.detections} {t("dashboard.detections")}
              </span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500/90 px-3 py-1 font-semibold">
                  {unread} {t("dashboard.unread")}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 text-foreground">
            <div className="flex flex-col text-xs">
              <span className="mb-1 font-medium text-white/80">
                {t("dashboard.dateRange", "Date Range")}
              </span>
              <SharedDateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={t(
                  "dashboard.selectDateRange",
                  "Select Date Range"
                )}
              />
            </div>
            <div className="flex flex-col text-xs">
              <span className="mb-1 font-medium text-white/80">
                {t("dashboard.branch")}
              </span>
              <AsyncPaginatedSelect
                  endpoint="/customer/branches"
                  labelKey="name"
                  valueKey="id"
                  extraParams={{ active: 1 }}
                  value={branchId === "all" ? null : branchId}
                  onChange={(v) => setBranchId(v ?? "all")}
                  placeholder="All Branches"
                  isClearable
                />
            </div>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => {
                invalidateDashboardCache({ from, to, branchId: branchId === "all" ? undefined : branchId });
                load();
              }}
              disabled={loading}
              className="h-9 w-9"
              aria-label={t("common.refresh")}
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </section>

      {/* AI Services Hub */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold">
                {t("dashboard.aiServicesHub")}
              </h2>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
              >
                {services.length} {t("aiServices.activeShort")}
              </Badge>
            </div>
            <div className="relative w-full max-w-[260px]">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                placeholder={t("aiServices.searchPlaceholder")}
                className="ps-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b">
            {AI_CATEGORIES.map((c) => {
              const count =
                c.key === "all"
                  ? services.length
                  : services.filter((s) => s.category === c.key).length;
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`relative -mb-px px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(c.labelKey)} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {visibleServices.map((s) => {
              const inactive = s.status !== "active";
              const ServiceIcon = SERVICE_ICON_MAP[s.key] ?? Brain;
              return (
                <Link
                  key={s.id}
                  href={serviceHref(s)}
                  className={`group relative flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 ${
                    inactive ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[s.category]} text-white`}
                  >
                    <ServiceIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{s.name}</p>
                    <p className="text-[10px] capitalize text-muted-foreground">
                      {inactive
                        ? t("aiServices.inactive")
                        : t("aiServices.activeShort")}
                    </p>
                  </div>
                  {!!s.detections && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold"
                    >
                      {s.detections}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {filteredServices.length > 24 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllServices((v) => !v)}
                className="gap-1.5"
              >
                {showAllServices ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {showAllServices
                  ? t("aiServices.showLess")
                  : t("aiServices.showAll", { n: filteredServices.length })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Intelligence */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ListChecks className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold">
                {t("dashboard.taskIntelligence")}
              </h2>
              <Badge variant="secondary">
                {tasks?.total ?? 0} {t("dashboard.total")}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> {t("dashboard.createTask")}
              </Button>
              <Button
                size="sm"
                variant={assignedToMe ? "default" : "outline"}
                onClick={() => setAssignedToMe((v) => !v)}
                className="gap-1.5"
              >
                <UserCheck className="h-4 w-4" /> {t("dashboard.myTasks")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <TaskMetric
              icon={ListChecks}
              label={t("dashboard.openTasks")}
              value={tasks?.open ?? 0}
              gradient="from-blue-500 to-indigo-600"
            />
            <TaskMetric
              icon={Clock}
              label={t("dashboard.inProgress")}
              value={tasks?.inProgress ?? 0}
              gradient="from-amber-500 to-orange-600"
            />
            <TaskMetric
              icon={AlertTriangle}
              label={t("dashboard.overdue")}
              value={tasks?.overdue ?? 0}
              gradient="from-rose-500 to-red-600"
            />
            <TaskMetric
              icon={CheckCircle2}
              label={t("dashboard.completionRate")}
              value={`${tasks?.completionRate ?? 0}%`}
              gradient="from-rose-600 to-red-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visitor Flow + Live Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">
                  {t("dashboard.visitorFlow")}
                </h3>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="font-semibold text-emerald-600">
                  ↑ {visitorIn} {t("dashboard.in")}
                </span>
                <span className="font-semibold text-rose-600">
                  ↓ {visitorOut} {t("dashboard.out")}
                </span>
              </div>
            </div>
            <div className="flex h-64 items-end gap-1.5">
              {flow.map((p) => {
                const h = (p.in / maxFlow) * 100;
                return (
                  <div
                    key={p.hour}
                    className="group relative flex flex-1 flex-col items-center"
                  >
                    <span className="absolute -top-5 text-[10px] font-semibold text-muted-foreground">
                      {p.in}
                    </span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-purple-500 transition-all hover:opacity-80"
                      style={{ height: `${h}%` }}
                      title={`${p.hour}:00 — ${p.in} in / ${p.out} out`}
                    />
                    <span className="mt-1 text-[9px] text-muted-foreground">
                      {p.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">
                  {t("dashboard.liveActivity")}
                </h3>
                <Badge variant="secondary">{activity.length}</Badge>
              </div>
              <Badge className="gap-1 bg-red-500/15 text-red-500 hover:bg-red-500/20">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                LIVE
              </Badge>
            </div>
            <ul className="max-h-72 space-y-2 overflow-y-auto pe-1">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 text-sm ${
                    a.severity === "critical"
                      ? "border-rose-500/30 bg-rose-500/5"
                      : a.severity === "warning"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border bg-muted/30"
                  }`}
                >
                  <div className="rounded-full bg-background p-1.5">
                    <BellIcon severity={a.severity} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{a.type}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {a.source} · {a.branch}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {a.agoSeconds}s ago
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {a.timestamp}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Attendance + Compliance + Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">
                {t("dashboard.employeeAttendance")}
              </h3>
            </div>
            <div className="flex items-center gap-5">
              <Donut
                value={
                  attendance && attendance.total > 0
                    ? (attendance.checkedIn / attendance.total) * 100
                    : 0
                }
                label={`${attendance?.total ?? 0} ${t("dashboard.total")}`}
                color="oklch(0.72 0.18 50)"
              />
              <ul className="flex-1 space-y-2 text-sm">
                <AttendanceRow
                  label={t("dashboard.checkedIn")}
                  value={attendance?.checkedIn ?? 0}
                />
                <AttendanceRow
                  label={t("dashboard.present")}
                  value={attendance?.present ?? 0}
                />
                <AttendanceRow
                  label={t("dashboard.checkedOut")}
                  value={attendance?.checkedOut ?? 0}
                />
                <AttendanceRow
                  label={t("dashboard.absent")}
                  value={attendance?.absent ?? 0}
                />
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">
                {t("dashboard.complianceScore")}
              </h3>
            </div>
            <div className="flex items-center gap-5">
              <Donut
                value={compliance?.score ?? 0}
                label={t("dashboard.needsImprovement")}
                color={
                  (compliance?.score ?? 0) >= 90
                    ? "oklch(0.7 0.16 145)"
                    : (compliance?.score ?? 0) >= 60
                      ? "oklch(0.78 0.175 60)"
                      : "oklch(0.65 0.2 25)"
                }
                centerText={`${compliance?.score ?? 0}%`}
              />
              <ul className="flex-1 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("dashboard.totalDetections")}
                  </span>
                  <span className="font-semibold">
                    {compliance?.totalDetections ?? 0}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("dashboard.violations")}
                  </span>
                  <span className="font-semibold text-rose-600">
                    {compliance?.violations ?? 0}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("dashboard.clean")}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {compliance?.clean ?? 0}
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">
                {t("dashboard.aiDetectionBreakdown")}
              </h3>
            </div>
            <ul className="space-y-3">
              {breakdown.map((b) => (
                <li
                  key={b.key}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: b.color }}
                      />
                      {b.label}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {b.count} ({b.percent}%)
                    </span>
                  </div>
                  <Progress
                    value={b.percent}
                    className="h-1.5"
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Branch Comparison + Camera Network */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold">
                <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle
                      cx="12"
                      cy="10"
                      r="3"
                    />
                  </svg>
                </span>
                {t("dashboard.branchComparison")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.branchComparisonSubtitle")}
              </p>
            </div>
            <Badge variant="outline">
              {branches.length} {t("dashboard.branches")}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {branches.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">📍 {b.name}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold">
                    {b.grade}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("dashboard.cameras").toUpperCase()}
                    </span>
                    <span className="font-medium">
                      {b.camerasOnline}/{b.camerasTotal}
                    </span>
                  </div>
                  <Progress
                    value={
                      b.camerasTotal
                        ? (b.camerasOnline / b.camerasTotal) * 100
                        : 0
                    }
                    className="h-1.5"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-muted-foreground">
                      {t("dashboard.activity").toUpperCase()}
                    </span>
                    <span className="font-medium">
                      {b.detections} {t("dashboard.detectionsShort")}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, b.detections * 10)}
                    className="h-1.5 [&>div]:bg-rose-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold">
                {t("dashboard.cameraNetwork")}
              </h3>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            >
              {summary?.cameras.online ?? 0} {t("dashboard.online")}
            </Badge>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: `${summary && summary.cameras.total ? (summary.cameras.online / summary.cameras.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {summary && summary.cameras.total
              ? Math.round(
                  (summary.cameras.online / summary.cameras.total) * 100
                )
              : 0}
            % {t("dashboard.camerasOnline")} — {summary?.cameras.total ?? 0}{" "}
            {t("dashboard.total")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {branches.map((b) => (
              <Badge
                key={b.id}
                variant="outline"
                className="gap-1.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {b.name} ({b.camerasTotal})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {new Date().toLocaleString(i18n.resolvedLanguage ?? "en")}
      </p>
    </div>
  );
}

/* ----------------------- small subcomponents ----------------------- */

function TaskMetric({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4 text-white shadow-md`}
    >
      <Icon className="absolute end-3 top-3 h-5 w-5 opacity-50" />
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-90">{label}</p>
    </div>
  );
}

function AttendanceRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
  );
}

function Donut({
  value,
  label,
  color,
  centerText,
}: {
  value: number;
  label: string;
  color: string;
  centerText?: string;
}) {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="var(--muted)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold">
          {centerText ?? `${Math.round(value)}%`}
        </span>
        <span className="px-2 text-[10px] leading-tight text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

function BellIcon({ severity }: { severity?: LiveActivity["severity"] }) {
  const color =
    severity === "critical"
      ? "text-rose-500"
      : severity === "warning"
        ? "text-amber-500"
        : "text-indigo-500";
  return <Activity className={`h-3 w-3 ${color}`} />;
}
