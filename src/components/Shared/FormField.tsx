'use client';

import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Render as textarea instead of input */
  multiline?: boolean;
  rows?: number;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, multiline = false, rows = 4, className, id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    const inputClasses = cn(
      "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors duration-150",
      "placeholder:text-text-muted",
      "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
      "disabled:opacity-60 disabled:bg-surface-bg",
      error ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20" : "border-border",
      multiline && "h-auto py-2.5 resize-none",
      className,
    );

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-semibold text-text font-body">
          {label}
        </label>
        {multiline ? (
          <textarea
            id={fieldId}
            rows={rows}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            className={inputClasses}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref}
            id={fieldId}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            className={inputClasses}
            {...props}
          />
        )}
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
FormField.displayName = "FormField";
