"use client";

import dynamic from "next/dynamic";

const CarWashDashboardView = dynamic(
  () => import("@/views/carwash/CarWashDashboardView"),
  { ssr: false },
);

export default function Page() {
  return <CarWashDashboardView />;
}
