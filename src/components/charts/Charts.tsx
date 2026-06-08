"use client";
import React from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PALETTE = [
  "oklch(0.78 0.175 60)",
  "oklch(0.42 0.08 255)",
  "oklch(0.65 0.15 200)",
  "oklch(0.7 0.16 145)",
  "oklch(0.65 0.2 25)",
];

interface ChartShellProps {
  title: string;
  height?: number;
  children: React.ReactNode;
}

function ChartShell({ title, height = 280, children }: ChartShellProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

interface LineChartProps {
  title: string;
  data: Array<Record<string, string | number>>;
  lines: Array<{ key: string; name: string; color?: string }>;
  height?: number;
}

export function LineChartComponent({ title, data, lines, height }: LineChartProps) {
  return (
    <ChartShell title={title} height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l, i) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color ?? PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ChartShell>
  );
}

interface BarChartProps {
  title: string;
  data: Array<Record<string, string | number>>;
  bars: Array<{ key: string; name: string; color?: string }>;
  height?: number;
}

export function BarChartComponent({ title, data, bars, height }: BarChartProps) {
  return (
    <ChartShell title={title} height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name}
            fill={b.color ?? PALETTE[i % PALETTE.length]}
            radius={[6, 6, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartShell>
  );
}

interface PieChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  height?: number;
}

export function PieChartComponent({ title, data, height }: PieChartProps) {
  return (
    <ChartShell title={title} height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ChartShell>
  );
}
