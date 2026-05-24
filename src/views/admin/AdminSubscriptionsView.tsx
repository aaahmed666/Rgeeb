"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader, StatusPill } from "@/components/admin/AdminPageHeader";
import { fetchAdminSubscriptions } from "@/services/adminService";

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString();
}

export default function AdminSubscriptionsView() {
  const q = useQuery({ queryKey: ["admin", "subscriptions"], queryFn: fetchAdminSubscriptions });

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.subscriptions"
        Icon={CreditCard}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
      />
      <DataTable
        data={q.data ?? []}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage={q.error instanceof Error ? q.error.message : "Failed to load"}
        emptyMessage="No subscriptions"
        columns={[
          {
            key: "user",
            header: "User",
            render: (s) => <span className="font-medium">{s.user ?? "—"}</span>,
          },
          {
            key: "amount",
            header: "Amount",
            render: (s) => <span>{s.amount ?? "—"}</span>,
          },
          {
            key: "notes",
            header: "Notes",
            cellClassName: "max-w-xs truncate text-muted-foreground",
            render: (s) => s.notes ?? "—",
          },
          {
            key: "package",
            header: "Package",
            render: (s) => <span>{s.package ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (s) => <StatusPill status={s.status} />,
          },
          {
            key: "type",
            header: "Type",
            render: (s) => <span>{s.type ?? "—"}</span>,
          },
          {
            key: "startDate",
            header: "Start",
            render: (s) => <span>{formatDate(s.startDate)}</span>,
          },
          {
            key: "endDate",
            header: "End",
            render: (s) => <span>{formatDate(s.endDate)}</span>,
          },
          {
            key: "createdAt",
            header: "Created",
            render: (s) => <span>{formatDate(s.createdAt)}</span>,
          },
        ]}
      />
    </div>
  );
}
