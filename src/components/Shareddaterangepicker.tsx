"use client";

import { DateRangePicker } from "rsuite";
import type { DateRange } from "rsuite/DateRangePicker";

type RangePreset = {
  label: string;
  value: DateRange;
  placement?: "left" | "bottom";
};

const d = (offset = 0): Date => {
  const dt = new Date();
  if (offset) dt.setDate(dt.getDate() + offset);
  return dt;
};

export const predefinedRanges: RangePreset[] = [
  {
    label: "Today",
    value: [d(), d()],
    placement: "left",
  },
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
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return [start, new Date()] as DateRange;
    })(),
    placement: "left",
  },
  {
    label: "Last Week",
    value: (() => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return [start, end] as DateRange;
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
  {
    label: "Last Year",
    value: [
      new Date(new Date().getFullYear() - 1, 0, 1),
      new Date(new Date().getFullYear() - 1, 11, 31),
    ] as DateRange,
    placement: "left",
  },
  {
    label: "Last 7 Days",
    value: [d(-7), d()] as DateRange,
    placement: "left",
  },
  {
    label: "Last 30 Days",
    value: [d(-30), d()] as DateRange,
    placement: "left",
  },
  {
    label: "Last Year (365 Days)",
    value: [d(-365), d()] as DateRange,
    placement: "left",
  },
];

const customLocale = {
  ok: "Submit",
};

interface SharedDateRangePickerProps {
  value?: DateRange | null;
  onChange?: (value: DateRange | null) => void;
  label?: string;
  placeholder?: string;
  [key: string]: unknown;
}

const SharedDateRangePicker = ({
  value,
  onChange,
  label,
  placeholder,
  ...props
}: SharedDateRangePickerProps) => {
  return (
    <div className="rs-picker-wrap w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--foreground)" }}
        >
          {label}
        </label>
      )}
      <DateRangePicker
        format="MM/dd/yyyy"
        placeholder={placeholder || "Select Date Range"}
        value={value}
        onChange={onChange}
        ranges={predefinedRanges}
        showHeader={true}
        block
        preventOverflow
        showOneCalendar
        placement="autoVerticalStart"
        locale={customLocale}
        {...props}
      />
    </div>
  );
};

export default SharedDateRangePicker;
