"use client";

import { DateRangePicker } from "rsuite";
import type { DateRange } from "rsuite/DateRangePicker";
import { useTranslation } from "react-i18next";

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
    { label: t("dateRanges.today",      "Today"),           value: [d(), d()], placement: "left" },
    { label: t("dateRanges.yesterday",  "Yesterday"),       value: (() => { const y = d(-1); return [y, new Date(y)] as DateRange; })(), placement: "left" },
    { label: t("dateRanges.thisWeek",   "This Week"),       value: (() => { const now = new Date(); const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); return [s, new Date()] as DateRange; })(), placement: "left" },
    { label: t("dateRanges.lastWeek",   "Last Week"),       value: (() => { const now = new Date(); const s = new Date(now); s.setDate(now.getDate() - now.getDay() - 7); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return [s, e] as DateRange; })(), placement: "left" },
    { label: t("dateRanges.thisMonth",  "This Month"),      value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] as DateRange, placement: "left" },
    { label: t("dateRanges.lastMonth",  "Last Month"),      value: [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth(), 0)] as DateRange, placement: "left" },
    { label: t("dateRanges.thisYear",   "This Year"),       value: [new Date(new Date().getFullYear(), 0, 1), new Date()] as DateRange, placement: "left" },
    { label: t("dateRanges.lastYear",   "Last Year"),       value: [new Date(new Date().getFullYear() - 1, 0, 1), new Date(new Date().getFullYear() - 1, 11, 31)] as DateRange, placement: "left" },
    { label: t("dateRanges.last7Days",  "Last 7 Days"),     value: [d(-7), d()] as DateRange, placement: "left" },
    { label: t("dateRanges.last30Days", "Last 30 Days"),    value: [d(-30), d()] as DateRange, placement: "left" },
    { label: t("dateRanges.last365Days","Last 365 Days"),   value: [d(-365), d()] as DateRange, placement: "left" },
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
  label,
  placeholder,
  rtl,
  className,
}: SharedDateRangePickerProps) => {
  const { t, i18n } = useTranslation();
  const ranges = useRanges();
  const isRtl = rtl ?? i18n.language === "ar";

  // Support both value/onChange (DateRange) AND from/to/onFromChange/onToChange (strings)
  const resolvedValue: DateRange | null =
    value !== undefined
      ? (value ?? null)
      : from || to
        ? [
            from ? new Date(from) : new Date(),
            to   ? new Date(to)   : new Date(),
          ]
        : null;

  const handleChange = (range: DateRange | null) => {
    if (onChange) {
      onChange(range);
    }
    if (onFromChange || onToChange) {
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      onFromChange?.(range ? fmt(range[0]) : "");
      onToChange?.(range ? fmt(range[1]) : "");
    }
  };

  return (
    <div
      className={["rs-picker-wrap w-full", className].filter(Boolean).join(" ")}
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
      <DateRangePicker
        format="MM/dd/yyyy"
        placeholder={placeholder || t("dashboard.selectDateRange", "Select Date Range")}
        value={resolvedValue}
        onChange={handleChange}
        ranges={ranges}
        shouldDisableDate={(date) => date > new Date()}
        showHeader
        block
        preventOverflow
        showOneCalendar
        placement="autoVerticalStart"
        locale={{ ok: t("common.apply", "Apply") }}
      />
    </div>
  );
};

export default SharedDateRangePicker;

// Named export for backward-compat
export const predefinedRanges: RangePreset[] = [
  { label: "Today",        value: [d(), d()], placement: "left" },
  { label: "Yesterday",    value: (() => { const y = d(-1); return [y, new Date(y)] as DateRange; })(), placement: "left" },
  { label: "This Week",    value: (() => { const now = new Date(); const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); return [s, new Date()] as DateRange; })(), placement: "left" },
  { label: "Last Week",    value: (() => { const now = new Date(); const s = new Date(now); s.setDate(now.getDate() - now.getDay() - 7); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return [s, e] as DateRange; })(), placement: "left" },
  { label: "This Month",   value: [new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()] as DateRange, placement: "left" },
  { label: "Last Month",   value: [new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), new Date(new Date().getFullYear(), new Date().getMonth(), 0)] as DateRange, placement: "left" },
  { label: "This Year",    value: [new Date(new Date().getFullYear(), 0, 1), new Date()] as DateRange, placement: "left" },
  { label: "Last 7 Days",  value: [d(-7), d()] as DateRange, placement: "left" },
  { label: "Last 30 Days", value: [d(-30), d()] as DateRange, placement: "left" },
];

export { SharedDateRangePicker };
