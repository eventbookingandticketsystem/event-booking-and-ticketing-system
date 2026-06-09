'use client';

import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, placeholder, error, hint, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-semibold text-text font-body">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            className={cn(
              "w-full h-11 pl-3.5 pr-9 rounded-sm border bg-white text-text text-[15px] font-body appearance-none transition-colors duration-150",
              "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
              "disabled:opacity-60 disabled:bg-surface-bg",
              error ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20" : "border-border",
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* chevron */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} role="alert" className="text-xs text-status-danger font-semibold">
            {error}
          </p>
        )}
      </div>
    );
  },
);
SelectField.displayName = "SelectField";
