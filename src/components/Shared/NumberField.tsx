'use client';

import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  error?: string;
  hint?: string;
  warning?: string;
  onChange?: (value: number | "") => void;
  min?: number;
  max?: number;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, error, hint, warning, onChange, min, max, className, id, value, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      if (raw === "") {
        onChange?.("");
        return;
      }
      let num = Number(raw);
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      onChange?.(num);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      if (raw === "" && min !== undefined) {
        onChange?.(min);
      }
      props.onBlur?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-semibold text-text font-body">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          type="text"
          inputMode="numeric"
          value={value === undefined ? "" : value}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${fieldId}-error`
            : warning ? `${fieldId}-warning`
            : hint ? `${fieldId}-hint`
            : undefined
          }
          className={cn(
            "w-full h-11 px-3.5 rounded-sm border bg-white text-text text-[15px] font-body transition-colors duration-150",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20",
            "disabled:opacity-60 disabled:bg-surface-bg",
            error ? "border-status-danger focus:border-status-danger focus:ring-status-danger/20"
                  : "border-border",
            className,
          )}
          {...props}
        />
        {hint && !error && !warning && (
          <p id={`${fieldId}-hint`} className="text-xs text-text-muted">{hint}</p>
        )}
        {warning && !error && (
          <p id={`${fieldId}-warning`} role="alert" className="text-xs text-status-warning font-semibold">
            {warning}
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
NumberField.displayName = "NumberField";
