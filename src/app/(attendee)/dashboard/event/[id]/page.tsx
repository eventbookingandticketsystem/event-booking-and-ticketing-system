'use client';

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { TierSelector } from "@/components/Shared/TierSelector";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { useEvent } from "@/lib/api/hooks/useEvent";
import { ROUTES } from "@/constants/routes";
import type { TicketTier } from "@/types/event";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: ev, isLoading, isError, error } = useEvent(id);

  const [qty, setQty] = useState<Record<string, number>>({});
  const [aboutOpen, setAboutOpen] = useState(true);

  const handleQtyChange = (tierId: string, delta: number) => {
    setQty((prev) => {
      const tier = ev?.tiers.find((t: TicketTier) => t.id === tierId);
      if (!tier) return prev;
      const current = prev[tierId] ?? 0;
      const next = Math.max(0, Math.min(tier.remaining, current + delta));
      return { ...prev, [tierId]: next };
    });
  };

  const tiers = ev?.tiers ?? [];
  const total = tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.price, 0);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);

  const handleBook = () => {
    if (!ev) return;
    if (typeof window !== "undefined") {
      const lines = ev.tiers
        .filter((t) => (qty[t.id] ?? 0) > 0)
        .map((t) => ({ ...t, qty: qty[t.id] ?? 0 }));
      sessionStorage.setItem(`tiketi-booking-${ev.id}`, JSON.stringify(lines));
    }
    router.push(ROUTES.BOOKING(ev.id));
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Poster skeleton */}
        <div className="skeleton h-[240px] md:h-[300px] shrink-0" />
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-5 flex flex-col gap-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-7 w-3/4 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-16 rounded" />
          <div className="skeleton h-16 rounded" />
          <div className="skeleton h-24 rounded" />
          <div className="skeleton h-24 rounded" />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (isError || !ev) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-surface-bg text-brand-navy inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <Icon name="ArrowLeft" size={19} />
          </button>
        </div>
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-6">
          <AlertBanner
            tone="danger"
            message={(error as Error)?.message ?? "Event not found."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {/* Poster hero */}
        <div
          className="relative h-[240px] md:h-[300px] shrink-0 overflow-hidden"
          style={{ background: ev.poster }}
        >
          {/* Photo layer */}
          {ev.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ev.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="eager"
              decoding="async"
            />
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(8,40,59,.55) 0%, rgba(8,40,59,0.05) 40%, rgba(8,40,59,.4) 100%)" }}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/92 text-brand-navy inline-flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <Icon name="ArrowLeft" size={19} />
          </button>
        </div>

        {/* Body — centred on desktop */}
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-5 pb-4">
          {/* Category */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold tracking-[1px] uppercase text-brand-orange-deep">
              {ev.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-[24px] md:text-[28px] leading-[1.2] tracking-[-0.4px] text-text my-1.5">
            {ev.title}
          </h1>
          <p className="text-sm text-text-secondary mb-[18px]">by {ev.organizer}</p>

          {/* Info rows */}
          <div className="flex flex-col gap-3 mb-[18px]">
            <div className="flex gap-3 items-start">
              <span className="w-10 h-10 rounded-sm bg-surface-bg text-brand-navy inline-flex items-center justify-center shrink-0">
                <Icon name="Calendar" size={18} />
              </span>
              <div>
                <div className="text-xs text-text-secondary">Date &amp; time</div>
                <div className="text-sm font-semibold mt-0.5">{ev.date} · {ev.time}</div>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-10 h-10 rounded-sm bg-surface-bg text-brand-navy inline-flex items-center justify-center shrink-0">
                <Icon name="MapPin" size={18} />
              </span>
              <div>
                <div className="text-xs text-text-secondary">Venue</div>
                <div className="text-sm font-semibold mt-0.5">{ev.venue}</div>
              </div>
            </div>
          </div>

          {/* About collapsible */}
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            aria-expanded={aboutOpen}
            className="flex items-center justify-between w-full py-4 border-t border-border font-display font-semibold text-base text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            About this event
            <Icon name={aboutOpen ? "ChevronUp" : "ChevronDown"} size={18} className="text-text-muted" />
          </button>
          {aboutOpen && (
            <p className="text-sm leading-relaxed text-text-secondary pb-4">
              {ev.about}
            </p>
          )}

          {/* Tickets section */}
          <div className="font-display font-semibold text-[17px] text-text border-t border-border pt-[18px] mb-3">
            Tickets
          </div>
          <div className="flex flex-col gap-3">
            {ev.tiers.map((tier) => (
              <TierSelector
                key={tier.id}
                tier={tier}
                qty={qty[tier.id] ?? 0}
                onQtyChange={handleQtyChange}
              />
            ))}
          </div>

          {/* Extra bottom padding so sticky bar doesn't cover last tier */}
          <div className="h-6" />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="shrink-0 border-t border-border bg-surface py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] md:pb-4">
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 flex items-center gap-3.5">
          <div className="flex-1">
            <div className="text-xs text-text-secondary">
              {count > 0 ? `${count} ticket${count > 1 ? "s" : ""}` : "Total"}
            </div>
            <div className="font-display font-bold text-[20px] mt-0.5">
              {formatSSP(total)}
            </div>
          </div>
          <Button
            disabled={count === 0}
            onClick={handleBook}
            aria-label="Book tickets"
            className="shrink-0"
          >
            Book tickets
          </Button>
        </div>
      </div>
    </div>
  );
}
