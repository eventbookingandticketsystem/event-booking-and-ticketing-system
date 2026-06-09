import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes safely (clsx + tailwind-merge)
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Format a number as SSP currency
// formatSSP(18000) → "SSP 18,000"
export function formatSSP(n: number): string {
  return "SSP " + n.toLocaleString("en-US");
}

// Format a date string for display
// Passes through already-formatted strings (e.g. "Sat, 14 Dec 2025")
// Converts ISO date strings (e.g. "2025-12-14") to "14 Dec 2025"
export function formatDate(d: string): string {
  if (!d) return "";
  // If it already looks like a human date, return as-is
  if (/[a-zA-Z]/.test(d) && d.length > 5) return d;
  // Try to parse ISO date
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-GB", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}
