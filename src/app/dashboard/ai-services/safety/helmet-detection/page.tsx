"use client";


import AIServiceDetailView from "@/views/ai-services/AIServiceDetailView";
import { SERVICE_MAP } from "@/views/ai-services/aiServicesData";

export default function Page() {
  const service = SERVICE_MAP["helmet-detection"];
  if (!service) return <div className="p-8 text-muted-foreground">Service not found.</div>;
  return <AIServiceDetailView service={service} />;
}
