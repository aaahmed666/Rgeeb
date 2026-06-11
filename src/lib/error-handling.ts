/**
 * Error handling utilities used across the app.
 * Provides normalised error objects, friendly messages for known error
 * codes, dev logging, and retry detection.
 */

import { ApiError } from "@/lib/api";

export { ApiError };

export interface NormalisedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  timestamp?: string;
}

function isErrorLikeObject(
  e: unknown
): e is { code: string; message: string; statusCode: number; details?: unknown } {
  return (
    typeof e === "object" &&
    e !== null &&
    !(e instanceof Error) &&
    typeof (e as Record<string, unknown>).code === "string" &&
    typeof (e as Record<string, unknown>).message === "string" &&
    typeof (e as Record<string, unknown>).statusCode === "number"
  );
}

export function normalizeApiError(error: unknown): NormalisedError {
  if (error instanceof ApiError) {
    const body = (error.body ?? {}) as Record<string, unknown>;
    const { code, ...details } = body;
    return {
      statusCode: error.status,
      code: typeof code === "string" ? code : "API_ERROR",
      message: error.message,
      details: Object.keys(details).length ? details : undefined,
    };
  }
  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: error.message,
    };
  }
  if (isErrorLikeObject(error)) {
    // Already in normalised shape — pass through and stamp it.
    return { ...error, timestamp: new Date().toISOString() };
  }
  if (typeof error === "string") {
    return {
      statusCode: 500,
      code: "UNKNOWN_ERROR",
      message: error,
    };
  }
  return {
    statusCode: 500,
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "The requested resource was not found",
  VALIDATION_ERROR: "Please check your input and try again",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again",
  NETWORK_ERROR: "Could not reach the server. Check your connection",
};

/** Friendly message for a known error code. */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "An error occurred. Please try again";
}

/** Whether an HTTP status code is worth retrying. */
export function isRetryableError(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

// NODE_ENV is read at call time (not module load) so tests and runtime
// environment switches behave predictably.
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export function devLog(tag: string, message: string, data?: unknown): void {
  if (!isDev()) return;
  // eslint-disable-next-line no-console
  console.log(`[${tag}]`, message, ...(data !== undefined ? [data] : []));
}

export function devLogError(tag: string, message: string, error?: unknown): void {
  if (!isDev()) return;
  const err = error instanceof Error ? error : undefined;
  // eslint-disable-next-line no-console
  console.error(
    `[${tag}:ERROR]`,
    message,
    ...(err ? [err.message, err.stack ?? ""] : error !== undefined ? [error] : [])
  );
}

export function devLogWarn(tag: string, message: string, data?: unknown): void {
  if (!isDev()) return;
  // eslint-disable-next-line no-console
  console.warn(`[${tag}:WARN]`, message, ...(data !== undefined ? [data] : []));
}
