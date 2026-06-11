"use client";

import React from "react";
import { IslandHeatmapView } from "@/views/customer-island/IslandHeatmapViolations";

// Suspense required: the island views read filters via useSearchParams.
export default function Page() {
  return (
    <React.Suspense>
      <IslandHeatmapView />
    </React.Suspense>
  );
}
