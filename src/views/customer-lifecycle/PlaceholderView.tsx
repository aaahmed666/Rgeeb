"use client";

import React from "react";
import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

interface PlaceholderViewProps {
  title: string;
  description?: string;
}

/**
 * A reusable placeholder for Customer Lifecycle sub-pages
 * that will be built in later phases.
 */
export default function PlaceholderView({
  title,
  description,
}: PlaceholderViewProps) {
  const { t } = useTranslation();
  const desc = description ?? t("customerLifecycle.common.underDevelopment", "This section is under development and will be available soon.");
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Construction className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{desc}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
