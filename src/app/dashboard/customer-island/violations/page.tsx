"use client";

import React from "react";
import { IslandViolationsView } from "@/views/customer-island/IslandHeatmapViolations";

// Suspense required: the island views read filters via useSearchParams.
export default function Page() {
  return (
    <React.Suspense>
      <IslandViolationsView />
    </React.Suspense>
  );
}
