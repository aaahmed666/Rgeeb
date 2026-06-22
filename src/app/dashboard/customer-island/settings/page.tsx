"use client";

import React from "react";
import { IslandSettingsView } from "@/views/customer-island/IslandComplianceSettings";

// Suspense required: the island views read filters via useSearchParams.
export default function Page() {
  return (
    <React.Suspense>
      <IslandSettingsView />
    </React.Suspense>
  );
}
