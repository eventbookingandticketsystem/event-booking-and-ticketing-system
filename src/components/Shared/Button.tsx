'use client';

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger" | "quiet";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-orange text-white border border-brand-orange hover:bg-brand-orange-hover active:bg-brand-orange-press focus-visible:ring-2 focus-visible:ring-brand-orange",
  ghost:   "bg-transparent text-text border border-border hover:bg-surface-bg focus-visible:ring-2 focus-visible:ring-brand-orange",
  danger:  "bg-status-danger text-white border border-status-danger hover:opacity-90 focus-visible:ring-2 focus-visible:ring-status-danger",
  quiet:   "bg-transparent text-text-secondary border border-transparent hover:bg-surface-bg focus-visible:ring-2 focus-visible:ring-brand-orange",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-[52px] px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold font-body rounded-md transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>{children}</span>
          </>
        ) : children}
      </button>
    );
  },
);
Button.displayName = "Button";
