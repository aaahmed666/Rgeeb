/**
 * Shared API response type definitions.
 * Place this file at src/lib/api-types.ts
 */

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface ListResponse<T> {
  data: T[];
  status?: boolean;
  message?: string;
}

// ── Structured error type used by error-fallback and use-error-handler ──────
export interface StructuredApiError {
  type: "auth" | "permission" | "not_found" | "forbidden" | "notfound" | "validation" | "server" | "network" | "unknown";
  status?: number;
  code?: string;
  message: string;
  details?: string[];
  field?: string;
  retryable?: boolean;
  timestamp?: number | string;
}
