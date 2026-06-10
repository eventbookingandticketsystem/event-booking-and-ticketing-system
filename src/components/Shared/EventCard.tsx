'use client';

import { cn } from "@/lib/utils";
import { formatSSP, formatDate } from "@/lib/utils";
import { Icon } from "./Icon";
import { StatusPill, type StatusValue } from "./StatusPill";
import type { EventType } from "@/types/event";
import { POSTERS } from "@/lib/mock-data";

interface EventCardProps {
  event: EventType;
  featured?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EventCard({ event, featured = false, onClick, className }: EventCardProps) {
  const lowestPrice = Math.min(...event.tiers.map((t) => t.price));
  const allSoldOut = event.tiers.every((t) => t.soldOut || t.remaining === 0);
  const anySellingFast = event.tiers.some((t) => t.lowStock);
  const poster = POSTERS[event.category] ?? POSTERS["Conference"];

  const pillStatus: StatusValue = allSoldOut
    ? "Sold Out"
    : anySellingFast
    ? "Selling Fast"
    : "Upcoming";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View event: ${event.title}`}
      className={cn(
        "w-full text-left bg-surface border border-border rounded-lg shadow-card overflow-hidden transition-all duration-150",
        "hover:shadow-pop hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
        featured && "flex flex-col",
        className,
      )}
    >
      {/* Poster */}
      <div
        className={cn("relative overflow-hidden", featured ? "h-48" : "h-40")}
        style={{ background: poster }}
      >
        {/* Photo layer — covers gradient when image loads */}
        {event.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Gradient overlay — sits on top of photo */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(8,40,59,0.72) 0%, rgba(8,40,59,0.15) 55%, transparent 100%)" }}
          aria-hidden="true"
        />
        {/* Category label top-right */}
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[1px] text-white/70 drop-shadow">
          {event.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <StatusPill status={pillStatus} size="sm" />
          <span className="text-xs text-text-secondary font-body">
            {formatDate(event.date)}
          </span>
        </div>
        <h3 className="font-display font-semibold text-base text-text leading-snug mb-2 line-clamp-2">
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1">
          <Icon name="MapPin" size={13} className="shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-3">
          <Icon name="Clock" size={13} className="shrink-0" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-sm text-brand-orange">
            {lowestPrice === 0 ? "Free" : `From ${formatSSP(lowestPrice)}`}
          </span>
          <span
            className="inline-flex items-center h-8 px-3 bg-brand-orange text-white text-xs font-semibold rounded-md font-body"
          >
            Book
          </span>
        </div>
      </div>
    </button>
  );
}
