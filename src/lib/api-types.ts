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
