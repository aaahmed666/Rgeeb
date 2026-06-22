"use client";

import React from "react";
import dynamic from "next/dynamic";

const View = dynamic(() => import("@/views/customer-lifecycle/CamerasView"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export default function CamerasPage() {
  return <View />;
}
