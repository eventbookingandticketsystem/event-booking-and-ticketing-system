'use client';

import { cn, formatUSD } from "@/lib/utils";
import { Icon } from "./Icon";
import type { TicketTier } from "@/types/event";

interface TierSelectorProps {
  tier: TicketTier;
  qty: number;
  onQtyChange: (id: string, delta: number) => void;
  className?: string;
}

export function TierSelector({ tier, qty, onQtyChange, className }: TierSelectorProps) {
  const isSoldOut = tier.soldOut || tier.remaining === 0;
  const isLowStock = tier.lowStock && !isSoldOut;

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-colors duration-150",
        isSoldOut
          ? "border-border bg-surface-bg opacity-70"
          : qty > 0
          ? "border-brand-orange bg-surface-alt"
          : "border-border bg-surface hover:border-brand-orange/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: tier info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-display font-semibold text-sm text-text">{tier.name}</span>
            {isSoldOut && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-danger-bg text-status-danger">
                Sold Out
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-warning-bg text-status-warning">
                Low Stock
              </span>
            )}
          </div>
          <p className="font-display font-bold text-brand-orange text-base">
            {tier.price === 0 ? "Free" : formatUSD(tier.price)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {isSoldOut
              ? "No tickets left"
              : `${tier.remaining.toLocaleString()} remaining`}
          </p>
        </div>

        {/* Right: stepper */}
        {!isSoldOut && (
          <div className="flex items-center gap-2 shrink-0" role="group" aria-label={`Quantity for ${tier.name}`}>
            <button
              type="button"
              onClick={() => onQtyChange(tier.id, -1)}
              disabled={qty === 0}
              aria-label={`Decrease quantity of ${tier.name}`}
              className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-md border font-body text-lg font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                qty === 0
                  ? "border-border text-border cursor-not-allowed"
                  : "border-brand-orange text-brand-orange hover:bg-brand-orange/10",
              )}
            >
              <Icon name="Minus" size={16} />
              <span className="sr-only">Decrease</span>
            </button>
            <span
              className="w-7 text-center font-display font-bold text-base text-text"
              aria-live="polite"
              aria-label={`${qty} selected`}
            >
              {qty}
            </span>
            <button
              type="button"
              onClick={() => onQtyChange(tier.id, 1)}
              disabled={qty >= tier.remaining}
              aria-label={`Increase quantity of ${tier.name}`}
              className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-md border font-body text-lg font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                qty >= tier.remaining
                  ? "border-border text-border cursor-not-allowed"
                  : "border-brand-orange text-brand-orange hover:bg-brand-orange/10",
              )}
            >
              <Icon name="Plus" size={16} />
              <span className="sr-only">Increase</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
