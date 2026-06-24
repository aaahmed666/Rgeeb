"use client";

/**
 * ClientLifecyclePreviewDialog
 *
 * Per-client "Customer Lifecycle" preview opened from the admin Clients table
 * (row menu → Preview). It is fully wired to the backend:
 *
 *   GET /admin/clients/single?id={id}  (fetchAdminClientView)
 *
 * Every region renders live data — header, KPI cards, lifecycle progress, the
 * Overview / Branches / Cameras / AI Services / Modules / Integrations tabs, and
 * the Activity Timeline. Buttons are wired: Edit Customer (opens the client edit
 * dialog via onEdit), View Subscription / View Renewal Status (subscription
 * panel from the live payload), search filters the active tab, and the KPI cards
 * jump to their tab.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
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
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import {
  fetchAdminClientView,
  type AdminClientView,
} from "@/services/adminService";

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

const navItems = [
  { icon: LayoutGrid, label: "Dashboard" },
  { icon: Users, label: "Customers", active: true },
  { icon: BrainCircuit, label: "AI Analytics" },
  { icon: Rocket, label: "Deployments" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Settings, label: "Settings" },
];

const detailTabs: TabKey[] = ["Overview", "Branches", "Cameras", "AI Services", "Modules", "Integrations"];
const topTabs: TabKey[] = ["Overview", "Branches", "Cameras", "AI Services"];

function statusStyle(status?: string): { color: string; bg: string } {
  const ok = ["operational", "online", "running", "connected", "active", "completed"];
  const warn = ["maintenance", "syncing", "paused", "recording", "pending"];
  const s = (status ?? "").toLowerCase();
  if (ok.includes(s)) return { color: "#1f9d55", bg: "#e8f6ee" };
  if (warn.includes(s)) return { color: BRONZE, bg: BRONZE_SOFT };
  if (!s) return { color: "#64748b", bg: "#f1f5f9" };
  return { color: "#dc2626", bg: "#fdeaea" };
}

function StatusBadge({ status }: { status?: string }) {
  const { color, bg } = statusStyle(status);
  return (
    <span className="rounded-md px-2 py-0.5 text-xs font-semibold capitalize" style={{ color, backgroundColor: bg }}>
      {status || "—"}
    </span>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString();
}

function has(haystack: (string | undefined)[], q: string) {
  if (!q.trim()) return true;
  return haystack.filter(Boolean).join(" ").toLowerCase().includes(q.trim().toLowerCase());
}

export function ClientLifecyclePreviewDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName?: string;
  onEdit?: () => void;
}) {
  const [tab, setTab] = React.useState<TabKey>("Overview");
  const [query, setQuery] = React.useState("");
  const [activeNav, setActiveNav] = React.useState("Customers");
  const [showSub, setShowSub] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab("Overview");
      setQuery("");
      setActiveNav("Customers");
      setShowSub(false);
    }
  }, [open]);

  const q = useQuery({
    queryKey: ["admin", "client-view", clientId],
    queryFn: () => fetchAdminClientView(clientId as string),
    enabled: open && !!clientId,
  });

  const data: AdminClientView | undefined = q.data;
  const name = data?.header.name || clientName || "Customer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1180px] w-[96vw] h-[88vh] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{name} — customer lifecycle preview</DialogTitle>

        <div className="flex h-full w-full overflow-hidden bg-[#f3f4f6] text-slate-800">
          {/* ── Left nav rail ── */}
          <aside className="hidden w-56 shrink-0 flex-col justify-between px-4 py-5 text-slate-200 md:flex" style={{ backgroundColor: NAVY }}>
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
                      onClick={() => { setActiveNav(label); if (label !== "Customers") toast(`${label} (preview)`); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                      style={active ? { backgroundColor: NAVY_SOFT, color: BRONZE, fontWeight: 600 } : undefined}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-3">
              <button onClick={() => toast.success("AI analysis started")} className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BRONZE }}>
                <Zap className="h-4 w-4" /> Run AI Analysis
              </button>
              <div className="space-y-1 border-t border-white/10 pt-3 text-sm text-slate-300">
                <button onClick={() => toast("Support (preview)")} className="flex w-full items-center gap-3 px-3 py-1.5 hover:text-white"><HelpCircle className="h-4 w-4" /> Support</button>
                <button onClick={() => toast("Account (preview)")} className="flex w-full items-center gap-3 px-3 py-1.5 hover:text-white"><UserCircle2 className="h-4 w-4" /> Account</button>
              </div>
            </div>
          </aside>

          {/* ── Main column ── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* top bar */}
            <div className="flex items-center gap-4 border-b bg-white px-5 py-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer assets..." className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400" />
              </div>
              <nav className="hidden items-center gap-5 text-sm lg:flex">
                {topTabs.map((tt) => (
                  <button key={tt} onClick={() => { setShowSub(false); setTab(tt); }} className="pb-0.5 transition-colors" style={tab === tt && !showSub ? { color: "#0f172a", fontWeight: 600, borderBottom: `2px solid ${BRONZE}` } : { color: "#64748b" }}>{tt}</button>
                ))}
              </nav>
            </div>

            {/* body */}
            {q.isLoading ? (
              <div className="flex flex-1 items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading customer…
              </div>
            ) : q.isError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p>{q.error instanceof Error ? q.error.message : "Failed to load customer."}</p>
                <button onClick={() => q.refetch()} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">Retry</button>
              </div>
            ) : !data ? (
              <div className="flex flex-1 items-center justify-center text-slate-400">No data.</div>
            ) : (
              <div className="flex flex-1 gap-5 overflow-y-auto p-5">
                <div className="min-w-0 flex-1 space-y-5">
                  <HeaderCard data={data} name={name} onEdit={onEdit} onViewSub={() => setShowSub(true)} onRenewal={() => setShowSub(true)} />

                  {showSub ? (
                    <SubscriptionPanel data={data} onBack={() => setShowSub(false)} />
                  ) : (
                    <>
                      <KpiRow data={data} onPick={setTab} />
                      <LifecycleCard data={data} />
                      <DetailTabs data={data} tab={tab} setTab={setTab} query={query} />
                    </>
                  )}
                </div>

                <TimelineRail data={data} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Header ── */
function HeaderCard({ data, name, onEdit, onViewSub, onRenewal }: { data: AdminClientView; name: string; onEdit?: () => void; onViewSub: () => void; onRenewal: () => void; }) {
  const h = data.header;
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-14 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-200 to-slate-300">
            {h.avatar ? <img src={h.avatar} alt="" className="h-full w-full object-cover" /> : <Boxes className="h-7 w-7 text-slate-500" />}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight text-slate-900">{name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {h.category && <span className="inline-flex items-center gap-1"><Boxes className="h-3.5 w-3.5" /> {h.category}</span>}
              <span className="inline-flex items-center gap-1 font-medium" style={{ color: h.active ? "#059669" : "#dc2626" }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: h.active ? "#10b981" : "#dc2626" }} /> {h.active ? "Active" : "Inactive"}
              </span>
              {(h.city || h.country) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[h.city, h.country].filter(Boolean).join(", ")}</span>}
            </div>
            {h.memberSince && <div className="mt-1.5 inline-flex items-center gap-1 text-sm text-slate-400"><CalendarDays className="h-3.5 w-3.5" /> Since {h.memberSince}</div>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => (onEdit ? onEdit() : toast(`Edit ${name}`))} className="rounded-lg border px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">Edit Customer</button>
          <button onClick={onViewSub} className="rounded-lg border px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">View Subscription</button>
          <button onClick={onRenewal} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: NAVY }}>View Renewal Status</button>
        </div>
      </div>
    </div>
  );
}

/* ── KPI cards ── */
function KpiRow({ data, onPick }: { data: AdminClientView; onPick: (t: TabKey) => void }) {
  const s = data.summary;
  const cards: { label: string; value: string; sub?: string; icon: typeof Crown; tab?: TabKey }[] = [
    { label: "Active Sub", value: data.header.subscription.packageName || "—", sub: data.header.subscription.isTrial ? "Trial" : data.header.subscription.isActive ? "Active" : undefined, icon: Crown },
    { label: "Branches", value: String(s.branches), icon: MapPin, tab: "Branches" },
    { label: "Cameras", value: String(s.cameras), icon: Video, tab: "Cameras" },
    { label: "AI Services", value: String(s.aiServices), sub: "Active", icon: Cpu, tab: "AI Services" },
    { label: "Modules", value: String(s.modules), sub: "Active", icon: Boxes, tab: "Modules" },
    { label: "Integrations", value: String(s.integrations), sub: "Active", icon: Plug, tab: "Integrations" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ label, value, sub, icon: Icon, tab }) => (
        <button key={label} onClick={() => (tab ? onPick(tab) : toast(`${label}: ${value}`))} className="rounded-2xl border bg-white p-4 text-left transition-shadow hover:shadow-md">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="truncate text-xl font-bold text-slate-900">{value}</div>
              {sub && <div className="text-sm font-semibold text-emerald-600">{sub}</div>}
            </div>
            <Icon className="h-5 w-5 shrink-0" style={{ color: BRONZE }} />
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── Lifecycle ── */
function LifecycleCard({ data }: { data: AdminClientView }) {
  if (data.lifecycle.length === 0) return null;
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="text-lg font-bold text-slate-900">Lifecycle Progress</h3>
      <div className="mt-6 flex items-start justify-between gap-2">
        {data.lifecycle.map((step, i) => (
          <div key={step.key || i} className="relative flex flex-1 flex-col items-center">
            {i < data.lifecycle.length - 1 && <span className="absolute left-1/2 top-5 h-0.5 w-full" style={{ backgroundColor: BRONZE_SOFT }} />}
            <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: step.completed ? BRONZE : "#e2e8f0", color: step.completed ? "#fff" : "#94a3b8" }}>
              {step.completed ? <Check className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
            </span>
            <span className="mt-2 text-center text-xs font-medium" style={{ color: step.completed ? "#475569" : "#94a3b8" }}>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Detail tabs ── */
function DetailTabs({ data, tab, setTab, query }: { data: AdminClientView; tab: TabKey; setTab: (t: TabKey) => void; query: string }) {
  const branches = data.branches.filter((b) => has([b.name, b.area, b.status], query));
  const services = data.aiServices.filter((s) => has([s.name, s.status], query));
  const integrations = data.integrations.filter((i) => has([i.name, i.key, i.connected ? "connected" : "disconnected"], query));
  const sub = data.header.subscription;

  return (
    <div className="rounded-2xl border bg-white p-5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-5 border-b bg-transparent p-0">
          {detailTabs.map((tk) => (
            <TabsTrigger key={tk} value={tk} className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2 text-sm text-slate-500 data-[state=active]:border-[#9c6f43] data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-none">{tk}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="Overview" className="mt-5 space-y-5">
          {branches.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {branches.slice(0, 3).map((b) => <BranchCard key={b.id} b={b} />)}
            </div>
          ) : <Empty label="branches" />}

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900">Onboarding Checklist</h4>
                <span className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: NAVY }}>{data.onboarding.percentage}% Done</span>
              </div>
              <ul className="mt-4 space-y-3">
                {data.onboarding.items.length === 0 && <li className="text-sm text-slate-400">No checklist items.</li>}
                {data.onboarding.items.map((c) => (
                  <li key={c.key} className="flex items-center gap-2.5 text-sm">
                    {c.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300" />}
                    <span className={c.completed ? "text-slate-700" : "text-slate-400"}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border p-5">
              <h4 className="text-lg font-bold text-slate-900">Active AI Services</h4>
              <div className="mt-4 space-y-3">
                {services.length === 0 && <p className="text-sm text-slate-400">No active AI services yet.</p>}
                {services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: BRONZE_SOFT }}><Cpu className="h-4 w-4" style={{ color: BRONZE }} /></span>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.meta || (s.cameras != null ? `${s.cameras} cameras` : "")}</div>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Branches */}
        <TabsContent value="Branches" className="mt-5">
          {branches.length === 0 ? <Empty label="branches" /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{branches.map((b) => <BranchCard key={b.id} b={b} full />)}</div>
          )}
        </TabsContent>

        {/* Cameras */}
        <TabsContent value="Cameras" className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <UsageCard label="Total Cameras" value={data.summary.cameras} />
            <UsageCard label="In Use" value={sub.currentCameras ?? 0} max={sub.maxCameras} />
            <UsageCard label="Plan Limit" value={sub.maxCameras ?? 0} />
          </div>
          {branches.some((b) => b.cameras != null) ? (
            <DataRows head={["Branch", "Cameras", "AI Streams", "Status"]} rows={branches.map((b) => [
              <span key="n" className="font-medium text-slate-800">{b.name}</span>,
              String(b.cameras ?? 0),
              String(b.streams ?? 0),
              <StatusBadge key="s" status={b.status} />,
            ])} />
          ) : <Empty label="cameras" />}
        </TabsContent>

        {/* AI Services */}
        <TabsContent value="AI Services" className="mt-5">
          {services.length === 0 ? <Empty label="AI services" /> : (
            <DataRows head={["Service", "Cameras", "Status"]} rows={services.map((s) => [
              <span key="n" className="font-medium text-slate-800">{s.name}</span>,
              s.cameras != null ? String(s.cameras) : "—",
              <StatusBadge key="s" status={s.status} />,
            ])} />
          )}
        </TabsContent>

        {/* Modules */}
        <TabsContent value="Modules" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <UsageCard label="Active Modules" value={data.summary.modules} />
            <div className="flex items-center rounded-xl border p-4 text-sm text-slate-500">
              {data.summary.modules > 0 ? `${data.summary.modules} module(s) currently active for this customer.` : "No active modules."}
            </div>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="Integrations" className="mt-5">
          {integrations.length === 0 ? <Empty label="integrations" /> : (
            <DataRows head={["Integration", "Connected", "Status"]} rows={integrations.map((i) => [
              <span key="n" className="font-medium text-slate-800">{i.name}</span>,
              i.connectedAt ? fmtDate(i.connectedAt) : (i.connected ? "Yes" : "No"),
              <StatusBadge key="s" status={i.connected ? "connected" : i.enabled ? "pending" : "disconnected"} />,
            ])} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BranchCard({ b, full }: { b: AdminClientView["branches"][number]; full?: boolean }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-bold text-slate-900">{b.name}</div>
          {b.area && <div className="text-xs text-slate-500">{b.area}</div>}
        </div>
        {full ? <StatusBadge status={b.status} /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100"><MapPin className="h-4 w-4 text-slate-500" /></span>}
      </div>
      <div className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Cameras</span><span className="font-semibold text-slate-800">{b.cameras ?? 0}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">AI Streams</span><span className="font-semibold text-slate-800">{b.streams ?? 0}</span></div>
      </div>
      {!full && (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <StatusBadge status={b.status} />
          <button onClick={() => toast(`Opening ${b.name}`)} className="text-sm font-medium" style={{ color: BRONZE }}>View ›</button>
        </div>
      )}
    </div>
  );
}

function UsageCard({ label, value, max }: { label: string; value: number; max?: number }) {
  const pct = max && max > 0 ? Math.min(100, Math.round((value / max) * 100)) : null;
  return (
    <div className="rounded-xl border p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}{max != null ? <span className="text-sm font-medium text-slate-400"> / {max}</span> : null}</div>
      {pct != null && <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BRONZE }} /></div>}
    </div>
  );
}

function DataRows({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400" style={{ gridTemplateColumns: `repeat(${head.length}, minmax(0,1fr))` }}>
        {head.map((h) => <span key={h}>{h}</span>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid items-center px-4 py-3 text-sm text-slate-600 [&:not(:last-child)]:border-b" style={{ gridTemplateColumns: `repeat(${head.length}, minmax(0,1fr))` }}>
          {r.map((cell, j) => <span key={j} className="truncate pe-2">{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="flex min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-slate-400">No {label} yet.</div>;
}

/* ── Subscription / renewal panel (from the live payload) ── */
function SubscriptionPanel({ data, onBack }: { data: AdminClientView; onBack: () => void }) {
  const s = data.header.subscription;
  const rows: [string, React.ReactNode][] = [
    ["Package", s.packageName || "—"],
    ["Type", s.isTrial ? "Trial" : "Paid"],
    ["Status", <StatusBadge key="st" status={s.isActive ? "active" : "inactive"} />],
    ["Start date", fmtDate(s.startDate)],
    ["End date", fmtDate(s.endDate)],
    ["Days remaining", s.daysRemaining != null ? `${s.daysRemaining} days` : "—"],
  ];
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="text-lg font-bold text-slate-900">Subscription & Renewal</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border">
          {rows.map(([k, v], i) => (
            <div key={k} className={`flex items-center justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? "border-b" : ""}`}>
              <span className="text-slate-500">{k}</span>
              <span className="font-medium text-slate-800">{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <UsageCard label="Cameras" value={s.currentCameras ?? 0} max={s.maxCameras} />
          <UsageCard label="Branches" value={s.currentBranches ?? 0} max={s.maxBranches} />
          <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: BRONZE_SOFT, color: NAVY }}>
            {s.isActive
              ? `Renewal ${s.daysRemaining != null ? `in ${s.daysRemaining} days` : "upcoming"} — ends ${fmtDate(s.endDate)}.`
              : "No active subscription."}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Activity timeline ── */
function TimelineRail({ data }: { data: AdminClientView }) {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-center gap-2 text-slate-900">
          <History className="h-5 w-5" style={{ color: BRONZE }} />
          <h3 className="text-lg font-bold">Activity Timeline</h3>
        </div>
        <ol className="mt-5 space-y-5">
          {data.activity.length === 0 && <li className="text-sm text-slate-400">No activity yet.</li>}
          {data.activity.map((ev, i) => (
            <li key={i} className="relative ps-6">
              <span className="absolute left-0 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ backgroundColor: i === 0 ? "#1f9d55" : BRONZE_SOFT }}>
                {i === 0 && <Check className="h-2.5 w-2.5 text-white" />}
              </span>
              {ev.when && <div className="text-[11px] text-slate-400">{fmtDate(ev.when)}</div>}
              <div className="text-sm font-bold text-slate-800">{ev.title}</div>
              {ev.body && <div className="text-xs text-slate-500">{ev.body}</div>}
            </li>
          ))}
        </ol>
        <button onClick={() => toast("Showing full audit log")} className="mt-5 w-full border-t pt-4 text-center text-sm font-semibold" style={{ color: BRONZE }}>View Full Audit Log</button>
      </div>
    </aside>
  );
}

export default ClientLifecyclePreviewDialog;
