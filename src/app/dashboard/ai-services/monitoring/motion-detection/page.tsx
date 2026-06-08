"use client";

import React from "react";
import dynamic from "next/dynamic";
import { SERVICE_MAP } from "@/views/ai-services/aiServicesData";

const AIServiceDetailView = dynamic(() => import("@/views/ai-services/AIServiceDetailView"), {
  ssr: false,
});

export default function Page() {
  const service = SERVICE_MAP["motion-detection"];
  if (!service) return <div className="p-8 text-muted-foreground">Service not found.</div>;
  return <AIServiceDetailView service={service} />;
}
