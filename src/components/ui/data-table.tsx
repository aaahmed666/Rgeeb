"use client";

/**
 * Shared DataTable — a reusable, typed table component used across the dashboard.
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: "name", header: "Name", render: (row) => row.name },
 *       { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> },
 *     ]}
 *     data={rows}
 *     isLoading={isLoading}
 *     isError={isError}
 *     errorMessage={error?.message}
 *     emptyMessage="No records found"
 *     searchValue={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Search..."
 *     actions={<Button onClick={...}>Add</Button>}
 *     title="My Table"
 *   />
 */

import * as React from "react";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Unique key — used as React key */
  key: string;
  /** Column header label */
  header: string;
  /** Custom renderer for the cell — receives the full row */
  render: (row: T) => React.ReactNode;
  /** Optional className for the <TableHead> */
  headClassName?: string;
  /** Optional className for the <TableCell> */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data — each item must have a unique `id` field (string | number) */
  data: (T & { id: string | number })[];
  /** Shows skeleton rows while true */
  isLoading?: boolean;
  /** Shows an error row when true */
  isError?: boolean;
  /** Message displayed in the error row */
  errorMessage?: string;
  /** Message displayed when data is empty */
  emptyMessage?: string;
  /** Controlled search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (v: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Optional section title shown above the table */
  title?: React.ReactNode;
  /** Slot for buttons / other controls placed next to the search bar */
  actions?: React.ReactNode;
  /** Additional className on the wrapping Card */
  className?: string;
  /** Number of skeleton rows shown while loading (default: 6) */
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load data",
  emptyMessage = "No records found",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  title,
  actions,
  className,
  skeletonRows = 6,
}: DataTableProps<T>) {
  const colSpan = columns.length;

  return (
    <Card className={cn("overflow-hidden border-border shadow-sm", className)}>
      {(title || searchValue !== undefined || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3 sm:px-6">
          {title && (
            <h2 className="text-base font-semibold leading-none tracking-tight">
              {title}
            </h2>
          )}
          <div className="flex flex-1 items-center justify-end gap-2">
            {onSearchChange && (
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-56 ps-9 sm:w-72"
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "px-4 py-3 h-11 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap",
                    col.headClassName
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-10 text-center text-sm text-destructive"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={row.id ?? i}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        col.cellClassName
                      )}
                    >
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
