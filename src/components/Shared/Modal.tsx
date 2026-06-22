'use client';

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ open, onClose, title, description, children, footer, size = "md", className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-navy/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog — constrained to viewport height so body can scroll */}
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full bg-white rounded-lg shadow-pop flex flex-col",
          "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]",
          sizeClasses[size],
          className,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
            <div>
              {title && (
                <h2 id="modal-title" className="font-display font-semibold text-lg text-text">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-sm text-text-secondary mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:bg-surface-bg hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <Icon name="X" size={18} />
              <span className="sr-only">Close dialog</span>
            </button>
          </div>
        )}
        {/* Body — scrolls when content exceeds available height */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface-bg flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
