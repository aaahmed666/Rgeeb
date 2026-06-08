"use client";

import React from "react";
import dynamic from "next/dynamic";

const View = dynamic(() => import("@/views/foodics/FoodicsFootfallPage"), {
  ssr: false,
});

export default function Page() {
  return <View />;
}
