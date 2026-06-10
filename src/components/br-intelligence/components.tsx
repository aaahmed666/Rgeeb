import { cn } from "@/lib/utils";

export function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (Math.min(100, score) / 100) * circumference;
  const color =
    score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="flex items-center gap-2">
      <svg
        width="100"
        height="100"
        className="transform"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all", color)}
        />
      </svg>
      <div className="text-center">
        <div className="text-lg font-bold">{Math.round(score)}</div>
        <div className="text-xs text-muted-foreground">of 100</div>
      </div>
    </div>
  );
}

export function Bar({
  value,
  good,
}: {
  value: number;
  good?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, value));
  const bgColor = good ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div className="flex flex-col gap-1">
      <div className="h-3 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", bgColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">{value.toFixed(1)}%</div>
    </div>
  );
}

export function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={cn("rounded-lg px-3 py-1 text-sm font-medium", color)}>
      {label}: <span className="font-bold">{value}</span>
    </div>
  );
}

export function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  if (values.length < 2) return <div className="h-8 w-24 bg-muted rounded" />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100 / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * width;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-8 w-24"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
