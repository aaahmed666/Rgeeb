"use client";

/**
 * AsyncPaginatedSelect
 * Drop-in API-backed paginated select using react-select-async-paginate.
 * Pagination uses the proven pattern: pagination.current_page < pagination.total_pages
 */

import * as React from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import type { LoadOptions } from "react-select-async-paginate";
import type { GroupBase, StylesConfig, Theme } from "react-select";
import { apiFetch } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  raw?: Record<string, unknown>;
}

interface Additional {
  page: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const r = raw as Record<string, unknown>;
  // { data: { data: [...] } }
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const inner = r.data as Record<string, unknown>;
    if (Array.isArray(inner.data))
      return inner.data as Record<string, unknown>[];
  }
  // { data: [...] }
  if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  // { items: [...] }
  if (Array.isArray(r.items)) return r.items as Record<string, unknown>[];
  return [];
}

/**
 * Extract pagination info using the proven pattern from reference component:
 * json?.pagination || json?.data?.pagination
 * Returns { hasMore, nextPage }
 */
function unwrapPagination(
  raw: unknown,
  currentPage: number
): { hasMore: boolean; nextPage: number } {
  const r = raw as Record<string, unknown>;

  // rgeeb shape: { pagination: { current_page, total_pages, ... } }
  const pagination =
    (r?.pagination as Record<string, unknown> | undefined) ??
    ((r?.data as Record<string, unknown>)?.pagination as
      | Record<string, unknown>
      | undefined) ??
    (r?.meta as Record<string, unknown> | undefined);

  if (pagination) {
    const current = Number(
      pagination.current_page ?? pagination.currentPage ?? currentPage
    );
    const totalPages = Number(
      pagination.total_pages ??
        pagination.totalPages ??
        pagination.last_page ??
        1
    );
    const hasMore = current < totalPages;
    return { hasMore, nextPage: current + 1 };
  }

  return { hasMore: false, nextPage: currentPage + 1 };
}

// ─── component ────────────────────────────────────────────────────────────────

export interface AsyncPaginatedSelectProps {
  endpoint: string;
  labelKey?: string;
  valueKey?: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
  extraParams?: Record<string, string | number | boolean | undefined>;
  perPage?: number;
  debounceTimeout?: number;
  defaultOption?: SelectOption;
  className?: string;
  id?: string;
}

const PER_PAGE_DEFAULT = 20;
const DEBOUNCE_DEFAULT = 350;

export function AsyncPaginatedSelect({
  endpoint,
  labelKey = "name",
  valueKey = "id",
  value,
  onChange,
  placeholder = "Select…",
  isClearable = true,
  isDisabled = false,
  extraParams,
  perPage = PER_PAGE_DEFAULT,
  debounceTimeout = DEBOUNCE_DEFAULT,
  defaultOption,
  className,
  id,
}: AsyncPaginatedSelectProps) {
  const [resolvedOption, setResolvedOption] =
    React.useState<SelectOption | null>(
      value && defaultOption ? defaultOption : null
    );

  React.useEffect(() => {
    if (!value) setResolvedOption(null);
  }, [value]);

  const loadOptions: LoadOptions<
    SelectOption,
    GroupBase<SelectOption>,
    Additional
  > = React.useCallback(
    async (inputValue, _prevOptions, additional) => {
      const page = additional?.page ?? 1;

      try {
        const raw = await apiFetch<unknown>(endpoint, {
          query: {
            page,
            per_page: perPage,
            ...(inputValue ? { keyword: inputValue } : {}),
            ...extraParams,
          },
        });

        const list = unwrapList(raw);
        const { hasMore, nextPage } = unwrapPagination(raw, page);

        const options: SelectOption[] = list.map((item) => ({
          value: String(item[valueKey] ?? item.id ?? ""),
          label: String(
            item[labelKey] ??
              item.name ??
              item.name_en ??
              item.title ??
              item[valueKey] ??
              ""
          ),
          raw: item,
        }));

        return {
          options,
          hasMore,
          additional: { page: nextPage },
        };
      } catch {
        return { options: [], hasMore: false, additional: { page: 1 } };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, labelKey, valueKey, perPage, JSON.stringify(extraParams)]
  );

  const selectedOption: SelectOption | null = resolvedOption ?? null;

  const handleChange = React.useCallback(
    (opt: SelectOption | null) => {
      setResolvedOption(opt ?? null);
      onChange(opt?.value ?? null);
    },
    [onChange]
  );

  const selectStyles: StylesConfig<SelectOption, false> = React.useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 44,
        height: 44,
        borderRadius: "calc(var(--radius) - 2px)",
        borderColor: state.isFocused
          ? "hsl(var(--ring))"
          : "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
        boxShadow: state.isFocused
          ? "0 0 0 2px hsl(var(--ring) / 0.3)"
          : "none",
        "&:hover": { borderColor: "hsl(var(--border))" },
        fontSize: "0.875rem",
      }),
      valueContainer: (base) => ({ ...base, padding: "0 10px" }),
      indicatorsContainer: (base) => ({ ...base, height: 44 }),
      placeholder: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        fontSize: "0.875rem",
      }),
      singleValue: (base) => ({
        ...base,
        color: "hsl(var(--foreground))",
        fontSize: "0.875rem",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "calc(var(--radius))",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        zIndex: 9999,
        fontSize: "0.875rem",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      menuList: (base) => ({
        ...base,
        padding: "4px",
        maxHeight: 300,
        backgroundColor: "hsl(var(--card))",
      }),
      option: (base, state) => ({
        ...base,
        borderRadius: "calc(var(--radius) - 2px)",
        backgroundColor: state.isSelected
          ? "hsl(var(--primary))"
          : state.isFocused
            ? "hsl(var(--accent))"
            : "hsl(var(--card))",
        color: state.isSelected
          ? "hsl(var(--primary-foreground))"
          : "hsl(var(--foreground))",
        cursor: "pointer",
        "&:active": { backgroundColor: "hsl(var(--accent))" },
        padding: "8px 10px",
        fontSize: "0.875rem",
      }),
      input: (base) => ({
        ...base,
        color: "hsl(var(--foreground))",
        fontSize: "0.875rem",
      }),
      loadingMessage: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        fontSize: "0.875rem",
        backgroundColor: "hsl(var(--card))",
      }),
      noOptionsMessage: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        fontSize: "0.875rem",
        backgroundColor: "hsl(var(--card))",
      }),
      clearIndicator: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        padding: "0 4px",
        "&:hover": { color: "hsl(var(--foreground))" },
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: "hsl(var(--muted-foreground))",
        padding: "0 6px",
        "&:hover": { color: "hsl(var(--foreground))" },
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: "hsl(var(--border))",
      }),
    }),
    []
  );

  const selectTheme = React.useCallback(
    (theme: Theme): Theme => ({
      ...theme,
      borderRadius: 6,
      colors: {
        ...theme.colors,
        primary: "hsl(var(--primary))",
        primary75: "hsl(var(--primary) / 0.75)",
        primary50: "hsl(var(--primary) / 0.5)",
        primary25: "hsl(var(--primary) / 0.25)",
        danger: "hsl(var(--destructive))",
        dangerLight: "hsl(var(--destructive) / 0.2)",
        neutral0: "hsl(var(--card))",
        neutral5: "hsl(var(--muted))",
        neutral10: "hsl(var(--muted))",
        neutral20: "hsl(var(--border))",
        neutral30: "hsl(var(--border))",
        neutral40: "hsl(var(--muted-foreground))",
        neutral50: "hsl(var(--muted-foreground))",
        neutral60: "hsl(var(--muted-foreground))",
        neutral70: "hsl(var(--foreground))",
        neutral80: "hsl(var(--foreground))",
        neutral90: "hsl(var(--foreground))",
      },
    }),
    []
  );

  return (
    <AsyncPaginate
      inputId={id}
      className={className}
      value={selectedOption}
      onChange={handleChange}
      loadOptions={loadOptions}
      additional={{ page: 1 }}
      debounceTimeout={debounceTimeout}
      placeholder={placeholder}
      isClearable={isClearable}
      isDisabled={isDisabled}
      styles={selectStyles}
      theme={selectTheme}
      menuPortalTarget={
        typeof document !== "undefined" ? document.body : undefined
      }
      menuPosition="fixed"
      loadingMessage={() => "Loading…"}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? `No results for "${inputValue}"` : "No options"
      }
    />
  );
}

// ─── createPaginatedLoader ────────────────────────────────────────────────────

export function createPaginatedLoader(
  endpoint: string,
  opts: {
    labelKey?: string;
    valueKey?: string;
    perPage?: number;
    extraParams?: Record<string, string | number | boolean | undefined>;
  } = {}
): LoadOptions<SelectOption, GroupBase<SelectOption>, Additional> {
  const {
    labelKey = "name",
    valueKey = "id",
    perPage = 20,
    extraParams,
  } = opts;

  return async (inputValue, _prev, additional) => {
    const page = additional?.page ?? 1;
    try {
      const raw = await apiFetch<unknown>(endpoint, {
        query: {
          page,
          per_page: perPage,
          ...(inputValue ? { keyword: inputValue } : {}),
          ...extraParams,
        },
      });

      const list = unwrapList(raw);
      const { hasMore, nextPage } = unwrapPagination(raw, page);

      const options: SelectOption[] = list.map((item) => ({
        value: String(item[valueKey] ?? item.id ?? ""),
        label: String(
          item[labelKey] ??
            item.name ??
            item.name_en ??
            item.title ??
            item[valueKey] ??
            ""
        ),
        raw: item,
      }));

      return { options, hasMore, additional: { page: nextPage } };
    } catch {
      return { options: [], hasMore: false, additional: { page: 1 } };
    }
  };
}

export default AsyncPaginatedSelect;
