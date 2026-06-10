"use client";
import TranslatedErrorFallback from "@/components/dashboard/TranslatedErrorFallback";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <TranslatedErrorFallback error={error} reset={reset} />;
}
