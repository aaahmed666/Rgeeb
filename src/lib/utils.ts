import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date as YYYY-MM-DD using the *local* calendar day.
 * `toISOString().slice(0, 10)` converts to UTC first, which shifts the
 * date by one day for users in non-UTC timezones (e.g. UTC+3 before 03:00).
 */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's date as a local YYYY-MM-DD string. */
export function todayLocalISO(): string {
  return toLocalISODate(new Date());
}

/** Clamp a Date so it is never after today (local time, end of day). */
export function clampToToday(date: Date): Date {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return date.getTime() > endOfToday.getTime() ? new Date() : date;
}

/** Clamp a YYYY-MM-DD string so it is never after today's local date. */
export function clampISODateToToday(iso: string): string {
  const today = todayLocalISO();
  return iso > today ? today : iso;
}

/**
 * Safely turn an rsuite-style date range (`[Date, Date] | null`) into
 * `{ from, to }` local ISO date strings.
 *
 * The picker can hand back a partial or non-Date value mid-interaction (e.g.
 * `[Date, null]`), and a value rehydrated from elsewhere may not be a real
 * Date instance. The previous inline `dateRange[1].toISOString()` ran during
 * render and threw a TypeError in those cases, which tripped the route-level
 * error boundary and showed "Failed to load page". This helper never throws:
 * any missing or invalid endpoint yields an empty string for that side.
 */
export function dateRangeToISO(
  range: readonly (Date | null | undefined)[] | null | undefined
): { from: string; to: string } {
  const toISO = (d: Date | null | undefined): string =>
    d instanceof Date && !Number.isNaN(d.getTime()) ? toLocalISODate(d) : "";
  return {
    from: toISO(range?.[0]),
    to: toISO(range?.[1]),
  };
}

/**
 * Safe SAR currency formatter (parity with the legacy app's `formatCurrency`).
 *
 * Per-row Foodics values such as order `total`/`discount` and refund `amount`
 * are typed as `number`, but the backend can return `null`, `undefined`, or a
 * numeric string. Calling `.toFixed()` directly on those threw a TypeError
 * during render, which tripped the route-level error boundary and showed
 * "Failed to load page" on the Orders and Refund Verification screens.
 *
 * This helper never throws: any non-finite value renders as an em dash, exactly
 * like the legacy production system did.
 */
export function formatSAR(
  value: number | string | null | undefined,
  { dash = true }: { dash?: boolean } = {}
): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return dash ? "—" : "SAR 0.00";
  return `SAR ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
