"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface BrIntelligenceFilterBarProps {
  activeService: string;
  onServiceChange: (service: string) => void;
  rankTop: 3 | 5 | 10;
  onRankTopChange: (rank: 3 | 5 | 10) => void;
  services: string[];
  openSection: string | null;
  onOpenSectionChange: (section: string | null) => void;
}

export function BrIntelligenceFilterBar({
  activeService,
  onServiceChange,
  rankTop,
  onRankTopChange,
  services,
  openSection,
  onOpenSectionChange,
}: BrIntelligenceFilterBarProps) {
  const { t } = useTranslation();

  const toggleSection = (section: string) => {
    onOpenSectionChange(openSection === section ? null : section);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Select value={activeService} onValueChange={onServiceChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(rankTop)}
          onValueChange={(v) => onRankTopChange(Number(v) as 3 | 5 | 10)}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Top 3</SelectItem>
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <button
        onClick={() => toggleSection("efficiency")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {openSection === "efficiency" ? "Hide" : "Show"} Details
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            openSection === "efficiency" ? "rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}
