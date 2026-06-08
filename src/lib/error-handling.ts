/**
 * Error handling utilities used across the app.
 * Provides normalised error objects, dev logging, and retry detection.
 */

import { ApiError } from "@/lib/api";

export { ApiError };

export interface NormalisedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
}

export function normalizeApiError(error: unknown): NormalisedError {
  if (error instanceof ApiError) {
    return {
      statusCode: error.status,
      code: "API_ERROR",
      message: error.message,
      details: error.body,
      retryable: isRetryableError(error),
    };
  }
  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: error.message,
      retryable: false,
    };
  }
  if (typeof error === "string") {
    return {
      statusCode: 500,
      code: "UNKNOWN_ERROR",
      message: error,
      retryable: false,
    };
  }
  return {
    statusCode: 500,
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
    retryable: false,
  };
}

export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const s = error.status;
    return s === 408 || s === 429 || (s >= 500 && s < 600);
  }
  return false;
}

const isDev = process.env.NODE_ENV === "development";

export function devLog(tag: string, message: string, data?: unknown): void {
  if (!isDev) return;
  // eslint-disable-next-line no-console
  console.log(`[${tag}] ${message}`, ...(data !== undefined ? [data] : []));
}

export function devLogError(tag: string, message: string, error?: unknown): void {
  if (!isDev) return;
  // eslint-disable-next-line no-console
  console.error(`[${tag}] ${message}`, ...(error !== undefined ? [error] : []));
}

export function devLogWarn(tag: string, message: string, data?: unknown): void {
  if (!isDev) return;
  // eslint-disable-next-line no-console
  console.warn(`[${tag}] ${message}`, ...(data !== undefined ? [data] : []));
}
