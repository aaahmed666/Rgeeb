/**
 * Shared design-token helpers for the Customer Lifecycle module.
 *
 * RULE: Views in this module must NOT hardcode Tailwind palette colors
 * (emerald-500, slate-600, rose-400 …) or raw hex/rgb values. Every colour
 * must resolve through the app design system so light/dark mode and theming
 * stay consistent. Status colours are centralised here so a single map drives
 * every badge / dot / bar across all lifecycle screens.
 *
 * Chart series use the CSS variables defined in globals.css (--chart-1..5),
 * which automatically switch between light and dark mode. Recharts accepts a
 * `var(--token)` string for `fill` / `stroke`.
 */

/* ── Chart series tokens (theme-aware, switch with .dark) ─────────────────── */

export const CHART = {
  /** brand orange — primary series */
  primary: "var(--chart-1)",
  /** navy / blue — secondary series (light in dark mode so it stays visible) */
  navy: "var(--chart-2)",
  series3: "var(--chart-3)",
  series4: "var(--chart-4)",
  series5: "var(--chart-5)",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
  tooltipBg: "var(--popover)",
  tooltipBorder: "var(--border)",
  tooltipText: "var(--popover-foreground)",
} as const;

/** Ordered palette for multi-series charts (donuts, distribution pies). */
export const CHART_PALETTE = [
  CHART.primary,
  CHART.navy,
  CHART.series3,
  CHART.series4,
  CHART.series5,
] as const;

/* ── Semantic status intents ──────────────────────────────────────────────
 * Each intent maps to a tinted background + foreground that is legible in
 * both light and dark mode. Built from the design-system semantic tokens.
 * `soft`  → tinted pill (badges)
 * `solid` → solid fill (progress bars / dots)
 * `text`  → foreground only
 * `dot`   → small indicator dot bg
 */

export type StatusIntent =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

interface IntentStyle {
  soft: string;
  solid: string;
  text: string;
  dot: string;
}

/**
 * Status palette.
 *
 * `success`/`warning`/`danger`/`info` use a small, fixed set of semantic
 * status hues (green/amber/red/blue) — these communicate meaning and are the
 * same hues used in the approved designs. They are defined ONCE here instead
 * of being scattered as literals across 13 files. `neutral` and `brand` map
 * directly onto the app design-system tokens.
 */
const INTENTS: Record<StatusIntent, IntentStyle> = {
  success: {
    soft: "bg-[var(--status-success)]/12 text-[var(--status-success)]",
    solid: "bg-[var(--status-success)]",
    text: "text-[var(--status-success)]",
    dot: "bg-[var(--status-success)]",
  },
  warning: {
    soft: "bg-[var(--status-warning)]/12 text-[var(--status-warning)]",
    solid: "bg-[var(--status-warning)]",
    text: "text-[var(--status-warning)]",
    dot: "bg-[var(--status-warning)]",
  },
  danger: {
    soft: "bg-[var(--status-danger)]/12 text-[var(--status-danger)]",
    solid: "bg-[var(--status-danger)]",
    text: "text-[var(--status-danger)]",
    dot: "bg-[var(--status-danger)]",
  },
  info: {
    soft: "bg-[var(--status-info)]/12 text-[var(--status-info)]",
    solid: "bg-[var(--status-info)]",
    text: "text-[var(--status-info)]",
    dot: "bg-[var(--status-info)]",
  },
  brand: {
    soft: "bg-primary/12 text-primary",
    solid: "bg-primary",
    text: "text-primary",
    dot: "bg-primary",
  },
  neutral: {
    soft: "bg-muted text-muted-foreground",
    solid: "bg-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function intentStyle(intent: StatusIntent): IntentStyle {
  return INTENTS[intent];
}

/* ── Status string → intent mapping ───────────────────────────────────────
 * Normalises the many status strings used across the module onto the six
 * intents above. Case-insensitive; unknown values fall back to neutral.
 */
const STATUS_TO_INTENT: Record<string, StatusIntent> = {
  // success / healthy / active
  active: "success",
  "active customer": "success",
  "go live": "success",
  golive: "success",
  online: "success",
  connected: "success",
  stable: "success",
  completed: "success",
  verified: "success",
  healthy: "success",
  paid: "success",
  streaming: "success",
  up: "success",
  // warning / in-progress / pending
  onboarding: "warning",
  "onboarding started": "warning",
  "setting up": "warning",
  pending: "warning",
  warning: "warning",
  throttled: "warning",
  "renewal due": "warning",
  "waiting for requirements": "warning",
  degraded: "warning",
  syncing: "warning",
  // danger / errors / risk
  suspended: "danger",
  error: "danger",
  offline: "danger",
  disconnected: "danger",
  failed: "danger",
  "at risk": "danger",
  "at risk / attention": "danger",
  expired: "danger",
  down: "danger",
  // info / configuration stages
  "camera setup": "info",
  "integration setup": "info",
  "ai services configuration": "info",
  configuring: "info",
  current: "info",
  scheduled: "info",
  // brand
  enterprise: "brand",
};

export function statusIntent(status: string | undefined | null): StatusIntent {
  if (!status) return "neutral";
  return STATUS_TO_INTENT[status.trim().toLowerCase()] ?? "neutral";
}

/** Convenience: soft badge classes straight from a status string. */
export function statusBadgeClass(status: string | undefined | null): string {
  return intentStyle(statusIntent(status)).soft;
}
