"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { AdminPageHeader, StatusPill } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchAdminSubscriptions, fetchAdminActiveSubscriptions } from "@/services/adminService";

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString();
}

const COLUMNS = [
  { key: "userName",  header: "Client",  render: (s: any) => <span className="font-medium">{s.userName ?? "—"}</span> },
  { key: "userEmail", header: "Email",   render: (s: any) => <span className="text-sm text-muted-foreground">{s.userEmail ?? "—"}</span> },
  { key: "package",   header: "Package", render: (s: any) => <Badge variant="secondary">{s.package ?? "—"}</Badge> },
  { key: "price",     header: "Price",   render: (s: any) => <span>{s.price != null ? `$${s.price}` : "—"}</span> },
  { key: "status",    header: "Status",  render: (s: any) => <StatusPill status={s.status} /> },
  { key: "startDate", header: "Start",   render: (s: any) => <span className="text-sm">{formatDate(s.startDate)}</span> },
  { key: "endDate",   header: "End",     render: (s: any) => <span className="text-sm">{formatDate(s.endDate)}</span> },
  {
    key: "daysRemaining",
    header: "Days Left",
    render: (s: any) => s.daysRemaining != null
      ? <span className={s.daysRemaining < 30 ? "text-destructive font-semibold" : ""}>{s.daysRemaining}d</span>
      : <span>—</span>,
  },
];

export default function AdminSubscriptionsView() {
  const allQ    = useQuery({ queryKey: ["admin", "subscriptions"],        queryFn: fetchAdminSubscriptions });
  const activeQ = useQuery({ queryKey: ["admin", "subscriptions-active"], queryFn: fetchAdminActiveSubscriptions });

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.subscriptions"
        Icon={CreditCard}
        onRefresh={() => { allQ.refetch(); activeQ.refetch(); }}
        isRefreshing={allQ.isFetching || activeQ.isFetching}
      />

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All Subscriptions
            {allQ.data && <Badge variant="secondary" className="ml-2">{allQ.data.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-500" />
            Active
            {activeQ.data && <Badge variant="secondary" className="ml-2">{activeQ.data.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={allQ.data ?? []}
            isLoading={allQ.isLoading}
            isError={allQ.isError}
            errorMessage={allQ.error instanceof Error ? allQ.error.message : "Failed to load"}
            emptyMessage="No subscriptions found"
            columns={COLUMNS}
          />
        </TabsContent>

        <TabsContent value="active">
          <DataTable
            data={activeQ.data ?? []}
            isLoading={activeQ.isLoading}
            isError={activeQ.isError}
            errorMessage={activeQ.error instanceof Error ? activeQ.error.message : "Failed to load"}
            emptyMessage="No active subscriptions"
            columns={COLUMNS}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
