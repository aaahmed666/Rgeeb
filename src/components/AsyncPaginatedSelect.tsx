"use client";
/**
 * AuthPaginatedSelect
 * Paginated async select styled to match the auth page design system.
 * Wraps AsyncPaginatedSelect with the orange/navy color tokens.
 */

import * as React from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import type { LoadOptions } from "react-select-async-paginate";
import type { GroupBase, StylesConfig, Theme } from "react-select";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/components/auth-styles";

export interface SelectOption {
  value: string;
  label: string;
  raw?: Record<string, unknown>;
}

interface Additional {
  page: number;
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const r = raw as Record<string, unknown>;
  if (r.data && typeof r.data === "object" && !Array.isArray(r.data)) {
    const inner = r.data as Record<string, unknown>;
    if (Array.isArray(inner.data))
      return inner.data as Record<string, unknown>[];
  }
  if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  if (Array.isArray(r.items)) return r.items as Record<string, unknown>[];
  return [];
}

function unwrapPagination(
  raw: unknown,
  currentPage: number
): { hasMore: boolean; nextPage: number } {
  const r = raw as Record<string, unknown>;
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
    return { hasMore: current < totalPages, nextPage: current + 1 };
  }
  return { hasMore: false, nextPage: currentPage + 1 };
}

export interface AuthPaginatedSelectProps {
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
  isDark: boolean;
  hasError?: boolean;
  id?: string;
}

export function AuthPaginatedSelect({
  endpoint,
  labelKey = "name",
  valueKey = "id",
  value,
  onChange,
  placeholder,
  isClearable = true,
  isDisabled = false,
  extraParams,
  perPage = 20,
  debounceTimeout = 350,
  defaultOption,
  isDark,
  hasError = false,
  id,
}: AuthPaginatedSelectProps) {
  const [resolvedOption, setResolvedOption] =
    React.useState<SelectOption | null>(
      value && defaultOption ? defaultOption : null
    );

  React.useEffect(() => {
    if (!value) setResolvedOption(null);
  }, [value]);

  const { t } = useTranslation();
  const loadingText = placeholder ?? t("paginatedSelect.loading", "Loading options…");
  const noOptionsText = t("paginatedSelect.noOptions", "No options found");
  const loadOptions: LoadOptions<
    SelectOption,
    GroupBase<SelectOption>,
    Additional
  > = React.useCallback(
    async (inputValue, _prev, additional) => {
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, labelKey, valueKey, perPage, JSON.stringify(extraParams)]
  );

  const handleChange = React.useCallback(
    (opt: SelectOption | null) => {
      setResolvedOption(opt ?? null);
      onChange(opt?.value ?? null);
    },
    [onChange]
  );

  // ── Auth-themed styles ──
  const borderColor = hasError
    ? COLORS.red
    : isDark
      ? COLORS.borderDark
      : COLORS.borderLight;
  const focusBorderColor = hasError ? COLORS.red : COLORS.orange;
  const focusShadow = hasError
    ? "0 0 0 4px rgba(239,68,68,0.15)"
    : "0 0 0 4px rgba(249,115,22,0.18)";

  const selectStyles: StylesConfig<SelectOption, false> = React.useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 52,
        height: 52,
        borderRadius: 12,
        borderColor: state.isFocused ? focusBorderColor : borderColor,
        borderWidth: 2,
        backgroundColor: isDark ? COLORS.inputDark : COLORS.inputLight,
        boxShadow: state.isFocused ? focusShadow : "none",
        "&:hover": {
          borderColor: state.isFocused ? focusBorderColor : COLORS.orange,
        },
        fontSize: "14.5px",
        fontFamily: "inherit",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
      }),
      valueContainer: (base) => ({ ...base, padding: "0 48px 0 16px" }),
      indicatorsContainer: (base) => ({ ...base, height: 52 }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? COLORS.textDarkFaint : COLORS.textLightFaint,
        fontSize: "14.5px",
        fontWeight: 500,
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? COLORS.textDark : COLORS.textLight,
        fontSize: "14.5px",
        fontWeight: 500,
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDark ? COLORS.cardDark : COLORS.bgCard,
        border: `2px solid ${isDark ? COLORS.borderDarkSubtle : COLORS.borderLight}`,
        borderRadius: 14,
        boxShadow: isDark
          ? "0 16px 40px rgba(0,0,0,0.5)"
          : "0 8px 32px rgba(15,30,58,0.12)",
        zIndex: 9999,
        marginTop: 6,
        overflow: "hidden",
      }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      menuList: (base) => ({
        ...base,
        padding: 6,
        maxHeight: 280,
        backgroundColor: isDark ? COLORS.cardDark : COLORS.bgCard,
      }),
      option: (base, state) => ({
        ...base,
        borderRadius: 10,
        backgroundColor: state.isSelected
          ? COLORS.orange
          : state.isFocused
            ? isDark
              ? "rgba(249,115,22,0.1)"
              : "rgba(249,115,22,0.06)"
            : "transparent",
        color: state.isSelected
          ? "#fff"
          : isDark
            ? COLORS.textDark
            : COLORS.textLight,
        cursor: "pointer",
        fontWeight: state.isSelected ? 600 : 500,
        fontSize: "14px",
        padding: "10px 12px",
        transition: "background 0.15s",
        "&:active": {
          backgroundColor: isDark
            ? "rgba(249,115,22,0.2)"
            : "rgba(249,115,22,0.12)",
        },
      }),
      input: (base) => ({
        ...base,
        color: isDark ? COLORS.textDark : COLORS.textLight,
        fontSize: "14.5px",
        fontWeight: 500,
      }),
      loadingMessage: (base) => ({
        ...base,
        color: isDark ? COLORS.textDarkMuted : COLORS.textLightMuted,
        fontSize: "14px",
      }),
      noOptionsMessage: (base) => ({
        ...base,
        color: isDark ? COLORS.textDarkMuted : COLORS.textLightMuted,
        fontSize: "14px",
      }),
      clearIndicator: (base) => ({
        ...base,
        color: isDark ? COLORS.textDarkMuted : COLORS.textLightFaint,
        padding: "0 4px",
        "&:hover": { color: COLORS.orange },
      }),
      dropdownIndicator: (base) => ({
        ...base,
        color: isDark ? COLORS.textDarkMuted : COLORS.textLightFaint,
        padding: "0 12px 0 4px",
        "&:hover": { color: COLORS.orange },
      }),
      indicatorSeparator: () => ({ display: "none" }),
    }),
    [isDark, borderColor, focusBorderColor, focusShadow, isDisabled]
  );

  const selectTheme = React.useCallback(
    (theme: Theme): Theme => ({
      ...theme,
      borderRadius: 12,
      colors: {
        ...theme.colors,
        primary: COLORS.orange,
        primary75: "rgba(249,115,22,0.75)",
        primary50: "rgba(249,115,22,0.5)",
        primary25: "rgba(249,115,22,0.25)",
        danger: COLORS.red,
        dangerLight: "rgba(239,68,68,0.2)",
        neutral0: isDark ? COLORS.cardDark : COLORS.bgCard,
        neutral5: isDark ? COLORS.inputDark : COLORS.inputLight,
        neutral10: isDark ? COLORS.borderDarkSubtle : COLORS.borderLight,
        neutral20: isDark ? COLORS.borderDark : COLORS.borderLight,
        neutral30: isDark ? COLORS.borderDark : "#D1D5DB",
        neutral40: isDark ? COLORS.textDarkMuted : COLORS.textLightFaint,
        neutral50: isDark ? COLORS.textDarkMuted : COLORS.textLightFaint,
        neutral60: isDark ? COLORS.textDarkBorder : COLORS.textLightMuted,
        neutral70: isDark ? COLORS.textDark : COLORS.textLight,
        neutral80: isDark ? COLORS.textDark : COLORS.textLight,
        neutral90: isDark ? COLORS.textDark : COLORS.textLight,
      },
    }),
    [isDark]
  );

  return (
    <AsyncPaginate
      inputId={id}
      value={resolvedOption}
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
      loadingMessage={() => loadingText}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? `No results for "${inputValue}"` : "No options"
      }
    />
  );
}

export default AuthPaginatedSelect;

// ─── Dashboard-themed wrapper ─────────────────────────────────────────────────
// Used by dashboard views (DetectionFeedView, TasksView, AiSchedulerView, etc.)
// Uses the app's CSS custom properties rather than the auth page colour tokens.

export interface AsyncPaginatedSelectProps extends Omit<
  AuthPaginatedSelectProps,
  "isDark"
> {
  isDark?: boolean;
}

/**
 * AsyncPaginatedSelect — the standard paginated async select for dashboard pages.
 * Identical to AuthPaginatedSelect but `isDark` is optional (defaults to false)
 * so it picks up the shadcn theme automatically via CSS variables.
 */
export function AsyncPaginatedSelect({
  isDark = false,
  ...props
}: AsyncPaginatedSelectProps) {
  return (
    <AuthPaginatedSelect
      isDark={isDark}
      {...props}
    />
  );
}
