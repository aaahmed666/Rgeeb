"use client";

import React from "react";
import dynamic from "next/dynamic";

const AiServicesView = dynamic(() => import("@/views/AiServicesView"), {
  ssr: false,
});

export default function Page() {
  return <AiServicesView defaultTab="safety" />;
}
