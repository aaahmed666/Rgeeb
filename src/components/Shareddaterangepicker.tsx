"use client";

import * as React from "react";
import { DateRangePicker, DatePicker } from "rsuite";
import type { DateRange } from "rsuite/DateRangePicker";
import { useTranslation } from "react-i18next";
import { clampToToday, toLocalISODate } from "@/lib/utils";

type RangePreset = {
  label: string;
  value: DateRange;
  placement?: "left" | "bottom";
};

const d = (offset = 0): Date => {
  const dt = new Date();
  if (offset) dt.setDate(dt.getDate() + offset);
  // Never return a future date
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dt > today ? today : dt;
};

/**
 * Translated predefined date ranges.
 * Labels use i18n keys from the "dateRanges" namespace.
 * FIX: was hardcoded English labels — now uses useTranslation().
 */
function useRanges(): RangePreset[] {
  const { t } = useTranslation();
  return [
    {
      label: t("dateRanges.today", "Today"),
      value: [d(), d()],
      placement: "left",
    },
    {
      label: t("dateRanges.yesterday", "Yesterday"),
      value: (() => {
        const y = d(-1);
        return [y, new Date(y)] as DateRange;
      })(),
      placement: "left",
    },
    {
      label: t("dateRanges.thisWeek", "This Week"),
      value: (() => {
        const now = new Date();
        const s = new Date(now);
        s.setDate(now.getDate() - now.getDay());
        s.setHours(0, 0, 0, 0);
        return [s, new Date()] as DateRange;
      })(),
      placement: "left",
    },
    {
      label: t("dateRanges.lastWeek", "Last Week"),
      value: (() => {
        const now = new Date();
        const s = new Date(now);
        s.setDate(now.getDate() - now.getDay() - 7);
        s.setHours(0, 0, 0, 0);
        const e = new Date(s);
        e.setDate(s.getDate() + 6);
        e.setHours(23, 59, 59, 999);
        return [s, e] as DateRange;
      })(),
      placement: "left",
    },
    {
      label: t("dateRanges.thisMonth", "This Month"),
      value: [
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        new Date(),
      ] as DateRange,
      placement: "left",
    },
    {
      label: t("dateRanges.lastMonth", "Last Month"),
      value: [
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      ] as DateRange,
      placement: "left",
    },
    {
      label: t("dateRanges.thisYear", "This Year"),
      value: [
        new Date(new Date().getFullYear(), 0, 1),
        new Date(),
      ] as DateRange,
      placement: "left",
    },
    {
      label: t("dateRanges.lastYear", "Last Year"),
      value: [
        new Date(new Date().getFullYear() - 1, 0, 1),
        new Date(new Date().getFullYear() - 1, 11, 31),
      ] as DateRange,
      placement: "left",
    },
    {
      label: t("dateRanges.last7Days", "Last 7 Days"),
      value: [d(-7), d()] as DateRange,
      placement: "left",
    },
    {
      label: t("dateRanges.last30Days", "Last 30 Days"),
      value: [d(-30), d()] as DateRange,
      placement: "left",
    },
    {
      label: t("dateRanges.last365Days", "Last 365 Days"),
      value: [d(-365), d()] as DateRange,
      placement: "left",
    },
  ];
}

interface SharedDateRangePickerProps {
  /** DateRange mode: [startDate, endDate] */
  value?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  /** String mode: ISO date strings (YYYY-MM-DD) */
  from?: string;
  to?: string;
  onFromChange?: (v: string) => void;
  onToChange?: (v: string) => void;
  /**
   * Single-date mode ("one tab"). When true, renders a single rsuite DatePicker
   * instead of a range picker. Bind with `date` / `onDateChange` (ISO string)
   * or `singleValue` / `onSingleChange` (Date). Use the range props above for
   * the two-date ("two tab") case.
   */
  single?: boolean;
  date?: string;
  onDateChange?: (v: string) => void;
  singleValue?: Date | null;
  onSingleChange?: (v: Date | null) => void;
  label?: string;
  placeholder?: string;
  rtl?: boolean;
  className?: string;
}

const SharedDateRangePicker = ({
  value,
  onChange,
  from,
  to,
  onFromChange,
  onToChange,
  single = false,
  date,
  onDateChange,
  singleValue,
  onSingleChange,
  label,
  placeholder,
  rtl,
  className,
}: SharedDateRangePickerProps) => {
  const { t, i18n } = useTranslation();
  const ranges = useRanges();
  const isRtl = rtl ?? i18n.language === "ar";
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // When this picker lives inside a Radix dialog/sheet, render the rsuite
  // calendar popup INTO that dialog rather than document.body. A dialog sets
  // `pointer-events: none` outside its focus scope and creates its own stacking
  // context (via transform); a body-portalled popup can land behind it or be
  // unclickable. Portalling into the dialog keeps the calendar inside the
  // dialog's pointer-events + stacking scope so it opens and is interactive.
  const getContainer = React.useCallback((): HTMLElement => {
    const dialog = wrapRef.current?.closest<HTMLElement>(
      '[role="dialog"], [role="alertdialog"]'
    );
    return dialog ?? document.body;
  }, []);

  // Support both value/onChange (DateRange) AND from/to/onFromChange/onToChange (strings)
  const resolvedValue: DateRange | null =
    value !== undefined
      ? (value ?? null)
      : from || to
        ? [from ? new Date(from) : new Date(), to ? new Date(to) : new Date()]
        : null;

  const handleChange = (range: DateRange | null) => {
    // Clamp any future selection back to today before propagating.
    const clamped: DateRange | null = range
      ? [clampToToday(range[0]), clampToToday(range[1])]
      : null;
    if (onChange) {
      onChange(clamped);
    }
    if (onFromChange || onToChange) {
      onFromChange?.(clamped ? toLocalISODate(clamped[0]) : "");
      onToChange?.(clamped ? toLocalISODate(clamped[1]) : "");
    }
  };

  return (
    <div
      ref={wrapRef}
      className={[
        "rs-picker-wrap",
        // Default to full width, but let a caller-supplied width class win by
        // omitting w-full when className already sets a width (w-*, max-w-*).
        className && /(^|\s)(w-|max-w-)/.test(className) ? "" : "w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {label && (
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {label}
        </label>
      )}
      {single ? (
        <DatePicker
          format="MM/dd/yyyy"
          placeholder={placeholder || t("dashboard.selectDate", "Select Date")}
          value={
            singleValue !== undefined
              ? (singleValue ?? null)
              : date
                ? new Date(date)
                : null
          }
          onChange={(d: Date | null) => {
            const clamped = d ? clampToToday(d) : null;
            onSingleChange?.(clamped);
            onDateChange?.(clamped ? toLocalISODate(clamped) : "");
          }}
          shouldDisableDate={(d) => d > new Date()}
          block
          preventOverflow
          oneTap
          container={getContainer}
          placement="autoVerticalStart"
        />
      ) : (
        <DateRangePicker
          format="MM/dd/yyyy"
          placeholder={
            placeholder || t("dashboard.selectDateRange", "Select Date Range")
          }
          value={resolvedValue}
          onChange={handleChange}
          ranges={ranges}
          shouldDisableDate={(date) => date > new Date()}
          showHeader
          block
          preventOverflow
          showOneCalendar
          placement="autoVerticalStart"
          container={getContainer}
          locale={{ ok: t("common.apply", "Apply") }}
        />
      )}
    </div>
  );
};

export default SharedDateRangePicker;

// Named export for backward-compat
export const predefinedRanges: RangePreset[] = [
  { label: "Today", value: [d(), d()], placement: "left" },
  {
    label: "Yesterday",
    value: (() => {
      const y = d(-1);
      return [y, new Date(y)] as DateRange;
    })(),
    placement: "left",
  },
  {
    label: "This Week",
    value: (() => {
      const now = new Date();
      const s = new Date(now);
      s.setDate(now.getDate() - now.getDay());
      s.setHours(0, 0, 0, 0);
      return [s, new Date()] as DateRange;
    })(),
    placement: "left",
  },
  {
    label: "Last Week",
    value: (() => {
      const now = new Date();
      const s = new Date(now);
      s.setDate(now.getDate() - now.getDay() - 7);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return [s, e] as DateRange;
    })(),
    placement: "left",
  },
  {
    label: "This Month",
    value: [
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(),
    ] as DateRange,
    placement: "left",
  },
  {
    label: "Last Month",
    value: [
      new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    ] as DateRange,
    placement: "left",
  },
  {
    label: "This Year",
    value: [new Date(new Date().getFullYear(), 0, 1), new Date()] as DateRange,
    placement: "left",
  },
  { label: "Last 7 Days", value: [d(-7), d()] as DateRange, placement: "left" },
  {
    label: "Last 30 Days",
    value: [d(-30), d()] as DateRange,
    placement: "left",
  },
];

export { SharedDateRangePicker };
