"use client";

import React from "react";
import { IslandDashboardView } from "@/views/customer-island/IslandViews";

// Suspense required: the island views read filters via useSearchParams.
export default function Page() {
  return (
    <React.Suspense>
      <IslandDashboardView />
    </React.Suspense>
  );
}
