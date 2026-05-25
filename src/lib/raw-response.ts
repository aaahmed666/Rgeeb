/**
 * Utility helpers for normalising raw API responses whose shape is not
 * statically known (envelope patterns, polymorphic lists, etc.).
 *
 * These narrow `unknown` → `Record<string, unknown>` / `unknown[]` so the
 * rest of the service layer can drop `any` while still handling the loose
 * backend contracts.
 */

/** A raw JSON object whose keys/values are not yet typed. */
export type RawObject = Record<string, unknown>;

/**
 * Extracts an array from various common backend envelope shapes:
 *   - `data[]`, `data.data[]`, `items[]`, `results[]`, `notifications[]`
 * Falls back to `[]` so callers never have to null-check.
 */
export function pickArray(raw: unknown): RawObject[] {
  if (Array.isArray(raw)) return raw as RawObject[];
  const r = raw as RawObject | undefined;
  if (!r) return [];
  if (Array.isArray(r.data)) return r.data as RawObject[];
  const nested = r.data as RawObject | undefined;
  if (nested && Array.isArray(nested.data)) return nested.data as RawObject[];
  if (Array.isArray(r.items)) return r.items as RawObject[];
  if (Array.isArray(r.results)) return r.results as RawObject[];
  if (Array.isArray(r.notifications)) return r.notifications as RawObject[];
  return [];
}

/**
 * Extracts a single object from common envelope shapes:
 *   `data`, `data.data`, or the response itself.
 * Always returns a `RawObject` (never null/undefined).
 */
export function pickObject(raw: unknown): RawObject {
  const r = raw as RawObject | undefined;
  if (!r) return {};
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    return r.data as RawObject;
  }
  return r;
}

/** Safely reads a string from a raw object field, returning undefined if absent. */
export function str(obj: RawObject, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

/** Safely reads a number from a raw object field. */
export function num(obj: RawObject, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (typeof v === "string" && v !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

/** Safely reads a boolean from a raw object field. */
export function bool(obj: RawObject, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined) return Boolean(v);
  }
  return false;
}

/** Coerces a value to a string ID. */
export function id(obj: RawObject): string {
  return String(obj.id ?? obj.uuid ?? obj._id ?? crypto.randomUUID());
}
