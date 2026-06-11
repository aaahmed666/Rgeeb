/**
 * chartMath unit tests
 * Locks in the fixes behind the Chat Analytics redesign:
 *  - no duplicate y-axis ticks for tiny data maxima ("0 1 1 2 2" bug)
 *  - headroom above the data max so lines don't hug the top
 *  - capped bar width so 1-category charts don't render a giant slab
 *  - x-label skipping for dense charts
 *  - donut geometry: tiny slices don't get in-slice labels, 100% slice works
 */

import {
  barLayout,
  donutSegments,
  labelStep,
  niceStep,
  niceTicks,
  pctOf,
} from "@/lib/chartMath";

describe("niceTicks", () => {
  it("never produces duplicate ticks for small maxima", () => {
    for (const max of [1, 2, 3, 4, 5]) {
      const { ticks } = niceTicks(max, 5);
      expect(new Set(ticks).size).toBe(ticks.length);
    }
  });

  it("starts at zero and is strictly ascending", () => {
    const { ticks } = niceTicks(2, 5);
    expect(ticks[0]).toBe(0);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
    }
  });

  it("adds headroom above the data max", () => {
    const { niceMax } = niceTicks(2, 5);
    expect(niceMax).toBeGreaterThan(2);
  });

  it("covers the data max for large values", () => {
    const { niceMax, ticks } = niceTicks(206, 5);
    expect(niceMax).toBeGreaterThanOrEqual(206);
    expect(ticks[ticks.length - 1]).toBe(niceMax);
  });

  it("handles zero / negative / NaN maxima without crashing", () => {
    for (const bad of [0, -5, NaN, Infinity * 0]) {
      const { ticks, niceMax } = niceTicks(bad, 5);
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      expect(niceMax).toBeGreaterThan(0);
    }
  });
});

describe("niceStep", () => {
  it("rounds up to 1 / 2 / 2.5 / 5 × 10^k", () => {
    expect(niceStep(0.7)).toBe(1);
    expect(niceStep(1.4)).toBe(2);
    expect(niceStep(30)).toBe(50);
    expect(niceStep(80)).toBe(100);
  });

  it("never returns less than 1 (integer axes)", () => {
    expect(niceStep(0.001)).toBeGreaterThanOrEqual(1);
    expect(niceStep(-3)).toBe(1);
    expect(niceStep(NaN)).toBe(1);
  });
});

describe("barLayout", () => {
  it("caps bar width for single-category charts", () => {
    const { barW } = barLayout(1, 400);
    expect(barW).toBeLessThanOrEqual(48);
  });

  it("respects a custom max width", () => {
    const { barW } = barLayout(2, 400, { maxBarWidth: 28 });
    expect(barW).toBeLessThanOrEqual(28);
  });

  it("keeps a minimum width for very dense charts", () => {
    const { barW } = barLayout(100, 400);
    expect(barW).toBeGreaterThanOrEqual(8);
  });

  it("splits the width into equal slots", () => {
    const { slotW } = barLayout(4, 400);
    expect(slotW).toBe(100);
  });
});

describe("labelStep", () => {
  it("shows every label when there is room", () => {
    expect(labelStep(5, 8)).toBe(1);
  });

  it("skips labels when crowded", () => {
    expect(labelStep(24, 8)).toBe(3);
    expect(labelStep(9, 6)).toBe(2);
  });
});

describe("donutSegments", () => {
  const langs = [
    { label: "en", value: 88, color: "#1e3a8a" },
    { label: "ar", value: 118, color: "#0ea5e9" },
  ];

  it("computes the total and per-slice percentages", () => {
    const { segments, total } = donutSegments(langs);
    expect(total).toBe(206);
    expect(segments).toHaveLength(2);
    expect(segments[0].pctLabel).toBe("42.7%");
    expect(segments[1].pctLabel).toBe("57.3%");
  });

  it("hides in-slice labels for slivers below the threshold", () => {
    const { segments } = donutSegments(
      [
        { label: "big", value: 95 },
        { label: "tiny", value: 5 },
      ],
      { labelThreshold: 0.1 },
    );
    expect(segments[0].showLabel).toBe(true);
    expect(segments[1].showLabel).toBe(false);
  });

  it("drops zero-value slices entirely", () => {
    const { segments } = donutSegments([
      { label: "a", value: 10 },
      { label: "b", value: 0 },
    ]);
    expect(segments.map((s) => s.label)).toEqual(["a"]);
  });

  it("renders a single 100% slice with a valid (finite) path", () => {
    const { segments } = donutSegments([{ label: "only", value: 42 }]);
    expect(segments).toHaveLength(1);
    expect(segments[0].pct).toBeCloseTo(1);
    expect(segments[0].d).not.toMatch(/NaN/);
  });

  it("survives an all-zero dataset", () => {
    const { segments, total } = donutSegments([
      { label: "a", value: 0 },
      { label: "b", value: 0 },
    ]);
    expect(total).toBe(0);
    expect(segments).toHaveLength(0);
  });

  it("uses the fallback color when a slice has none", () => {
    const { segments } = donutSegments([{ label: "x", value: 1 }], {
      fallbackColor: "#abcdef",
    });
    expect(segments[0].color).toBe("#abcdef");
  });
});

describe("pctOf", () => {
  it("rounds to whole percentages", () => {
    expect(pctOf(88, 206)).toBe(43);
    expect(pctOf(118, 206)).toBe(57);
  });

  it("is safe for a zero total", () => {
    expect(pctOf(5, 0)).toBe(0);
  });
});
