/**
 * Pure chart-geometry helpers used by the hand-rolled SVG charts
 * (ChatAnalyticsView and friends). Extracted so the math is unit-testable
 * and the duplicate-tick / giant-bar / overlapping-label bugs can't regress.
 */

/* ── Axis ticks ──────────────────────────────────────────────────────────── */

export interface NiceScale {
  /** Ascending, de-duplicated tick values, always starting at 0. */
  ticks: number[];
  /** The top of the scale (≥ data max, with headroom). */
  niceMax: number;
}

/**
 * Produces integer y-axis ticks with no duplicates and a little headroom
 * above the data max — fixes the "0 1 1 2 2" repeated-label artifact that
 * appears when the data max is tiny (e.g. 2 conversations).
 */
export function niceTicks(dataMax: number, targetCount = 5): NiceScale {
  const max = Number.isFinite(dataMax) && dataMax > 0 ? dataMax : 1;
  const count = Math.max(2, targetCount);

  // Headroom so the line never sits flush against the top of the chart.
  const padded = max * 1.15;

  const rawStep = padded / (count - 1);
  const step = niceStep(rawStep);
  const niceMax = step * (count - 1) >= padded ? step * (count - 1) : step * count;

  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + 1e-9; v += step) {
    const rounded = step >= 1 ? Math.round(v) : Number(v.toFixed(2));
    if (ticks[ticks.length - 1] !== rounded) ticks.push(rounded);
  }
  return { ticks, niceMax };
}

/** Rounds a raw step up to a "nice" 1 / 2 / 2.5 / 5 × 10^k value (min 1). */
export function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  let nice: number;
  if (frac <= 1) nice = 1;
  else if (frac <= 2) nice = 2;
  else if (frac <= 2.5) nice = 2.5;
  else if (frac <= 5) nice = 5;
  else nice = 10;
  return Math.max(1, nice * pow);
}

/* ── Bars ────────────────────────────────────────────────────────────────── */

export interface BarLayout {
  /** Width of each category slot. */
  slotW: number;
  /** Rendered bar width — capped so a 1-bar chart isn't a giant slab. */
  barW: number;
}

/**
 * Lays out vertical bars. Caps the bar width so charts with one or two
 * categories (e.g. "Messages by Channel" with only "Web") render a slim,
 * centered column instead of a full-width rectangle.
 */
export function barLayout(
  pointCount: number,
  chartWidth: number,
  opts: { maxBarWidth?: number; minBarWidth?: number; fill?: number } = {},
): BarLayout {
  const { maxBarWidth = 48, minBarWidth = 8, fill = 0.55 } = opts;
  const n = Math.max(1, pointCount);
  const slotW = chartWidth / n;
  const barW = Math.min(maxBarWidth, Math.max(minBarWidth, slotW * fill));
  return { slotW, barW };
}

/**
 * How often to draw x-axis labels so they never collide:
 * returns N meaning "label every Nth point".
 */
export function labelStep(pointCount: number, maxLabels = 8): number {
  if (pointCount <= maxLabels) return 1;
  return Math.ceil(pointCount / maxLabels);
}

/* ── Donut ───────────────────────────────────────────────────────────────── */

export interface DonutSliceInput {
  label: string;
  value: number;
  color?: string;
}

export interface DonutSegment {
  d: string;
  color: string;
  label: string;
  value: number;
  /** 0–1 share of the total. */
  pct: number;
  /** "57.3%" — pre-formatted. */
  pctLabel: string;
  /** Mid-slice label anchor (centre of the band). */
  lx: number;
  ly: number;
  /** Mid-slice angle in radians (0 = top, increasing clockwise). Used to
   *  position outside callout labels and their leader lines. */
  mid: number;
  /** Only render the % callout when the slice is big enough to label. */
  showLabel: boolean;
}

export interface DonutGeometry {
  segments: DonutSegment[];
  total: number;
}

/**
 * Computes donut segment paths. Slices below `labelThreshold` share of the
 * total get `showLabel: false` so tiny slivers don't render overlapping
 * percentage text (their % still shows in the legend).
 */
export function donutSegments(
  slices: DonutSliceInput[],
  opts: {
    cx?: number;
    cy?: number;
    outerRadius?: number;
    innerRadius?: number;
    labelThreshold?: number;
    fallbackColor?: string;
  } = {},
): DonutGeometry {
  const {
    cx = 100,
    cy = 100,
    outerRadius: R = 78,
    innerRadius: r = 50,
    labelThreshold = 0.08,
    fallbackColor = "#94a3b8",
  } = opts;

  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const safeTotal = total || 1;
  let acc = 0;

  const segments = slices
    .map((s): DonutSegment | null => {
      const pct = Math.max(0, s.value) / safeTotal;
      const start = acc * Math.PI * 2;
      acc += pct;
      const end = acc * Math.PI * 2;
      if (end - start < 0.001) return null;

      // A single 100% slice needs two arcs (an arc can't span 360°).
      const fullCircle = pct >= 0.9999;
      const sweep = fullCircle ? end - 0.0001 : end;
      const large = sweep - start > Math.PI ? 1 : 0;

      const x1 = cx + R * Math.sin(start);
      const y1 = cy - R * Math.cos(start);
      const x2 = cx + R * Math.sin(sweep);
      const y2 = cy - R * Math.cos(sweep);
      const x3 = cx + r * Math.sin(sweep);
      const y3 = cy - r * Math.cos(sweep);
      const x4 = cx + r * Math.sin(start);
      const y4 = cy - r * Math.cos(start);

      const mid = (start + sweep) / 2;
      const labelR = (R + r) / 2;

      return {
        d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`,
        color: s.color ?? fallbackColor,
        label: s.label,
        value: s.value,
        pct,
        pctLabel: `${(pct * 100).toFixed(1)}%`,
        lx: cx + labelR * Math.sin(mid),
        ly: cy - labelR * Math.cos(mid),
        mid,
        showLabel: pct >= labelThreshold,
      };
    })
    .filter((p): p is DonutSegment => p !== null);

  return { segments, total };
}

/** Percentage (0–100, rounded) of `value` within `total`, safe for total=0. */
export function pctOf(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
