"use client";

import React from "react";
import dynamic from "next/dynamic";
import { SERVICE_MAP } from "@/views/ai-services/aiServicesData";
import { useTranslation } from "react-i18next";

const AIServiceDetailView = dynamic(() => import("@/views/ai-services/AIServiceDetailView"), {
  ssr: false,
});

export default function Page() {
  const { t } = useTranslation();
  const service = SERVICE_MAP["sandwich-counting"];
  if (!service) return <div className="p-8 text-muted-foreground">{t("errors.serviceNotFound")}</div>;
  return <AIServiceDetailView service={service} />;
}
