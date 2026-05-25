"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useDebounceSearch Hook
 *
 * A custom hook that provides debounced search functionality with configurable delay.
 * Useful for search inputs that need to avoid excessive re-renders or API calls.
 *
 * @param initialValue - Initial search value (default: "")
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 *
 * @returns {Object} Object containing:
 *   - searchValue: Current search input value
 *   - debouncedValue: Debounced search value (updated after delay)
 *   - handleSearchChange: Handler function for search input onChange
 *   - setSearchValue: Directly set the search value
 *   - clearSearch: Clear the search value
 *   - isSearching: Boolean indicating if search is in progress (value !== debounced)
 *
 * @example
 * const { searchValue, debouncedValue, handleSearchChange, clearSearch } = useDebounceSearch("", 300);
 *
 * // Use debouncedValue for filtering/API calls
 * const filtered = useMemo(() => {
 *   const q = debouncedValue.trim().toLowerCase();
 *   if (!q) return items;
 *   return items.filter(item => item.name.toLowerCase().includes(q));
 * }, [items, debouncedValue]);
 *
 * return (
 *   <>
 *     <input
 *       type="text"
 *       value={searchValue}
 *       onChange={handleSearchChange}
 *       placeholder="Search..."
 *     />
 *     {isSearching && <Spinner />}
 *   </>
 * );
 */
export function useDebounceSearch(initialValue = "", delay = 300) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update the debounced value after the delay
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If search value is empty, update immediately
    if (!searchValue) {
      setDebouncedValue("");
      setIsSearching(false);
      return;
    }

    // Mark as searching
    setIsSearching(true);

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedValue(searchValue);
      setIsSearching(false);
    }, delay);

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchValue, delay]);

  const handleSearchChange = useCallback(
    (eOrValue: React.ChangeEvent<HTMLInputElement> | string) => {
      const value =
        typeof eOrValue === "string" ? eOrValue : eOrValue.target.value;
      setSearchValue(value);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setDebouncedValue("");
    setIsSearching(false);
  }, []);

  return {
    searchValue,
    debouncedValue,
    handleSearchChange,
    setSearchValue,
    clearSearch,
    isSearching,
  };
}
