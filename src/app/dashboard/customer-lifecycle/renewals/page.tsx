"use client";

import React from "react";
import dynamic from "next/dynamic";

const RenewalsView = dynamic(
  () => import("@/views/customer-lifecycle/RenewalsView"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);

export default function RenewalsPage() {
  return <RenewalsView />;
}
