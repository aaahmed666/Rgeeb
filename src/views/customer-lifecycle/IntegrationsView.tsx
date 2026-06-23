"use client";

import React, { useState } from "react";
import { Search, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  status: "Connected" | "In Progress" | "Error";
  connectionDate: string;
  lastSync: string;
  progress: number;
  iconUrl?: string;
  iconFallback?: string;
}

interface IntegrationLog {
  id: string;
  timestamp: string;
  source: string;
  eventType: string;
  status: "Success" | "Failed";
  statusDetails: string;
  payloadSize: string;
}

const MOCK_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "foodics",
    name: "Foodics",
    description: "Enterprise POS and Inventory synchronization for hospitality outlets.",
    status: "Connected",
    connectionDate: "Jan 12, 2024",
    lastSync: "2 mins ago",
    progress: 100,
    iconUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaH-U-3w4K4CjkWK5UGRbNudfOiS3KuZNknFrcSsF5r5pHysouay0zC8cq_M0ExZW-g0hhcCmTsx3vfl4eUd_YBSC3HVSf3fs8_b8HYoswZB6pTLCWtGxyk_f_Hqi24j6_4wtQ7XE8p0-Dzc5_Y8vPERrtj7xUBbsA84a3KjSIKzQN2OwiYbu33lbyYyqN9c8S5ZDYH2LB2_jQTENxzDSMwVPsPuddJBJA5hpqLleJhDu7vS2gC9qPvB9UaRIyKdx4TYBN36uhTM99",
  },
  {
    id: "odoo",
    name: "Odoo",
    description: "Full stack ERP integration for accounting, CRM, and lifecycle analytics.",
    status: "Connected",
    connectionDate: "Feb 05, 2024",
    lastSync: "1 hour ago",
    progress: 67,
    iconUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgzVWaRSChDwTCv0h97pXmupZjOLkEapmJx8hBSVJi31dKEGN0d3Nu55ck3u699kK0fTFxUb4JAB0ugX1IsOS0vjdqIM3zZJBjWCtFk_xh_KL3II5aTm1r2yY4horBmf-cUUGr3GHU6PgrDwa_PG-2M-pC2_GlCguFNdGsem9qItWP6C9YWcwBZvzv-ntSyLfowCBnFMkCbbOw-1CIMgffBMR4sSBYBaWsd2cB7xBAL7D5vIB17duJc3I0lgc3P1MpdiBvMfIa6jv8",
  },
  {
    id: "pos",
    name: "Generic POS",
    description: "Web-hook based synchronization for legacy point-of-sale terminals.",
    status: "Error",
    connectionDate: "Nov 30, 2023",
    lastSync: "Failed",
    progress: 0,
    iconFallback: "point_of_sale",
  },
];

const MOCK_LOGS: IntegrationLog[] = [
  { id: "1", timestamp: "2024-05-24 14:32:01", source: "Foodics", eventType: "Transaction.Completed", status: "Success", statusDetails: "Success", payloadSize: "1.2 KB" },
  { id: "2", timestamp: "2024-05-24 14:28:45", source: "Odoo", eventType: "Inventory.Update", status: "Success", statusDetails: "Success", payloadSize: "45.8 KB" },
  { id: "3", timestamp: "2024-05-24 14:15:12", source: "Generic POS", eventType: "Session.Auth", status: "Failed", statusDetails: "Auth Timeout", payloadSize: "0.0 KB" },
  { id: "4", timestamp: "2024-05-24 13:55:00", source: "Odoo", eventType: "Customer.ProfileSync", status: "Success", statusDetails: "Success", payloadSize: "8.4 KB" },
];

export default function IntegrationsView() {
  const { t } = useTranslation();
  const { searchValue: search, debouncedValue: debouncedSearch, handleSearchChange } = useDebounceSearch("", 300);
  const [filterStatus, setFilterStatus] = useState<"All" | "Success" | "Failed">("All");

  const filteredIntegrations = MOCK_INTEGRATIONS.filter((item) =>
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredLogs = MOCK_LOGS.filter((log) => {
    if (filterStatus === "All") return true;
    return log.status === filterStatus;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("customerLifecycle.integrations", "Integrations")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("integrations.subtitle", "Read-only connection status and synchronization events.")}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.searchPlaceholder", "Search...")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-9 h-[40px]"
          />
        </div>
      </div>

      {/* Summary KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border border-border">
          <span className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
            {t("integrations.totalConnections", "Total Connections")}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-foreground">12</span>
            <span className="text-[var(--status-success)] text-xs font-bold flex items-center">↑ 2</span>
          </div>
        </Card>
        <Card className="p-6 border border-border">
          <span className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
            {t("integrations.activeSyncs", "Active Syncs")}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-foreground">11</span>
            <span className="text-muted-foreground text-xs italic">91.6%</span>
          </div>
        </Card>
        <Card className="p-6 border border-border">
          <span className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
            {t("integrations.dataThroughput", "Data Throughput")}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-foreground">4.2</span>
            <span className="text-muted-foreground text-xs font-medium">GB/day</span>
          </div>
        </Card>
        <Card className="p-6 border border-border">
          <span className="block text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
            {t("integrations.syncErrors", "Sync Errors")}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-destructive">1</span>
            <span className="text-destructive text-xs font-bold">{t("integrations.critical", "Critical")}</span>
          </div>
        </Card>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((item) => {
          const isError = item.status === "Error";
          return (
            <Card key={item.id} className="relative overflow-hidden border border-border flex flex-col hover:shadow-md transition-shadow">
              {isError && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[0.5px] flex items-center justify-center z-10">
                  <div className="bg-background border border-border p-4 rounded-xl shadow-xl text-center transform -rotate-2">
                    <AlertTriangle className="h-6 w-6 text-[var(--status-warning)] mx-auto mb-1 animate-pulse" />
                    <p className="font-bold text-foreground text-sm">{t("integrations.disconnected", "Disconnected")}</p>
                    <p className="text-xs text-muted-foreground">{t("integrations.actionRequired", "Action Required")}</p>
                  </div>
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center p-2 border border-border overflow-hidden">
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-muted-foreground text-2xl">point_of_sale</span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border-0 flex items-center gap-1",
                      isError
                        ? "bg-[var(--status-danger)]/10 text-[var(--status-danger)]"
                        : "bg-[var(--status-success)]/10 text-[var(--status-success)]"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isError ? "bg-[var(--status-danger)]" : "bg-[var(--status-success)]")} />
                    {isError ? t("integrations.errorStatus", "Error") : t("integrations.connectedStatus", "Connected")}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed flex-1">{item.description}</p>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">{t("integrations.connectionDate", "Connection Date")}</span>
                    <span className="font-semibold text-foreground">{item.connectionDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">{t("integrations.lastSync", "Last Sync")}</span>
                    <span className={cn("font-semibold", isError ? "text-destructive font-bold" : "text-foreground")}>{item.lastSync}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-muted-foreground">{t("integrations.syncProgress", "Sync Progress")}</span>
                    <span className="text-foreground">{item.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500", isError ? "bg-[var(--status-danger)]" : "bg-[var(--status-success)]")}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3 z-20 relative">
                <Button variant="outline" size="sm" className="flex-1 cursor-default" disabled>
                  {t("common.configure", "Configure")}
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 cursor-default" disabled>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Integration Logs */}
      <Card className="border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <h3 className="font-bold text-base text-foreground">{t("integrations.logsTitle", "Integration Logs")}</h3>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("All")}
              className="text-xs h-8 cursor-pointer"
            >
              {t("integrations.allEvents", "All Events")}
            </Button>
            <Button
              variant={filterStatus === "Success" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("Success")}
              className="text-xs h-8 cursor-pointer"
            >
              {t("common.success", "Success")}
            </Button>
            <Button
              variant={filterStatus === "Failed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("Failed")}
              className="text-xs h-8 cursor-pointer"
            >
              {t("integrations.errors", "Errors")}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{t("common.date", "Timestamp")}</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{t("integrations.source", "Source")}</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{t("integrations.eventType", "Event Type")}</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{t("common.status", "Status")}</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{t("integrations.payloadSize", "Payload Size")}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const isFailed = log.status === "Failed";
                return (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{log.timestamp}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{log.source}</td>
                    <td className="px-6 py-4 text-foreground">{log.eventType}</td>
                    <td className="px-6 py-4">
                      <span className={cn("flex items-center gap-1 font-medium", isFailed ? "text-[var(--status-danger)]" : "text-[var(--status-success)]")}>
                        {isFailed ? (
                          <XCircle className="h-4 w-4 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        )}
                        {log.statusDetails}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{log.payloadSize}</td>
                    <td className="px-6 py-4 text-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-muted/10 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <p>{t("integrations.showingEvents", "Showing {{count}} of 248 events", { count: filteredLogs.length, total: 248 })}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
