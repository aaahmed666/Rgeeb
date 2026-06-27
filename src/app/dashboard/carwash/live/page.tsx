"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageLoadingSkeleton } from "@/components/dashboard/loading-skeleton";

const CarWashLiveView = dynamic(
  () => import("@/views/carwash/CarWashLiveView"),
  { ssr: false },
);

export default function Page() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <CarWashLiveView />
    </Suspense>
  );
}
