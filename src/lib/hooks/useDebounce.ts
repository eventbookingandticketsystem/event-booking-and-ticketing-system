'use client';

import { useState, useEffect } from "react";

/**
 * Returns a debounced copy of `value` that only updates after
 * `delayMs` milliseconds of inactivity. Prevents firing a query
 * on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
