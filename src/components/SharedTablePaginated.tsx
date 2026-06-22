"use client";

import React from "react";
import { DataTable, type DataTableProps } from "./ui/data-table";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface SharedTablePaginatedProps<T> extends DataTableProps<T> {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
}

export function SharedTablePaginated<T>({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  ...props
}: SharedTablePaginatedProps<T>) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <DataTable {...props} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border border-t-0 rounded-b-lg border-border/60">
          <p className="text-xs text-muted-foreground">
            {totalItems !== undefined
              ? t("common.showingOf", {
                  start: (currentPage - 1) * 10 + 1,
                  end: Math.min(currentPage * 10, totalItems),
                  total: totalItems,
                })
              : t("common.page", "Page") + ` ${currentPage} ${t("common.of", "of")} ${totalPages}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedTablePaginated;
