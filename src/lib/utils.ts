import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes safely (clsx + tailwind-merge)
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Format a number as USD currency
// formatUSD(35) → "$35"  |  formatUSD(1200) → "$1,200"
export function formatUSD(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

// Alias kept for backward compatibility — prefer formatUSD
export const formatSSP = formatUSD;

// Format a date string for display.
// Handles ISO datetime strings ("2026-12-10T17:00:00.000Z"),
// plain date strings ("2026-12-10"), and already-formatted strings
// ("10 Dec 2026" / "Sat, 14 Dec 2025").
export function formatDate(d: string): string {
  if (!d) return "";
  // If it looks like an ISO date or datetime (starts with 4 digits + dash), parse it.
  // This covers "2026-12-10" and "2026-12-10T17:00:00.000Z".
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB", {
        day:   "numeric",
        month: "short",
        year:  "numeric",
      });
    }
  }
  // Any other value (already human-readable) — return as-is.
  return d;
}
