"use client";

import React from "react";
import dynamic from "next/dynamic";

const View = dynamic(() => import("@/views/admin/AdminSettingsView"), {
  ssr: false,
});

export default function Page() {
  return <View />;
}
