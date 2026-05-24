"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
            <span className="text-muted-foreground">API Requests</span>
            <span className="font-medium">
              {p.usage.requests.toLocaleString()} / {p.quota.requests.toLocaleString()}
            </span>
          </div>
          <Progress value={pct} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Tokens</span>
          <span className="font-medium">{p.usage.tokens.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Daily</p>
            <p className="font-semibold">${p.cost.daily.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="font-semibold">${p.cost.monthly.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Last used: {p.lastUsed}</p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={p.onConfigure}>
            Configure
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={p.onDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
