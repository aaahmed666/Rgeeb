"use client";

/**
 * ClientLifecyclePreviewDialog
 *
 * A read-only "Customer Lifecycle" preview shown from the admin Clients table
 * (row menu → Preview). It reproduces the standalone CRM profile mockup: a dark
 * navy rail, bronze accent, customer header, KPI cards, a lifecycle progress
 * strip, a tabbed detail area (Overview / Branches / Cameras / AI Services /
 * Modules / Integrations) and an Activity Timeline rail.
 *
 * Every control is wired: the top tabs, the detail tabs and the KPI cards all
 * drive the same active tab; action buttons emit a toast so they give feedback;
 * the search box filters the active tab's list. All figures are representative
 * preview data (the customer name comes from the selected client).
 */

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LayoutGrid,
  Users,
  BrainCircuit,
  Rocket,
  ShieldCheck,
  Settings,
  HelpCircle,
  UserCircle2,
  Zap,
  Search,
  MapPin,
  Video,
  Cpu,
  Boxes,
  Plug,
  Crown,
  Check,
  CalendarDays,
  History,
  CheckCircle2,
  Circle,
} from "lucide-react";

export interface ClientPreviewData {
  name: string;
  segment?: string;
  activeSince?: string;
}

type TabKey =
  | "Overview"
  | "Branches"
  | "Cameras"
  | "AI Services"
  | "Modules"
  | "Integrations";

/* ── scoped palette (matches the mockup, independent of app theme) ── */
const NAVY = "#0e1b2e";
const NAVY_SOFT = "#16273c";
const BRONZE = "#9c6f43";
const BRONZE_SOFT = "#f1e7dc";

/* ──────────────────────────────────────────────────────────────────────────
 * DUMMY DATA — hard-coded for now.
 *
 * Everything below mirrors the CRM dashboard mockup so each client's Preview
 * shows a complete, representative profile across all tabs without a backend.
 * Replace these arrays with a real per-client CRM API response when the backend
 * exposes that data (only `customerName` is wired to the selected client today).
 * ────────────────────────────────────────────────────────────────────────── */

const navItems = [
  { icon: LayoutGrid, label: "Dashboard" },
  { icon: Users, label: "Customers", active: true },
  { icon: BrainCircuit, label: "AI Analytics" },
  { icon: Rocket, label: "Deployments" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Settings, label: "Settings" },
];

const kpis: { label: string; value: string; sub?: string; icon: typeof Crown; tab?: TabKey }[] = [
  { label: "Active Sub", value: "Premium", icon: Crown },
  { label: "Branches", value: "12", icon: MapPin, tab: "Branches" },
  { label: "Cameras", value: "480", icon: Video, tab: "Cameras" },
  { label: "AI Services", value: "8", sub: "Active", icon: Cpu, tab: "AI Services" },
  { label: "Modules", value: "5", sub: "Active", icon: Boxes, tab: "Modules" },
  { label: "Integrations", value: "3", sub: "Active", icon: Plug, tab: "Integrations" },
];

const lifecycle = ["Requirements", "Onboarding", "Camera Setup", "Integrations", "AI Config"];

const branchesData = [
  { name: "Dubai Mall", area: "Downtown Dubai, UAE", cameras: 124, streams: 86, status: "Operational" },
  { name: "Mall of Emirates", area: "Al Barsha, Dubai", cameras: 98, streams: 72, status: "Operational" },
  { name: "JBR Branch", area: "The Walk, Dubai", cameras: 45, streams: 30, status: "Maintenance" },
  { name: "Marina Walk", area: "Dubai Marina", cameras: 60, streams: 40, status: "Operational" },
  { name: "Festival City", area: "Dubai Festival City", cameras: 88, streams: 54, status: "Operational" },
  { name: "Deira City Centre", area: "Deira, Dubai", cameras: 65, streams: 38, status: "Offline" },
];

const camerasData = [
  { id: "CAM-001", name: "Entrance North", branch: "Dubai Mall", type: "Queue", status: "Online" },
  { id: "CAM-014", name: "Checkout Lane 3", branch: "Dubai Mall", type: "People Count", status: "Online" },
  { id: "CAM-022", name: "Kitchen Prep", branch: "Mall of Emirates", type: "PPE", status: "Recording" },
  { id: "CAM-031", name: "Loading Bay", branch: "Mall of Emirates", type: "Intrusion", status: "Online" },
  { id: "CAM-045", name: "Main Atrium", branch: "JBR Branch", type: "Heatmap", status: "Offline" },
  { id: "CAM-052", name: "Parking Gate", branch: "JBR Branch", type: "LPR", status: "Online" },
  { id: "CAM-067", name: "Food Court", branch: "Festival City", type: "Queue", status: "Online" },
  { id: "CAM-079", name: "Service Desk", branch: "Marina Walk", type: "People Count", status: "Recording" },
];

const aiServicesData = [
  { name: "Queue Analytics", cameras: 32, accuracy: "96%", status: "Running" },
  { name: "PPE Detection", cameras: 12, accuracy: "94%", status: "Running" },
  { name: "People Counting", cameras: 40, accuracy: "98%", status: "Running" },
  { name: "Heatmap", cameras: 18, accuracy: "91%", status: "Paused" },
  { name: "Intrusion Detection", cameras: 22, accuracy: "95%", status: "Running" },
  { name: "License Plate Recognition", cameras: 8, accuracy: "93%", status: "Running" },
];

const modulesData = [
  { name: "Task Management", since: "Oct 2023", status: "Active" },
  { name: "Escalation & Alerts", since: "Oct 2023", status: "Active" },
  { name: "Reports & Analytics", since: "Nov 2023", status: "Active" },
  { name: "AI Smart Scheduler", since: "Dec 2023", status: "Active" },
  { name: "Live Feeds", since: "Oct 2023", status: "Active" },
];

const integrationsData = [
  { name: "Odoo ERP", kind: "ERP", status: "Connected" },
  { name: "Foodics POS", kind: "Point of Sale", status: "Syncing" },
  { name: "Microsoft Teams", kind: "Notifications", status: "Connected" },
  { name: "Slack", kind: "Notifications", status: "Disconnected" },
];

const checklist = [
  { label: "RTSP Stream Verification Completed", done: true },
  { label: "Branch Staff Training Session 1", done: true },
  { label: "Odoo Integration Live", done: true },
  { label: "Foodics POS Final Sync", done: false },
];

const overviewAiServices = [
  { name: "Queue Analytics", meta: "32 Cameras Assigned", icon: Users },
  { name: "PPE Detection", meta: "12 Cameras (Kitchens)", icon: ShieldCheck },
];

const timeline = [
  { when: "Today, 09:45 AM", title: "Go Live Status Confirmed", body: "System validated for all 12 branches.", tone: "ok" as const },
  { when: "Yesterday, 02:20 PM", title: "45 New Cameras Added", body: "Expansion update for JBR Branch." },
  { when: "Oct 12, 2023", title: "Odoo Integration Setup", body: "API keys verified and sync initiated." },
  { when: "Oct 05, 2023", title: "Subscription Created", body: "Premium Tier - 12 Months Contract." },
  { when: "Oct 01, 2023", title: "Sarah Jenkins Assigned", body: "Assigned as Lead Account Manager." },
];

const detailTabs: TabKey[] = ["Overview", "Branches", "Cameras", "AI Services", "Modules", "Integrations"];
const topTabs: TabKey[] = ["Overview", "Branches", "Cameras", "AI Services"];

/* status → colour mapping (green / bronze / red) */
function statusStyle(status: string): { color: string; bg: string } {
  const ok = ["operational", "online", "running", "connected", "active"];
  const warn = ["maintenance", "syncing", "paused", "recording"];
  const s = status.toLowerCase();
  if (ok.includes(s)) return { color: "#1f9d55", bg: "#e8f6ee" };
  if (warn.includes(s)) return { color: BRONZE, bg: BRONZE_SOFT };
  return { color: "#dc2626", bg: "#fdeaea" };
}

function StatusBadge({ status }: { status: string }) {
  const { color, bg } = statusStyle(status);
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      {status}
    </span>
  );
}

function includesQuery(haystack: string[], q: string) {
  if (!q.trim()) return true;
  return haystack.join(" ").toLowerCase().includes(q.trim().toLowerCase());
}

export function ClientLifecyclePreviewDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientPreviewData | null;
}) {
  const customerName = client?.name?.trim() || "Customer";
  const segment = client?.segment || "Hypermarket";
  const since = client?.activeSince || "Oct 2023";

  const [tab, setTab] = React.useState<TabKey>("Overview");
  const [query, setQuery] = React.useState("");
  const [activeNav, setActiveNav] = React.useState("Customers");

  // Reset to a clean state each time the dialog opens.
  React.useEffect(() => {
    if (open) {
      setTab("Overview");
      setQuery("");
      setActiveNav("Customers");
    }
  }, [open]);

  const branches = branchesData.filter((b) => includesQuery([b.name, b.area, b.status], query));
  const cameras = camerasData.filter((c) => includesQuery([c.id, c.name, c.branch, c.type, c.status], query));
  const services = aiServicesData.filter((s) => includesQuery([s.name, s.status], query));
  const modules = modulesData.filter((m) => includesQuery([m.name, m.status], query));
  const integrations = integrationsData.filter((i) => includesQuery([i.name, i.kind, i.status], query));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1180px] w-[96vw] h-[88vh] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {customerName} — customer lifecycle preview
        </DialogTitle>

        <div className="flex h-full w-full overflow-hidden bg-[#f3f4f6] text-slate-800">
          {/* ── Left nav rail ── */}
          <aside
            className="hidden w-56 shrink-0 flex-col justify-between px-4 py-5 text-slate-200 md:flex"
            style={{ backgroundColor: NAVY }}
          >
            <div>
              <div className="mb-7 flex items-center gap-2.5 px-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: BRONZE }}>
                  <BrainCircuit className="h-5 w-5 text-white" />
                </span>
                <span className="leading-tight">
                  <span className="block text-base font-bold text-white">Rgeeb AI</span>
                  <span className="block text-[11px] text-slate-400">Enterprise Data</span>
                </span>
              </div>

              <nav className="space-y-1">
                {navItems.map(({ icon: Icon, label }) => {
                  const active = activeNav === label;
                  return (
                    <button
                      key={label}
                      onClick={() => {
                        setActiveNav(label);
                        if (label !== "Customers") toast(`${label} (preview)`);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                      style={active ? { backgroundColor: NAVY_SOFT, color: BRONZE, fontWeight: 600 } : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => toast.success("AI analysis started")}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: BRONZE }}
              >
                <Zap className="h-4 w-4" /> Run AI Analysis
              </button>
              <div className="space-y-1 border-t border-white/10 pt-3 text-sm text-slate-300">
                <button onClick={() => toast("Support (preview)")} className="flex w-full items-center gap-3 px-3 py-1.5 hover:text-white">
                  <HelpCircle className="h-4 w-4" /> Support
                </button>
                <button onClick={() => toast("Account (preview)")} className="flex w-full items-center gap-3 px-3 py-1.5 hover:text-white">
                  <UserCircle2 className="h-4 w-4" /> Account
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main scroll column ── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* top bar */}
            <div className="flex items-center gap-4 border-b bg-white px-5 py-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer assets..."
                  className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <nav className="hidden items-center gap-5 text-sm lg:flex">
                {topTabs.map((tt) => (
                  <button
                    key={tt}
                    onClick={() => setTab(tt)}
                    className="pb-0.5 transition-colors"
                    style={
                      tab === tt
                        ? { color: "#0f172a", fontWeight: 600, borderBottom: `2px solid ${BRONZE}` }
                        : { color: "#64748b" }
                    }
                  >
                    {tt}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex flex-1 gap-5 overflow-y-auto p-5">
              {/* center content */}
              <div className="min-w-0 flex-1 space-y-5">
                {/* customer header */}
                <div className="rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-14 items-center justify-center rounded-xl bg-gradient-to-b from-slate-200 to-slate-300">
                        <Boxes className="h-7 w-7 text-slate-500" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-extrabold leading-tight text-slate-900">{customerName}</h2>
                        <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Boxes className="h-3.5 w-3.5" /> {segment}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-sm text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" /> Since {since}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toast(`Edit ${customerName}`)}
                        className="rounded-lg border px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Edit Customer
                      </button>
                      <button
                        onClick={() => toast("Opening subscription details")}
                        className="rounded-lg border px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        View Subscription
                      </button>
                      <button
                        onClick={() => toast.success("Renewal status: on track")}
                        className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: NAVY }}
                      >
                        View Renewal Status
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI cards (clickable → switch tab) */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {kpis.map(({ label, value, sub, icon: Icon, tab: target }) => (
                    <button
                      key={label}
                      onClick={() => (target ? setTab(target) : toast(`${label}: ${value}`))}
                      className="rounded-2xl border bg-white p-4 text-left transition-shadow hover:shadow-md"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-xl font-bold text-slate-900">{value}</div>
                          {sub && <div className="text-sm font-semibold text-emerald-600">{sub}</div>}
                        </div>
                        <Icon className="h-5 w-5" style={{ color: BRONZE }} />
                      </div>
                    </button>
                  ))}
                </div>

                {/* lifecycle progress */}
                <div className="rounded-2xl border bg-white p-5">
                  <h3 className="text-lg font-bold text-slate-900">Lifecycle Progress</h3>
                  <div className="mt-6 flex items-start justify-between gap-2">
                    {lifecycle.map((step, i) => (
                      <div key={step} className="relative flex flex-1 flex-col items-center">
                        {i < lifecycle.length - 1 && (
                          <span className="absolute left-1/2 top-5 h-0.5 w-full" style={{ backgroundColor: BRONZE_SOFT }} />
                        )}
                        <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: BRONZE }}>
                          <Check className="h-5 w-5" />
                        </span>
                        <span className="mt-2 text-center text-xs font-medium text-slate-600">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* detail tabs (controlled) */}
                <div className="rounded-2xl border bg-white p-5">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
                    <TabsList className="flex w-full flex-wrap justify-start gap-5 border-b bg-transparent p-0">
                      {detailTabs.map((tk) => (
                        <TabsTrigger
                          key={tk}
                          value={tk}
                          className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2 text-sm text-slate-500 data-[state=active]:border-[#9c6f43] data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
                        >
                          {tk}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Overview */}
                    <TabsContent value="Overview" className="mt-5 space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {branches.slice(0, 3).map((b) => (
                          <div key={b.name} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-base font-bold text-slate-900">{b.name}</div>
                                <div className="text-xs text-slate-500">{b.area}</div>
                              </div>
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                                <MapPin className="h-4 w-4 text-slate-500" />
                              </span>
                            </div>
                            <div className="mt-4 space-y-1.5 text-sm">
                              <div className="flex justify-between"><span className="text-slate-500">Cameras</span><span className="font-semibold text-slate-800">{b.cameras}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500">AI Streams</span><span className="font-semibold text-slate-800">{b.streams}</span></div>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t pt-3">
                              <StatusBadge status={b.status} />
                              <button onClick={() => toast(`Opening ${b.name}`)} className="text-sm font-medium" style={{ color: BRONZE }}>
                                View ›
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border p-5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold text-slate-900">Onboarding Checklist</h4>
                            <span className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: NAVY }}>80% Done</span>
                          </div>
                          <ul className="mt-4 space-y-3">
                            {checklist.map((c) => (
                              <li key={c.label} className="flex items-center gap-2.5 text-sm">
                                {c.done ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300" />}
                                <span className={c.done ? "text-slate-700" : "text-slate-400"}>{c.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border p-5">
                          <h4 className="text-lg font-bold text-slate-900">Active AI Services</h4>
                          <div className="mt-4 space-y-3">
                            {overviewAiServices.map(({ name, meta, icon: Icon }) => (
                              <div key={name} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: BRONZE_SOFT }}>
                                    <Icon className="h-4 w-4" style={{ color: BRONZE }} />
                                  </span>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-800">{name}</div>
                                    <div className="text-xs text-slate-500">{meta}</div>
                                  </div>
                                </div>
                                <StatusBadge status="Running" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Branches */}
                    <TabsContent value="Branches" className="mt-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {branches.map((b) => (
                          <div key={b.name} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-base font-bold text-slate-900">{b.name}</div>
                                <div className="text-xs text-slate-500">{b.area}</div>
                              </div>
                              <StatusBadge status={b.status} />
                            </div>
                            <div className="mt-4 space-y-1.5 text-sm">
                              <div className="flex justify-between"><span className="text-slate-500">Cameras</span><span className="font-semibold text-slate-800">{b.cameras}</span></div>
                              <div className="flex justify-between"><span className="text-slate-500">AI Streams</span><span className="font-semibold text-slate-800">{b.streams}</span></div>
                            </div>
                            <button onClick={() => toast(`Opening ${b.name}`)} className="mt-3 w-full rounded-lg border py-2 text-sm font-medium transition-colors hover:bg-slate-50" style={{ color: BRONZE }}>
                              View branch
                            </button>
                          </div>
                        ))}
                        {branches.length === 0 && <EmptyRow label="branches" />}
                      </div>
                    </TabsContent>

                    {/* Cameras */}
                    <TabsContent value="Cameras" className="mt-5">
                      <DataRows
                        head={["Camera", "Branch", "Type", "Status"]}
                        rows={cameras.map((c) => [
                          <span key="n" className="font-medium text-slate-800">{c.name} <span className="text-xs text-slate-400">{c.id}</span></span>,
                          c.branch,
                          c.type,
                          <StatusBadge key="s" status={c.status} />,
                        ])}
                        empty={cameras.length === 0 ? "cameras" : undefined}
                      />
                    </TabsContent>

                    {/* AI Services */}
                    <TabsContent value="AI Services" className="mt-5">
                      <DataRows
                        head={["Service", "Cameras", "Accuracy", "Status"]}
                        rows={services.map((s) => [
                          <span key="n" className="font-medium text-slate-800">{s.name}</span>,
                          String(s.cameras),
                          s.accuracy,
                          <StatusBadge key="s" status={s.status} />,
                        ])}
                        empty={services.length === 0 ? "services" : undefined}
                      />
                    </TabsContent>

                    {/* Modules */}
                    <TabsContent value="Modules" className="mt-5">
                      <DataRows
                        head={["Module", "Active since", "Status"]}
                        rows={modules.map((m) => [
                          <span key="n" className="font-medium text-slate-800">{m.name}</span>,
                          m.since,
                          <StatusBadge key="s" status={m.status} />,
                        ])}
                        empty={modules.length === 0 ? "modules" : undefined}
                      />
                    </TabsContent>

                    {/* Integrations */}
                    <TabsContent value="Integrations" className="mt-5">
                      <DataRows
                        head={["Integration", "Type", "Status"]}
                        rows={integrations.map((i) => [
                          <span key="n" className="font-medium text-slate-800">{i.name}</span>,
                          i.kind,
                          <StatusBadge key="s" status={i.status} />,
                        ])}
                        empty={integrations.length === 0 ? "integrations" : undefined}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* activity timeline rail */}
              <aside className="hidden w-72 shrink-0 xl:block">
                <div className="rounded-2xl border bg-white p-5">
                  <div className="flex items-center gap-2 text-slate-900">
                    <History className="h-5 w-5" style={{ color: BRONZE }} />
                    <h3 className="text-lg font-bold">Activity Timeline</h3>
                  </div>
                  <ol className="mt-5 space-y-5">
                    {timeline.map((ev) => (
                      <li key={ev.title} className="relative ps-6">
                        <span
                          className="absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full"
                          style={{ backgroundColor: ev.tone === "ok" ? "#1f9d55" : BRONZE_SOFT }}
                        >
                          {ev.tone === "ok" && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        <div className="text-[11px] text-slate-400">{ev.when}</div>
                        <div className="text-sm font-bold text-slate-800">{ev.title}</div>
                        <div className="text-xs text-slate-500">{ev.body}</div>
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={() => toast("Opening full audit log")}
                    className="mt-5 w-full border-t pt-4 text-center text-sm font-semibold"
                    style={{ color: BRONZE }}
                  >
                    View Full Audit Log
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* simple responsive row list used by the data tabs */
function DataRows({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  if (empty) return <EmptyRow label={empty} />;
  return (
    <div className="overflow-hidden rounded-xl border">
      <div
        className="grid bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        style={{ gridTemplateColumns: `repeat(${head.length}, minmax(0, 1fr))` }}
      >
        {head.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid items-center px-4 py-3 text-sm text-slate-600 [&:not(:last-child)]:border-b"
          style={{ gridTemplateColumns: `repeat(${head.length}, minmax(0, 1fr))` }}
        >
          {r.map((cell, j) => (
            <span key={j} className="truncate pe-2">{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-slate-400">
      No {label} match your search.
    </div>
  );
}

export default ClientLifecyclePreviewDialog;
