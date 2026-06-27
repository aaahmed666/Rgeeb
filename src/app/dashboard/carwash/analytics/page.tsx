"use client";

import dynamic from "next/dynamic";

const CarWashAnalyticsView = dynamic(
  () => import("@/views/carwash/CarWashAnalyticsView"),
  { ssr: false },
);

export default function Page() {
  return <CarWashAnalyticsView />;
}
