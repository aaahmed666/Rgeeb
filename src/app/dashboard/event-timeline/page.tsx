"use client";
import dynamic from "next/dynamic";

const View = dynamic(() => import("@/views/EventTimelineView"), { ssr: false });

export default function Page() {
  return <View />;
}
