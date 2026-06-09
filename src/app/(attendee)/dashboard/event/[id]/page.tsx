'use client';

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { TierSelector } from "@/components/Shared/TierSelector";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { EVENT_BY_ID } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import type { TicketTier } from "@/types/event";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const ev = EVENT_BY_ID[id];
  if (!ev) notFound();

  const [qty, setQty] = useState<Record<string, number>>({});
  const [aboutOpen, setAboutOpen] = useState(true);

  const handleQtyChange = (tierId: string, delta: number) => {
    setQty((prev) => {
      const tier = ev.tiers.find((t) => t.id === tierId);
      if (!tier) return prev;
      const current = prev[tierId] ?? 0;
      const next = Math.max(0, Math.min(tier.remaining, current + delta));
      return { ...prev, [tierId]: next };
    });
  };

  const total = ev.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.price, 0);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);

  const handleBook = () => {
    if (typeof window !== "undefined") {
      const lines = ev.tiers
        .filter((t) => (qty[t.id] ?? 0) > 0)
        .map((t) => ({ ...t, qty: qty[t.id] ?? 0 }));
      sessionStorage.setItem(`tiketi-booking-${ev.id}`, JSON.stringify(lines));
    }
    router.push(ROUTES.BOOKING(ev.id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {/* Poster hero */}
        <div
          className="relative h-[240px] md:h-[300px] bg-cover bg-center shrink-0"
          style={{ backgroundImage: ev.poster }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(8,40,59,.35) 0%, rgba(8,40,59,0) 30%, rgba(8,40,59,.15) 100%)" }}
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
