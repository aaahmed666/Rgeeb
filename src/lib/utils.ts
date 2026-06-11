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
