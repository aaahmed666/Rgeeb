"use client";
/**
 * Foodics System Health — checks connection status and service health.
 * Replaces old /apps/foodics/health page.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FoodicsHealthPage() {
  const router = useRouter();
  // Redirect to connection page which now shows health status
  useEffect(() => {
    router.replace("/dashboard/foodics/connection");
  }, [router]);
  return null;
}
