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
      title="Failed to load Kanban Board"
      description="There was an error loading the kanban board. Please try again."
    />
  );
}
