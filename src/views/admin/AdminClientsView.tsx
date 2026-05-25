"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import {
  AdminPageHeader,
  StatusPill,
} from "@/components/admin/AdminPageHeader";
import { fetchAdminUsers } from "@/services/adminService";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

export default function AdminClientsView() {
  const {
    searchValue: search,
    debouncedValue: debouncedSearch,
    handleSearchChange,
    clearSearch,
    isSearching,
  } = useDebounceSearch("", 300);
  const q = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });

  const filtered = useMemo(() => {
    const s = debouncedSearch.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((u) =>
      [u.name, u.email, u.phone, u.country, u.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q.data, debouncedSearch]);

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        titleKey="admin.clients"
        Icon={Users}
        onRefresh={() => q.refetch()}
        isRefreshing={q.isFetching}
      />
      <DataTable
        data={filtered}
        isLoading={q.isLoading}
        isError={q.isError}
        errorMessage={
          q.error instanceof Error ? q.error.message : "Failed to load"
        }
        emptyMessage="No clients found"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search clients…"
        columns={[
          {
            key: "user",
            header: "User",
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {u.avatar ? (
                    <AvatarImage
                      src={u.avatar}
                      alt={u.name}
                    />
                  ) : null}
                  <AvatarFallback>{u.name?.slice(0, 1) ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{u.name}</div>
                  {u.email ? (
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            render: (u) => <span className="text-sm">{u.phone ?? "—"}</span>,
          },
          {
            key: "country",
            header: "Country",
            render: (u) => <span className="text-sm">{u.country ?? "—"}</span>,
          },
          {
            key: "city",
            header: "City",
            render: (u) => <span className="text-sm">{u.city ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (u) => <StatusPill status={u.status} />,
          },
        ]}
      />
    </div>
  );
}
