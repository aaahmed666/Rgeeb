"use client";

import { PageErrorFallback } from "@/components/dashboard/error-fallback";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageErrorFallback
      error={error}
      reset={reset}
      title="Failed to load Tasks"
      description="There was an error loading your tasks. Please try again."
    />
  );
}
