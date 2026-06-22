"use client";

import React, { useMemo, useState } from "react";
import { Building, Camera, Cpu, MapPin, Search, Plus, MoreVertical, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  location: string;
  camerasCount: number;
  activeServicesCount: number;
  status: "Online" | "Offline" | "Maintenance";
  bgUrl: string;
  tags: string[];
}

const MOCK_BRANCHES: Branch[] = [
  {
    id: "BR-001",
    name: "London Flagship",
    location: "Mayfair, London, UK",
    camerasCount: 24,
    activeServicesCount: 6,
    status: "Online",
    bgUrl: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=600&auto=format&fit=crop",
    tags: ["Queue Detection", "Heatmaps", "+4 more"],
  },
  {
    id: "BR-002",
    name: "NYC Midtown Hub",
    location: "Manhattan, New York",
    camerasCount: 56,
    activeServicesCount: 12,
    status: "Online",
    bgUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    tags: ["Facial Rec", "Footfall", "+8 more"],
  },
  {
    id: "BR-003",
    name: "Tokyo Shinjuku",
    location: "Shinjuku, Tokyo",
    camerasCount: 32,
    activeServicesCount: 0,
    status: "Offline",
    bgUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=600&auto=format&fit=crop",
    tags: ["Connection Lost"],
  },
  {
    id: "BR-004",
    name: "Paris Avenue",
    location: "Champs-Élysées, Paris",
    camerasCount: 18,
    activeServicesCount: 4,
    status: "Online",
    bgUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop",
    tags: ["Safety Monitor", "Asset Protect"],
  },
  {
    id: "BR-005",
    name: "Berlin Logistics",
    location: "Tegel, Berlin",
    camerasCount: 124,
    activeServicesCount: 15,
    status: "Online",
    bgUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop",
    tags: ["License Plate", "Dock Control", "+12 more"],
  },
  {
    id: "BR-006",
    name: "Silicon Valley Exp",
    location: "Palo Alto, California",
    camerasCount: 42,
    activeServicesCount: 9,
    status: "Online",
    bgUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    tags: ["Dwell Time", "Demographics"],
  },
];

export default function BranchesView() {
  const [search, setSearch] = useState("");

  const filteredBranches = useMemo(() => {
    return MOCK_BRANCHES.filter((b) => {
      return (
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search]);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Branches Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor branch configurations and camera nodes</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search specific branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-[40px]"
            />
          </div>
          <Button className="gap-2 h-[40px] px-4 font-semibold active:scale-95 transition-transform shrink-0">
            <Plus className="h-4 w-4" />
            New Branch
          </Button>
        </div>
      </div>

      {/* Statistics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-surface border border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1">Total Branches</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground leading-none">124</span>
              <span className="text-xs font-semibold text-emerald-500 flex items-center mb-0.5">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> 12%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1">Online Now</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground leading-none">118</span>
              <span className="text-xs font-semibold text-muted-foreground mb-0.5">/ 124</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1">Total Cameras</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground leading-none">2,842</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-surface border border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1">AI Utilization</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground leading-none">84%</span>
              <div className="flex-1 h-2 bg-muted rounded-full ml-4 mb-1 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "84%" }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <Card key={branch.id} className="overflow-hidden border border-border flex flex-col group hover:shadow-md transition-shadow">
            {/* Header image with status badge */}
            <div className="relative h-40 w-full overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url('${branch.bgUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 text-white flex items-center gap-1 border-0",
                    branch.status === "Online" ? "bg-emerald-500" : "bg-rose-500"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 bg-white rounded-full", branch.status === "Online" && "animate-pulse")} />
                  {branch.status}
                </Badge>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {branch.name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {branch.location}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Data boxes */}
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="bg-muted/40 p-3 rounded-lg border border-border/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Cameras</p>
                  <p className="text-lg font-bold text-foreground">{branch.camerasCount}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/30">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Active AI</p>
                  <p className="text-lg font-bold text-foreground">{branch.activeServicesCount}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {branch.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] font-medium px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded-full"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border shadow-sm mt-8">
        <p className="text-xs text-muted-foreground">Showing 6 of 124 branches</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-8 w-8 p-0 font-semibold">1</Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">2</Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">3</Button>
          <span className="px-1 text-muted-foreground text-xs">...</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">21</Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
