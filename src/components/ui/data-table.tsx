"use client";

/**
 * DataTable — shared typed table used across the entire dashboard.
 *
 * CHANGES:
 * - Professional empty state: icon + i18n title + optional description + action button
 * - Error state: red icon + optional Retry callback
 * - Responsive: overflow-x-auto wrapper, min-w-full on table
 * - Export slot: exportActions prop rendered next to toolbar actions
 * - Robust row key: String(row.id ?? `row-${i}`)
 * - ExportCSVButton / ExportPDFButton / ExportExcelButton helpers exported
 */

import * as React from "react";
import { Search, FileX2, AlertCircle, RefreshCw, Download } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Input }    from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button }   from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn }       from "@/lib/utils";

/* ─── Column / Props types ──────────────────────────────────────────────── */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  headClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: (T & { id: string | number })[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  /** Primary empty-state label  */
  emptyMessage?: string;
  /** Secondary description shown beneath the empty icon */
  emptyDescription?: string;
  /** Optional action button shown in the empty state */
  emptyAction?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  /** Export buttons slot — CSV / PDF / Excel */
  exportActions?: React.ReactNode;
  className?: string;
  skeletonRows?: number;
  /** When provided, a Retry button is shown in the error state */
  onRefresh?: () => void;
}

/* ─── DataTable ─────────────────────────────────────────────────────────── */

export function DataTable<T>({
  columns,
  data,
  isLoading   = false,
  isError     = false,
  errorMessage = "Failed to load data",
  emptyMessage = "No records found",
  emptyDescription,
  emptyAction,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  title,
  actions,
  exportActions,
  className,
  skeletonRows = 6,
  onRefresh,
}: DataTableProps<T>) {
  const colSpan = columns.length;

  return (
    <Card className={cn("overflow-hidden border-border/60 shadow-sm", className)}>

      {/* ── Toolbar ── */}
      {(title || searchValue !== undefined || actions || exportActions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 sm:px-5">
          {title && (
            <h2 className="text-base font-semibold leading-none tracking-tight">
              {title}
            </h2>
          )}
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {onSearchChange && (
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full ps-9 sm:w-56 lg:w-72"
                />
              </div>
            )}
            {actions}
            {exportActions && (
              <div className="flex items-center gap-1.5">{exportActions}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <CardContent className="p-0">
        <div className="overflow-x-auto table-responsive-wrapper">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "h-10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap",
                      col.headClassName
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* ── Loading ── */}
              {isLoading &&
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {columns.map((col) => (
                      <TableCell key={col.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* ── Error ── */}
              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                      </div>
                      <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
                      {onRefresh && (
                        <Button variant="outline" size="sm" className="gap-2 mt-1" onClick={onRefresh}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* ── Empty state ── */}
              {!isLoading && !isError && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 px-6">
                      {/* Dashed circle + icon */}
                      <div className="relative flex h-20 w-20 items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/20" />
                        <FileX2 className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      {/* Text */}
                      <div className="space-y-1 max-w-xs">
                        <p className="text-sm font-semibold text-foreground/80">
                          {emptyMessage}
                        </p>
                        {emptyDescription && (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {emptyDescription}
                          </p>
                        )}
                      </div>
                      {/* Optional action */}
                      {emptyAction && <div className="mt-1">{emptyAction}</div>}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* ── Data rows ── */}
              {!isLoading && !isError && data.length > 0 &&
                data.map((row, i) => (
                  <TableRow key={String(row.id ?? `row-${i}`)}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn("px-4 py-3 align-middle", col.cellClassName)}
                        data-label={col.header}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Export button helpers ─────────────────────────────────────────────── */

interface ExportBtnProps {
  onClick: () => void;
  label?: string;
  loading?: boolean;
}

export function ExportCSVButton({ onClick, label = "CSV", loading }: ExportBtnProps) {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium" onClick={onClick} disabled={loading}>
      <Download className="h-3.5 w-3.5 text-emerald-600" />
      {label}
    </Button>
  );
}

export function ExportPDFButton({ onClick, label = "PDF", loading }: ExportBtnProps) {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium" onClick={onClick} disabled={loading}>
      <Download className="h-3.5 w-3.5 text-rose-500" />
      {label}
    </Button>
  );
}

export function ExportExcelButton({ onClick, label = "Excel", loading }: ExportBtnProps) {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs font-medium" onClick={onClick} disabled={loading}>
      <Download className="h-3.5 w-3.5 text-green-600" />
      {label}
    </Button>
  );
}
