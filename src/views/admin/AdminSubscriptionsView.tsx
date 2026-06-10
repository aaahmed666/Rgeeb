"use client";


import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { DataTable  } from "@/components/ui/data-table";
import { AdminPageHeader, StatusPill } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchAdminSubscriptions, fetchAdminActiveSubscriptions } from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString();
}

const COLUMNS = (t: (k: string) => string) => [
  { key: "userName",  header: t("admin.subscriptions.client"),  render: (s: Record<string, unknown>) => <span className="font-medium">{String(s.userName ?? "—")}</span> },
  { key: "userEmail", header: t("admin.subscriptions.user"),    render: (s: Record<string, unknown>) => <span className="text-sm text-muted-foreground">{String(s.userEmail ?? "—")}</span> },
  { key: "package",   header: t("admin.subscriptions.package"), render: (s: Record<string, unknown>) => <Badge variant="secondary">{String(s.package ?? "—")}</Badge> },
  { key: "price",     header: t("admin.subscriptions.amount"),  render: (s: Record<string, unknown>) => <span>{s.price != null ? `$${String(s.price)}` : "—"}</span> },
  { key: "status",    header: t("admin.subscriptions.status"),  render: (s: Record<string, unknown>) => <StatusPill status={s.status as string | undefined} /> },
  { key: "startDate", header: t("admin.subscriptions.startDate"), render: (s: Record<string, unknown>) => <span className="text-sm">{formatDate(s.startDate as string | undefined)}</span> },
  { key: "endDate",   header: t("admin.subscriptions.endDate"),   render: (s: Record<string, unknown>) => <span className="text-sm">{formatDate(s.endDate as string | undefined)}</span> },
  {
    key: "daysRemaining",
    header: t("admin.sub_daysLeft"),
    render: (s: Record<string, unknown>) => s.daysRemaining != null
      ? <span className={(s.daysRemaining as number) < 30 ? "text-destructive font-semibold" : ""}>{s.daysRemaining as number}d</span>
      : <span>—</span>,
  },
];

export default function AdminSubscriptionsView() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const allQ    = useQuery({ queryKey: ["admin", "subscriptions"],        queryFn: fetchAdminSubscriptions });
  const activeQ = useQuery({ queryKey: ["admin", "subscriptions-active"], queryFn: fetchAdminActiveSubscriptions });

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold">{t("errors.unauthorized", "Access Denied")}</p>
        </div>
      </div>
    );
  }

  // ISSUE-M08: search/filter state
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } =
    useDebounceSearch("", 300);

  const filteredAll = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return (allQ.data ?? []).filter((s) =>
      !q || [s.userName, s.userEmail, s.package].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [allQ.data, debouncedSearch]);

  const filteredActive = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return (activeQ.data ?? []).filter((s) =>
      !q || [s.userName, s.userEmail, s.package].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [activeQ.data, debouncedSearch]);

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
            {t("admin.sub_allTab")}
            {allQ.data && <Badge variant="secondary" className="ml-2">{allQ.data.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-500" />
            {t("admin.sub_activeTab")}
            {activeQ.data && <Badge variant="secondary" className="ml-2">{activeQ.data.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={filteredAll as unknown as (Record<string, unknown> & { id: string | number })[]}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder={t("admin.subscriptions.searchPlaceholder", "Search subscriptions…")}
            isLoading={allQ.isLoading}
            isError={allQ.isError}
            errorMessage={allQ.error instanceof Error ? allQ.error.message : t("admin.common.loadingFailed")}
            emptyMessage={t("admin.subscriptions_empty")}
            columns={COLUMNS(t)}
          />
        </TabsContent>

        <TabsContent value="active">
          <DataTable
            data={filteredActive as unknown as (Record<string, unknown> & { id: string | number })[]}
            isLoading={activeQ.isLoading}
            isError={activeQ.isError}
            errorMessage={activeQ.error instanceof Error ? activeQ.error.message : t("admin.common.loadingFailed")}
            emptyMessage={t("admin.subscriptions.activeSubscriptions")}
            columns={COLUMNS(t)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
