"use client";
/**
 * Visitor Records — displays face/people detections filtered to visitor type.
 * In the new project this functionality is covered by Detection Feed with
 * type=visitor filter. We render the Detection Feed view directly here for
 * now, maintaining URL backward-compatibility.
 */
import dynamic from "next/dynamic";

const View = dynamic(() => import("@/views/VisitorRecordsView"), { ssr: false });

export default function Page() {
  return <View />;
}
