"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Handler when search value changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handler to clear search */
  onClear?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show loading indicator */
  isSearching?: boolean;
  /** Additional className */
  className?: string;
  /** Icon position - left (default) or right */
  iconPosition?: "left" | "right";
}

/**
 * SearchInput Component
 *
 * A shared, reusable search input component used across system pages.
 * Includes debounce support via the useDebounceSearch hook.
 * Displays loading state and clear button.
 *
 * @example
 * const { searchValue, handleSearchChange, clearSearch, isSearching } = useDebounceSearch();
 *
 * return (
 *   <SearchInput
 *     value={searchValue}
 *     onChange={handleSearchChange}
 *     onClear={clearSearch}
 *     placeholder="Search employees..."
 *     isSearching={isSearching}
 *   />
 * );
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  isSearching = false,
  className,
  iconPosition = "left",
}: SearchInputProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.search");
  const hasValue = value.length > 0;

  return (
    <div
      className={cn(
        "relative flex items-center gap-2",
        className
      )}
    >
      {iconPosition === "left" && (
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}

      <Input
        type="text"
        placeholder={resolvedPlaceholder}
        value={value}
        onChange={onChange}
        className={cn(
          "transition-all",
          iconPosition === "left" ? "pl-9 pr-12" : "pl-3 pr-10"
        )}
        aria-label={placeholder}
      />

      <div className="absolute right-1 flex items-center gap-1">
        {isSearching && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        )}

        {hasValue && onClear && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0 hover:bg-muted"
            aria-label={t("common.clearSearch")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
