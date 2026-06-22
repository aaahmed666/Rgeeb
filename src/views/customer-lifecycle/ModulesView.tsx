"use client";

import React, { useState } from "react";
import { Package, Search, CheckCircle, ShieldCheck, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ModuleItem {
  name: string;
  description: string;
  status: "Active" | "Inactive";
  version: string;
  lastSynced: string;
  activationDate: string;
}

const MOCK_MODULES: ModuleItem[] = [
  { name: "Task Management", description: "Automated standard operating procedure (SOP) violations, tasks creation, and assignments to staff.", status: "Active", version: "v2.1.0", lastSynced: "10 mins ago", activationDate: "Jan 12, 2024" },
  { name: "Foodics Integration Module", description: "Synchronize POS orders, footfall data, and checkout analytics with Rgeeb video processing.", status: "Active", version: "v1.4.5", lastSynced: "Just now", activationDate: "Feb 10, 2024" },
  { name: "Odoo ERP Connector", description: "Automated warehouse stocks, inventory audits, and employee presence syncing with Odoo ERP.", status: "Inactive", version: "v1.0.0", lastSynced: "—", activationDate: "—" },
];

export default function ModulesView() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_MODULES.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Modules</h1>
          <p className="text-sm text-muted-foreground mt-1">Read-only overview of platform extensions and integrated business modules</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-[40px]"
          />
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const isActive = item.status === "Active";
          return (
            <Card key={item.name} className={cn("overflow-hidden border border-border flex flex-col hover:shadow-md transition-shadow", !isActive && "opacity-75 grayscale-[0.5]")}>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-0 flex items-center gap-1",
                      isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                    {item.status}
                  </Badge>
                </div>

                <h4 className="text-base font-bold text-foreground mb-1">{item.name}</h4>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{item.description}</p>

                <div className="space-y-3 pt-4 border-t border-border mt-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-semibold text-foreground">{item.version}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Activation Date</span>
                    <span className="font-semibold text-foreground">{item.activationDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Last Synced</span>
                    <span className="font-semibold text-foreground">{item.lastSynced}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 px-6 py-3 border-t border-border flex items-center gap-2">
                <ShieldCheck className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[10px] font-bold", isActive ? "text-primary" : "text-muted-foreground")}>
                  {isActive ? "Authorized Module" : "Locked / Requires Setup"}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
