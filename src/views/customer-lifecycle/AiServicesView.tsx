"use client";

import React, { useState } from "react";
import { Cpu, Search, CheckCircle, Lock, ShieldAlert, ShieldCheck, Mail, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AiService {
  name: string;
  description: string;
  status: "Active" | "Inactive";
  activationDate: string;
  camerasAssigned: number;
  tier: string;
  icon: string;
}

const MOCK_AI_SERVICES: AiService[] = [
  { name: "PPE Detection", description: "Real-time monitoring for hard hats, safety vests, and protective eyewear compliance.", status: "Active", activationDate: "Jan 12, 2024", camerasAssigned: 42, tier: "Subscribed Enterprise Tier", icon: "engineering" },
  { name: "Smoke & Fire", description: "Advanced visual detection of smoke plumes and open flames in high-risk zones.", status: "Active", activationDate: "Feb 04, 2024", camerasAssigned: 18, tier: "Subscribed Enterprise Tier", icon: "local_fire_department" },
  { name: "Intrusion Detection", description: "Perimeter protection with intelligent human vs animal differentiation for alert reduction.", status: "Active", activationDate: "Dec 20, 2023", camerasAssigned: 64, tier: "Subscribed Enterprise Tier", icon: "visibility" },
  { name: "LPR Recognition", description: "Automatic identification of vehicle license plates for parking and access management.", status: "Active", activationDate: "Mar 15, 2024", camerasAssigned: 8, tier: "Subscribed Standard Tier", icon: "directions_car" },
  { name: "Crowd Analysis", description: "Density mapping and social distancing compliance for large retail or public areas.", status: "Inactive", activationDate: "—", camerasAssigned: 0, tier: "Upgrade Required", icon: "groups" },
  { name: "Abandoned Object", description: "Detects stationary objects left unattended in high-traffic security sensitive areas.", status: "Active", activationDate: "Jan 30, 2024", camerasAssigned: 12, tier: "Subscribed Enterprise Tier", icon: "luggage" },
  { name: "Fall Detection", description: "Immediate alerting for personnel or visitor falls in slippery or dangerous work zones.", status: "Active", activationDate: "Feb 15, 2024", camerasAssigned: 24, tier: "Subscribed Enterprise Tier", icon: "personal_injury" },
  { name: "Spatial Heatmaps", description: "Visualizing floor traffic patterns to optimize layout and identify high-friction zones.", status: "Active", activationDate: "Mar 01, 2024", camerasAssigned: 18, tier: "Subscribed Enterprise Tier", icon: "thermostat" }
];

export default function AiServicesView() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_AI_SERVICES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Operational overview ofsubscribed AI modules and coverage</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search AI services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-[40px]"
          />
        </div>
      </div>

      {/* Header Summary Cards */}
      <div className="flex flex-wrap gap-4 justify-end">
        <Card className="bg-surface border border-border px-6 py-4 flex items-center gap-4 min-w-[200px]">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Services</span>
            <span className="text-2xl font-bold text-foreground">08</span>
          </div>
        </Card>
        <Card className="bg-surface border border-border px-6 py-4 flex items-center gap-4 min-w-[200px]">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Coverage</span>
            <span className="text-2xl font-bold text-foreground">124</span>
          </div>
        </Card>
      </div>

      {/* Grid of AI Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((service) => {
          const isActive = service.status === "Active";
          return (
            <Card key={service.name} className={cn("overflow-hidden border border-border flex flex-col hover:shadow-md transition-shadow", !isActive && "opacity-75 grayscale-[0.5]")}>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-0 flex items-center gap-1",
                      isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                    {service.status}
                  </Badge>
                </div>

                <h4 className="text-base font-bold text-foreground mb-1">{service.name}</h4>
                <p className="text-xs text-muted-foreground mb-6 line-clamp-2">{service.description}</p>

                <div className="space-y-3 pt-4 border-t border-border mt-auto">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Activation Date</span>
                    <span className="font-semibold text-foreground">{service.activationDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Cameras Assigned</span>
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <span>{service.camerasAssigned} Units</span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 px-6 py-3 border-t border-border flex items-center gap-2">
                {isActive ? (
                  <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0" />
                ) : (
                  <Lock className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                )}
                <span className={cn("text-[10px] font-bold", isActive ? "text-primary" : "text-muted-foreground")}>
                  {service.tier}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer info box */}
      <div className="p-6 rounded-xl bg-primary text-primary-foreground flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm mt-8">
        <div className="flex-1">
          <h4 className="font-bold text-white text-base">Need to expand your AI capabilities?</h4>
          <p className="text-xs text-white/80 mt-1 max-w-xl">Contact your dedicated account manager to discuss custom model training or to enable additional standard analytics modules for your specific operational needs.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto shrink-0 justify-end">
          <div className="bg-white/10 px-4 py-2.5 rounded-lg border border-white/10 text-xs">
            <span className="block text-[8px] uppercase tracking-widest text-white/50 mb-0.5">Billing Support</span>
            <span className="font-bold text-white">billing@rgeeb.ai</span>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-lg border border-white/10 text-xs">
            <span className="block text-[8px] uppercase tracking-widest text-white/50 mb-0.5">Tech Advisor</span>
            <span className="font-bold text-white">support@rgeeb.ai</span>
          </div>
        </div>
      </div>
    </div>
  );
}
