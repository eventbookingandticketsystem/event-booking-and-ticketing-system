'use client';

import { cn } from "@/lib/utils";
import { formatSSP } from "@/lib/utils";
import { Icon } from "./Icon";
import type { ExploreEventType } from "@/types/event";
import { EXPLORE_POSTERS } from "@/lib/mock-data";

interface ExploreCardProps {
  event: ExploreEventType;
  fixed?: boolean;     // 248px width for horizontal scroll row
  onClick?: () => void;
  className?: string;
}

export function ExploreCard({ event, fixed = false, onClick, className }: ExploreCardProps) {
  const poster = EXPLORE_POSTERS[event.category] ?? EXPLORE_POSTERS["Conference"];
  const isNow = event.status === "happening-now";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View event: ${event.title}`}
      className={cn(
        "relative block text-left p-0 border border-white/8 rounded-xl overflow-hidden",
        "transition-transform duration-200 hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
        "scroll-snap-align-start",
        fixed ? "flex-none w-[248px]" : "w-full",
        // aspect-ratio 3:4 via aspect-[3/4]
        "aspect-[3/4]",
        className,
      )}
      style={{ backgroundImage: poster, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 13px)" }}
        aria-hidden="true"
      />

      {/* Category label top-right */}
      <span className="absolute top-3.5 right-3.5 text-[10px] font-bold uppercase tracking-[1px] text-white/50 z-10">
        {event.category}
      </span>

      {/* Status pill top-left */}
      <div className="absolute top-3.5 left-3.5 z-10">
        {isNow ? (
          <span className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-pill text-xs font-bold text-white backdrop-blur-sm" style={{ background: "rgba(26,107,60,0.85)" }}>
            <span className="relative flex h-[7px] w-[7px] shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee79f] opacity-60" />
              <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#6ee79f]" />
            </span>
            Happening Now!
          </span>
        ) : (
          <span className="inline-flex items-center px-[11px] py-[5px] rounded-pill text-xs font-semibold text-white backdrop-blur-sm" style={{ background: "rgba(3,9,15,0.7)" }}>
            {event.date}
          </span>
        )}
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(3,9,15,0.95) 0%, rgba(3,9,15,0.7) 28%, transparent 58%)" }}
        aria-hidden="true"
      />

      {/* Body */}
      <div className="absolute left-0 right-0 bottom-0 flex flex-col gap-[7px] p-4 z-10">
        <h3 className="font-display font-bold text-[19px] leading-[1.18] text-white line-clamp-2" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}>
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <Icon name="MapPin" size={12} className="shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[13px] font-bold",
              event.price === 0 ? "text-[#5fd08a]" : "text-brand-orange",
            )}
          >
            {event.price === 0 ? "Free" : `From ${formatSSP(event.price)}`}
          </span>
        </div>
      </div>
    </button>
  );
}
