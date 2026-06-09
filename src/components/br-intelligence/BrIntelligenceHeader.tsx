"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Brain,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RangeKey } from "./utils";

interface BrIntelligenceHeaderProps {
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
  branchId: string;
  onBranchChange: (id: string) => void;
  branches: Array<{ id: string; name: string }>;
}

export function BrIntelligenceHeader({
  range,
  onRangeChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  branchId,
  onBranchChange,
  branches,
}: BrIntelligenceHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-5 text-white shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-500/20 p-3 backdrop-blur-sm">
            <Brain className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">
              {t("intel.title", "Br Intelligence")}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {t(
                "intel.subtitle",
                "AI-powered branch performance scoring, rankings, and classification"
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={branchId} onValueChange={onBranchChange}>
            <SelectTrigger className="h-9 w-44 border-white/20 bg-white/10 text-white backdrop-blur-sm [&>svg]:text-white">
              <Building2 className="me-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("analytics.allBranches", "All Branches")}
              </SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg bg-white/10 p-1 backdrop-blur-sm">
            {(["7", "14", "30"] as RangeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => onRangeChange(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  range === k
                    ? "bg-white !text-slate-900"
                    : "text-white/85 hover:bg-white/10"
                )}
              >
                {k} {t("analytics.days", "Days")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/80">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <input
              type="date"
              value={customFrom}
              onChange={(e) => {
                onCustomFromChange(e.target.value);
                if (e.target.value && customTo) onRangeChange("custom");
              }}
              className="w-[112px] bg-transparent text-white/90 outline-none [color-scheme:dark]"
            />
            <span>→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => {
                onCustomToChange(e.target.value);
                if (e.target.value && customFrom) onRangeChange("custom");
              }}
              className="w-[112px] bg-transparent text-white/90 outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
