"use client";

import React, { useMemo, useState } from "react";
import { Camera, Search, Plus, PlayCircle, Edit, ShieldAlert, AlertTriangle, HardDrive, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

interface CameraNode {
  id: string;
  name: string;
  label: string;
  branchName: string;
  status: "Online" | "Warning" | "Offline";
  streamQuality: string;
  bgUrl: string;
}

const MOCK_CAMERAS: CameraNode[] = [
  { id: "CAM-001-DWNTN", name: "Main Entrance - Front", label: "Entrance", branchName: "Downtown Center", status: "Online", streamQuality: "4K / 30FPS", bgUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=150&auto=format&fit=crop" },
  { id: "CAM-042-WST", name: "Prep Area 02", label: "Kitchen", branchName: "Westside Hub", status: "Warning", streamQuality: "1080P / 12FPS", bgUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=150&auto=format&fit=crop" },
  { id: "CAM-009-DWNTN", name: "Register 01", label: "Cashier", branchName: "Downtown Center", status: "Online", streamQuality: "4K / 30FPS", bgUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=150&auto=format&fit=crop" },
  { id: "CAM-112-EGT", name: "Drive-Thru Menu", label: "Drive Thru", branchName: "East Gate Park", status: "Offline", streamQuality: "N/A", bgUrl: "https://images.unsplash.com/photo-1549497538-30122548f37a?q=80&w=150&auto=format&fit=crop" },
  { id: "CAM-033-NW", name: "South Parking Row D", label: "Parking", branchName: "North Wharf", status: "Online", streamQuality: "1080P / 24FPS", bgUrl: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?q=80&w=150&auto=format&fit=crop" },
];

export default function CamerasView() {
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState("All Labels");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const filteredCameras = useMemo(() => {
    return MOCK_CAMERAS.filter((c) => {
      const matchesSearch =
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase());
      const matchesLabel = labelFilter === "All Labels" || c.label === labelFilter;
      const matchesBranch = branchFilter === "All Branches" || c.branchName === branchFilter;
      const matchesStatus = statusFilter === "All Status" || c.status === statusFilter;
      return matchesSearch && matchesLabel && matchesBranch && matchesStatus;
    });
  }, [search, labelFilter, branchFilter, statusFilter]);

  const columns: DataTableColumn<CameraNode>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Camera Name",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-muted rounded overflow-hidden shrink-0 border border-border">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${row.bgUrl}')` }}
              />
            </div>
            <div>
              <p className="font-semibold text-primary text-sm leading-tight">{row.id}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{row.name}</p>
            </div>
          </div>
        ),
      },
      {
        key: "label",
        header: "Label",
        render: (row) => (
          <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-muted border border-border rounded">
            {row.label}
          </Badge>
        ),
      },
      {
        key: "branchName",
        header: "Branch",
        render: (row) => <span className="text-sm font-medium">{row.branchName}</span>,
      },
      {
        key: "status",
        header: "Connection",
        render: (row) => {
          const isOnline = row.status === "Online";
          const isWarning = row.status === "Warning";
          return (
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500"
              )} />
              <span className={cn(
                "text-xs font-semibold",
                isOnline ? "text-emerald-600 dark:text-emerald-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {row.status}
              </span>
            </div>
          );
        },
      },
      {
        key: "streamQuality",
        header: "Stream Quality",
        render: (row) => {
          const isOnline = row.status === "Online";
          const isWarning = row.status === "Warning";
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">{row.streamQuality}</span>
              {isOnline ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : isWarning ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              disabled={row.status === "Offline"}
              className={cn("h-8 w-8 text-primary", row.status === "Offline" && "opacity-30 cursor-not-allowed")}
              title="Live View"
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
        headClassName: "text-right",
        cellClassName: "text-right",
      },
    ],
    []
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1440px] mx-auto w-full">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cameras Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor live camera feeds across all branches</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Camera ID or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-[40px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Label</span>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none min-w-[120px] h-[40px] cursor-pointer"
            >
              <option>All Labels</option>
              <option>Entrance</option>
              <option>Kitchen</option>
              <option>Cashier</option>
              <option>Drive Thru</option>
              <option>Parking</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Branch</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none min-w-[140px] h-[40px] cursor-pointer"
            >
              <option>All Branches</option>
              <option>Downtown Center</option>
              <option>Westside Hub</option>
              <option>East Gate Park</option>
              <option>North Wharf</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none min-w-[120px] h-[40px] cursor-pointer"
            >
              <option>All Status</option>
              <option>Online</option>
              <option>Warning</option>
              <option>Offline</option>
            </select>
          </div>

          <Button className="gap-2 h-[40px] px-4 font-semibold active:scale-95 transition-transform mt-4 md:mt-0">
            <Plus className="h-4 w-4" />
            Add Camera
          </Button>
        </div>
      </div>

      {/* Camera List Table */}
      <DataTable
        title="Diagnostic Camera Feed List"
        columns={columns}
        data={filteredCameras}
        emptyMessage="No cameras match selected filters"
      />

      {/* Asymmetric Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-surface border border-border shadow-sm flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">System Uptime</p>
            <h4 className="text-xl font-bold text-foreground mt-0.5">99.82%</h4>
          </div>
        </Card>
        <Card className="bg-surface border border-border shadow-sm flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending Alerts</p>
            <h4 className="text-xl font-bold text-foreground mt-0.5">04</h4>
          </div>
        </Card>
        <Card className="bg-surface border border-border shadow-sm flex items-center gap-4 p-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 shrink-0">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Storage Health</p>
            <h4 className="text-xl font-bold text-foreground mt-0.5">82.4 TB Free</h4>
          </div>
        </Card>
      </div>
    </div>
  );
}
