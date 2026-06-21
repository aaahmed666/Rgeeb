"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface AIServiceCardProps {
  name: string;
  provider: string;
  status: "active" | "inactive" | "error";
  usage: { requests: number; tokens: number };
  quota: { requests: number; tokens: number };
  cost: { daily: number; monthly: number };
  lastUsed: string;
  onConfigure?: () => void;
  onDisconnect?: () => void;
}

const STATUS_STYLES: Record<AIServiceCardProps["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-600",
  inactive: "bg-muted text-muted-foreground",
  error: "bg-destructive/15 text-destructive",
};

export function AIServiceCard(p: AIServiceCardProps) {
  const { t } = useTranslation();
  const pct = Math.min(100, (p.usage.requests / p.quota.requests) * 100);
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{p.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{p.provider}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[p.status]}`}
        >
          {p.status}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("aiServices.apiRequests")}</span>
            <span className="font-medium">
              {p.usage.requests.toLocaleString()} / {p.quota.requests.toLocaleString()}
            </span>
          </div>
          <Progress value={pct} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t("aiServices.tokens")}</span>
          <span className="font-medium">{p.usage.tokens.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{t("aiServices.daily")}</p>
            <p className="font-semibold">${p.cost.daily.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{t("aiServices.monthly")}</p>
            <p className="font-semibold">${p.cost.monthly.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Last used: {p.lastUsed}</p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={p.onConfigure}>
            {t("aiServices.configure")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={p.onDisconnect}
          >
            {t("aiServices.disconnect")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
