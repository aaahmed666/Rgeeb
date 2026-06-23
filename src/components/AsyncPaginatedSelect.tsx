"use client";
/**
 * AuthPaginatedSelect
 * Paginated async select styled to match the auth page design system.
 * Wraps AsyncPaginatedSelect with the orange/navy color tokens.
 */

import * as React from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import type { LoadOptions } from "react-select-async-paginate";
import type {
  GroupBase,
  MultiValue,
  SingleValue,
  StylesConfig,
  Theme,
} from "react-select";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/components/auth-styles";
import { isRtl as checkRtl } from "@/lib/i18n";

export interface SelectOption {
  value: string;
  label: string;
  raw?: Record<string, unknown>;
}

interface Additional {
  page: number;
}

/**
 * Stable className prefix for the underlying react-select. Without it,
 * react-select only emits emotion-hashed classes whose human-readable label
 * (e.g. "-MenuList") is present in dev but STRIPPED in production builds.
 * `closeMenuOnScroll` below relies on detecting scrolls inside the menu, so we
 * need class names that exist in every build — setting classNamePrefix makes
 * react-select emit deterministic `${prefix}__menu`, `${prefix}__menu-list`,
 * `${prefix}__option`, … classes.
 */
const SELECT_CLASS_PREFIX = "rgeeb-aps";

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
  /**
   * Backend endpoint to load options from (async paginated mode).
   * Optional when `options` is provided (static mode).
   */
  endpoint?: string;
  /**
   * Static options list. When provided, the select renders these locally
   * (with client-side keyword filtering) instead of calling `endpoint`.
   * Use this for fixed enum dropdowns (status filters, in/out, etc.).
   */
  options?: SelectOption[];
  labelKey?: string;
  valueKey?: string;
  /** Selected value (single-select mode). */
  value?: string | null | undefined;
  /** Change handler (single-select mode). */
  onChange?: (value: string | null) => void;
  /** Enable multi-selection. Use `values` / `onValuesChange` instead of `value` / `onChange`. */
  isMulti?: boolean;
  /** Selected values (multi-select mode). */
  values?: string[];
  /** Change handler (multi-select mode). */
  onValuesChange?: (values: string[]) => void;
  /** Resolved options for pre-selected values (multi-select mode), so chip labels render before the list loads. */
  defaultSelectedOptions?: SelectOption[];
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
  /** Optional class applied to the select's wrapper element. */
  className?: string;
  /** Control height in px. Defaults to 52 for auth pages, use 36 for dashboard. */
  height?: number;
  /**
   * Where to portal the dropdown menu. Leave undefined to auto-detect: the menu
   * is portalled into the nearest Radix dialog/sheet ancestor when present, and
   * falls back to document.body otherwise. Portalling to body from inside a modal
   * dialog makes the menu inherit the dialog's `pointer-events: none`, which
   * freezes clicks and blocks scrolling — auto-detect avoids that.
   */
  menuPortalTarget?: HTMLElement | null;
}

export function AuthPaginatedSelect({
  endpoint,
  options: staticOptions,
  labelKey = "name",
  valueKey = "id",
  value,
  onChange,
  isMulti = false,
  values,
  onValuesChange,
  defaultSelectedOptions,
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
  height = 52,
  className,
  menuPortalTarget,
}: AuthPaginatedSelectProps) {
  // Wrapper ref lets us find the nearest dialog ancestor so the portalled menu
  // stays inside the dialog's focus-trap / pointer-events scope (see prop docs).
  const wrapRef = React.useRef<HTMLDivElement>(null);
  // Portal target resolution:
  //   undefined (caller default) → auto: portal to document.body.
  //   null (caller forced)       → no portal (render menu inline).
  //   element (caller forced)    → portal to that element.
  // We deliberately do NOT portal into the dialog node itself. A Radix dialog is
  // centered with a CSS transform (translate(-50%,-50%)); a portalled
  // react-select menu computes viewport-relative coordinates from
  // getBoundingClientRect(), and a transformed portal/offset ancestor shifts
  // those coordinates so the menu lands detached (the bottom-right symptom in
  // the New Task modal). Portalling to document.body — which has no transform —
  // keeps `position: fixed` coordinates correct AND lets the menu escape the
  // dialog body's `overflow-y:auto` clipping.
  const [autoPortalTarget, setAutoPortalTarget] =
    React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (menuPortalTarget !== undefined || typeof document === "undefined")
      return;
    setAutoPortalTarget(document.body);
  }, [menuPortalTarget]);

  const effectivePortalTarget =
    menuPortalTarget !== undefined
      ? (menuPortalTarget ?? undefined)
      : (autoPortalTarget ?? undefined);

  // `fixed` when portalling to body (correct viewport coords, escapes overflow
  // clipping). `absolute` only when the caller explicitly disabled the portal.
  const menuPosition: "fixed" | "absolute" =
    effectivePortalTarget != null ? "fixed" : "absolute";

  // Close the menu when the user scrolls a containing element (e.g. the
  // dialog body's overflow-y:auto region). With a body-portalled fixed menu,
  // scrolling the inner container would otherwise leave the menu floating at a
  // stale position. Closing on scroll keeps it anchored correctly on reopen.
  const closeMenuOnScroll = React.useCallback((e: Event) => {
    const target = e.target as Node | null;
    // Keep the menu OPEN while scrolling inside the options list — that scroll
    // is what drives the paginated load-more. Only close when an OUTSIDE
    // container (page/dialog body) scrolls, so a fixed/portalled menu doesn't
    // float at a stale position. We match the stable classNamePrefix classes
    // (present in every build) rather than emotion's dev-only label suffix.
    if (
      target &&
      target instanceof HTMLElement &&
      target.closest(
        `.${SELECT_CLASS_PREFIX}__menu-list, .${SELECT_CLASS_PREFIX}__menu`
      )
    ) {
      return false;
    }
    return true;
  }, []);

  const [resolvedOption, setResolvedOption] =
    React.useState<SelectOption | null>(
      value && defaultOption ? defaultOption : null
    );
  const [resolvedOptions, setResolvedOptions] = React.useState<SelectOption[]>(
    defaultSelectedOptions ?? []
  );

  React.useEffect(() => {
    if (!value) setResolvedOption(null);
  }, [value]);

  // Resolve the label for a pre-selected `value` when the parent didn't supply
  // a `defaultOption`. Without this, edit forms that pass only an id (e.g.
  // value={form.role_id}) show the placeholder instead of the selected item's
  // name until the user opens the menu. We fetch the option once and cache it.
  const resolveAbortRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (isMulti) return;
    if (!value) return;
    // Already showing the right option (from defaultOption or a prior pick).
    if (resolvedOption && resolvedOption.value === String(value)) return;
    // Static mode: resolve the label directly from the provided options list.
    if (staticOptions) {
      const match = staticOptions.find((o) => o.value === String(value));
      if (match) setResolvedOption(match);
      return;
    }
    if (!endpoint) return;
    const ep = endpoint;
    // Avoid duplicate fetches for the same value.
    if (resolveAbortRef.current === String(value)) return;
    resolveAbortRef.current = String(value);
    let cancelled = false;
    (async () => {
      try {
        // Try a direct lookup first (?id=), falling back to scanning page 1.
        const raw = await apiFetch<unknown>(ep, {
          query: { id: value, per_page: perPage, ...extraParams },
        });
        const list = unwrapList(raw);
        const match =
          list.find(
            (it) => String(it[valueKey] ?? it.id ?? "") === String(value)
          ) ?? list[0];
        if (!cancelled && match) {
          setResolvedOption({
            value: String(match[valueKey] ?? match.id ?? value),
            label: String(
              match[labelKey] ??
                match.name ??
                match.name_en ??
                match.title ??
                value
            ),
            raw: match,
          });
        }
      } catch {
        /* leave placeholder; menu will still load options on open */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isMulti, endpoint, labelKey, valueKey, perPage]);

  // Keep multi chips in sync when the parent clears or trims `values`
  React.useEffect(() => {
    if (!isMulti) return;
    const ids = values ?? [];
    setResolvedOptions((prev) => prev.filter((o) => ids.includes(o.value)));
  }, [isMulti, values]);

  const { t, i18n } = useTranslation();
  const isRtl = checkRtl(i18n.resolvedLanguage ?? i18n.language ?? "en");
  const loadingText =
    placeholder ?? t("paginatedSelect.loading", "Loading options…");
  const noOptionsText = t("paginatedSelect.noOptions", "No options found");
  const loadOptions: LoadOptions<
    SelectOption,
    GroupBase<SelectOption>,
    Additional
  > = React.useCallback(
    async (inputValue, _prev, additional) => {
      // Static mode: filter the provided list locally, no network call.
      if (staticOptions) {
        const kw = inputValue.trim().toLowerCase();
        const filtered = kw
          ? staticOptions.filter((o) => o.label.toLowerCase().includes(kw))
          : staticOptions;
        return { options: filtered, hasMore: false, additional: { page: 1 } };
      }
      const page = additional?.page ?? 1;
      if (!endpoint) {
        return { options: [], hasMore: false, additional: { page: 1 } };
      }
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
    [
      endpoint,
      labelKey,
      valueKey,
      perPage,
      JSON.stringify(extraParams),
      staticOptions,
    ]
  );

  const handleChange = React.useCallback(
    (opt: SingleValue<SelectOption> | MultiValue<SelectOption>) => {
      if (isMulti) {
        const arr = Array.isArray(opt)
          ? ([...opt] as SelectOption[])
          : opt
            ? [opt as SelectOption]
            : [];
        setResolvedOptions(arr);
        onValuesChange?.(arr.map((o) => o.value));
      } else {
        const single = (opt ?? null) as SelectOption | null;
        setResolvedOption(single);
        onChange?.(single?.value ?? null);
      }
    },
    [isMulti, onChange, onValuesChange]
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

  const selectStyles: StylesConfig<SelectOption, boolean> = React.useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: height,
        height: isMulti ? "auto" : height,
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
        direction: isRtl ? "rtl" : "ltr",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
      }),
      valueContainer: (base) => ({
        ...base,
        padding: isMulti
          ? isRtl
            ? "4px 12px 4px 40px"
            : "4px 40px 4px 12px"
          : isRtl
            ? "0 16px 0 48px"
            : "0 48px 0 16px",
        // Only multi-select needs wrapping (chips flow to new rows). For a
        // single-select, wrapping a two-word placeholder like "All Branches"
        // pushes a second line that clips against the fixed control height —
        // keep it on one line.
        flexWrap: isMulti ? "wrap" : "nowrap",
        gap: 4,
        overflow: "hidden",
      }),
      indicatorsContainer: (base) => ({
        ...base,
        height: isMulti ? "auto" : height,
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? COLORS.textDarkFaint : COLORS.textLightFaint,
        fontSize: "14.5px",
        fontWeight: 500,
        textAlign: isRtl ? "right" : "left",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? COLORS.textDark : COLORS.textLight,
        fontSize: "14.5px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }),
      multiValue: (base) => ({
        ...base,
        borderRadius: 8,
        backgroundColor: isDark
          ? "rgba(249,115,22,0.18)"
          : "rgba(249,115,22,0.1)",
        margin: 0,
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: isDark ? COLORS.textDark : COLORS.textLight,
        fontSize: "12.5px",
        fontWeight: 600,
        padding: "2px 6px",
      }),
      multiValueRemove: (base) => ({
        ...base,
        borderRadius: "0 8px 8px 0",
        color: isDark ? COLORS.textDarkMuted : COLORS.textLightMuted,
        "&:hover": {
          backgroundColor: "rgba(239,68,68,0.15)",
          color: COLORS.red,
        },
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
        // Radix Sheet/Dialog sets pointer-events:none on content outside its
        // focus scope. When the menu is portalled into the sheet during its
        // open animation it can inherit that, freezing clicks/scroll on the
        // options. Force pointer events back on for the menu surface.
        pointerEvents: "auto",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        pointerEvents: "auto",
      }),
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
    [
      isDark,
      borderColor,
      focusBorderColor,
      focusShadow,
      isDisabled,
      isRtl,
      height,
      isMulti,
    ]
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
    <div
      ref={wrapRef}
      className={className}
    >
      <AsyncPaginate
        inputId={id}
        classNamePrefix={SELECT_CLASS_PREFIX}
        isMulti={isMulti}
        value={isMulti ? resolvedOptions : resolvedOption}
        onChange={handleChange}
        loadOptions={loadOptions}
        additional={{ page: 1 }}
        cacheUniqs={[endpoint, JSON.stringify(extraParams), staticOptions]}
        debounceTimeout={debounceTimeout}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={isDisabled}
        closeMenuOnSelect={!isMulti}
        hideSelectedOptions={false}
        styles={selectStyles}
        theme={selectTheme}
        menuPortalTarget={effectivePortalTarget}
        menuPosition={menuPosition}
        closeMenuOnScroll={closeMenuOnScroll}
        menuShouldScrollIntoView={false}
        loadingMessage={() => loadingText}
        noOptionsMessage={({ inputValue }) =>
          inputValue ? `No results for "${inputValue}"` : "No options"
        }
      />
    </div>
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
  /** Height in px. Defaults to 36 for dashboard (matches rsuite date picker). */
  height?: number;
}

/**
 * AsyncPaginatedSelect — the standard paginated async select for dashboard pages.
 * Identical to AuthPaginatedSelect but `isDark` is optional (defaults to false)
 * so it picks up the shadcn theme automatically via CSS variables.
 */
export function AsyncPaginatedSelect({
  isDark = false,
  height = 36,
  ...props
}: AsyncPaginatedSelectProps) {
  return (
    <AuthPaginatedSelect
      isDark={isDark}
      height={height}
      {...props}
    />
  );
}
