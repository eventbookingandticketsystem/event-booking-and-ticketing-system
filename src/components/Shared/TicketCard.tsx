'use client';

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import type { TicketType, TicketEventSummary } from "@/types/ticket";
import type { EventType } from "@/types/event";
import { POSTERS } from "@/lib/mock-data";

/** Accept either a full EventType or the lighter TicketEventSummary */
type TicketEventProp = Pick<EventType, "title" | "date" | "venue" | "category"> | TicketEventSummary;

interface TicketCardProps {
  ticket: TicketType;
  event: TicketEventProp;
  onClick?: () => void;
  className?: string;
}

export function TicketCard({ ticket, event, onClick, className }: TicketCardProps) {
  const poster = POSTERS[event.category] ?? POSTERS["Conference"];
  const isValid = ticket.status === "Valid";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ticket for ${event.title}`}
      className={cn(
        "w-full text-left bg-surface border border-border rounded-lg shadow-card overflow-hidden transition-all duration-150",
        "hover:shadow-pop hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
        className,
      )}
    >
      {/* Top: poster strip */}
      <div
        className="relative h-24 overflow-hidden"
        style={{ backgroundImage: poster }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(8,40,59,0.7) 0%, rgba(8,40,59,0.2) 100%)" }}
        />
        <div className="absolute inset-0 flex items-end p-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/50 mb-0.5">{event.category}</p>
            <h3 className="font-display font-bold text-sm text-white leading-tight line-clamp-2">{event.title}</h3>
          </div>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="relative flex items-center h-0 border-t border-dashed border-border" aria-hidden="true">
        <span className="absolute -left-3 w-5 h-5 rounded-full bg-surface-bg border border-border" />
        <span className="absolute -right-3 w-5 h-5 rounded-full bg-surface-bg border border-border" />
      </div>

      {/* Body */}
      <div className="flex items-center gap-3 p-4">
        {/* QR placeholder */}
        <div
          className={cn(
            "shrink-0 w-16 h-16 rounded border-2 flex items-center justify-center",
            isValid ? "border-brand-navy" : "border-border",
          )}
          aria-hidden="true"
        >
          <Icon name="QrCode" size={28} className={isValid ? "text-brand-navy" : "text-border"} />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <StatusPill status={ticket.status} size="sm" />
            <span className="text-xs text-text-muted font-mono">{ticket.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
            <Icon name="Ticket" size={12} className="shrink-0" />
            <span className="truncate">{ticket.tier}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Icon name="Calendar" size={12} className="shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
        </div>
        <Icon name="ChevronRight" size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
      </div>
    </button>
  );
}
