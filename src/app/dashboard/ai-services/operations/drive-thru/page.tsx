"use client";

import React from "react";
import dynamic from "next/dynamic";

// Drive-thru has its own dedicated dashboard endpoint
// (/customer/drive-thru/dashboard) and a specialized layout — matching the OLD
// project — so it does NOT go through the generic AIServiceDetailView monitor.
const DriveThruView = dynamic(
  () => import("@/views/ai-services/DriveThruView"),
  { ssr: false }
);

export default function Page() {
  return <DriveThruView />;
}
