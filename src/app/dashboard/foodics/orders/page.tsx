"use client";

import React from "react";
import dynamic from "next/dynamic";

const View = dynamic(() => import("@/views/foodics/FoodicsOrdersPage"), {
  ssr: false,
});

export default function Page() {
  return <View />;
}
