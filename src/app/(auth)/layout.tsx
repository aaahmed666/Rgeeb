import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RGEEB — Sign in",
  description: "AI-powered security & analytics platform",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
