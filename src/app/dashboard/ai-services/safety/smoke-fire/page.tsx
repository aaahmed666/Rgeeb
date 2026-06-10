"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy route — "smoke-fire" was split into separate "fire-detection" and "smoke-detection" services.
 * Redirect to fire-detection for backward compatibility.
 */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/ai-services/safety/fire-detection");
  }, [router]);
  return null;
}
