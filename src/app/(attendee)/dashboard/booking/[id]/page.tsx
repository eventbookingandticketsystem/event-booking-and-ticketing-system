'use client';

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useEvent } from "@/lib/api/hooks/useEvent";
import { useCreateBooking } from "@/lib/api/hooks/useCreateBooking";
import { ROUTES } from "@/constants/routes";
import type { TicketTier } from "@/types/event";

interface BookingLine extends TicketTier {
  qty: number;
}

const SERVICE_FEE = 1;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BookingPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: ev, isLoading: evLoading, isError: evError } = useEvent(id);
  const createBooking = useCreateBooking();

  const [lines, setLines] = useState<BookingLine[]>([]);
  const [method, setMethod] = useState<"mtn" | "airtel">("mtn");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(`tiketi-booking-${id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as BookingLine[];
        setLines(parsed);
        return;
      }
    } catch { /* ignore */ }
    // Fallback: pick first available tier from the fetched event
    if (ev) {
      const firstAvail = ev.tiers.find((t) => !t.soldOut && t.remaining > 0);
      if (firstAvail) setLines([{ ...firstAvail, qty: 1 }]);
    }
  }, [id, ev]);

  const setQty = (tierId: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => l.id === tierId ? { ...l, qty: Math.max(0, Math.min(l.remaining, l.qty + delta)) } : l)
        .filter((l) => l.qty > 0)
    );
  };

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = subtotal + SERVICE_FEE;

  const apiMethod = method === "mtn" ? "MTN" : "AIRTEL";

  const handleConfirm = async () => {
    if (!ev || lines.length === 0) return;

    try {
      const booking = await createBooking.mutateAsync({
        eventId: id,
        lines: lines.map((l) => ({ tierId: l.id, qty: l.qty })),
        method: apiMethod,
      });

      // Persist booking data for payment + confirmation pages
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tiketi-booking-id",    booking.id);
        sessionStorage.setItem("tiketi-booking-ref",   booking.ref);
        sessionStorage.setItem("tiketi-method",        method);
        sessionStorage.setItem("tiketi-total",         String(booking.total));
        sessionStorage.setItem("tiketi-event-title",   booking.event?.title ?? ev.title);
        sessionStorage.setItem("tiketi-event-date",    booking.event?.date  ?? ev.date);
        sessionStorage.setItem("tiketi-ticket-count",  String(booking.tickets?.length ?? lines.reduce((a, l) => a + l.qty, 0)));
      }
      router.push(ROUTES.PAYMENT(id));
    } catch {
      // Error is surfaced via createBooking.error — already displayed in the banner
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (evLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
          <button type="button" onClick={() => router.back()} aria-label="Go back"
            className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="skeleton h-5 w-36 rounded flex-1" />
        </div>
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-4 flex flex-col gap-3">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-14" />
        </div>
      </div>
    );
  }

  // ── Event fetch error ───────────────────────────────────────────────────────
  if (evError || !ev) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
          <button type="button" onClick={() => router.back()} aria-label="Go back"
            className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">Booking summary</h1>
        </div>
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-6">
          <AlertBanner tone="danger" message="Event not found." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar — mobile only */}
      <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>
        <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">Booking summary</h1>
      </div>

      {/* Desktop back link — hidden on mobile */}
      <div className="hidden md:flex w-full max-w-3xl mx-auto px-8 pt-6 pb-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
        >
          <Icon name="ArrowLeft" size={16} />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Content — centred on desktop */}
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-4 pb-8">

          {/* Booking mutation error — server message surfaced here */}
          {createBooking.isError && (
            <div className="mb-4">
              <AlertBanner
                tone="danger"
                title="Booking failed"
                message={createBooking.error?.message ?? "Could not create booking. Please try again."}
              />
            </div>
          )}

          {/* Order summary card */}
          <div className="border border-border rounded-md overflow-hidden mb-5">
            <div className="px-4 py-3.5 bg-surface-bg border-b border-border">
              <div className="font-display font-semibold text-[15px] text-text">{ev.title}</div>
              <div className="text-[13px] text-text-secondary mt-0.5">{ev.date} · {ev.venue}</div>
            </div>

            {lines.length === 0 && (
              <div className="px-4 py-[18px] text-center text-sm text-text-secondary">
                No tickets selected. Go back to add at least one.
              </div>
            )}

            {lines.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text">{l.name}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{formatSSP(l.price)} each</div>
                  {l.qty >= l.remaining && (
                    <div className="flex items-center gap-1 text-xs text-status-warning mt-0.5">
                      <Icon name="TriangleAlert" size={11} />
                      Only {l.remaining} remaining
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5" role="group" aria-label={`Qty for ${l.name}`}>
                  <button
                    type="button"
                    onClick={() => setQty(l.id, -1)}
                    aria-label="Remove one"
                    className="w-7 h-7 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    <Icon name="Minus" size={13} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(l.id, 1)}
                    disabled={l.qty >= l.remaining}
                    aria-label="Add one"
                    className="w-7 h-7 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-40"
                  >
                    <Icon name="Plus" size={13} />
                  </button>
                </div>
                <div className="font-display font-semibold text-sm shrink-0">{formatSSP(l.qty * l.price)}</div>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
              <div className="text-sm font-medium text-text-secondary">Service fee</div>
              <div className="font-display font-semibold text-sm">{formatSSP(SERVICE_FEE)}</div>
            </div>

            <div className="flex items-center justify-between px-4 py-[15px] bg-surface-bg border-t border-border">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-display font-bold text-[20px]">{formatSSP(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="font-display font-semibold text-[17px] text-text mb-3">
            Payment method
          </div>
          <div className="flex flex-col gap-3">
            {([
              { id: "mtn",    label: "MTN Mobile Money", color: "#FFCC00", textColor: "#000" },
              { id: "airtel", label: "Airtel Money",      color: "#FF0000", textColor: "#fff" },
            ] as const).map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                  method === opt.id
                    ? "border-brand-orange bg-surface-alt"
                    : "border-border bg-surface hover:border-brand-orange/40",
                )}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={method === opt.id}
                  onChange={() => setMethod(opt.id)}
                  className="sr-only"
                  aria-label={opt.label}
                />
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded text-xs font-bold shrink-0"
                  style={{ background: opt.color, color: opt.textColor }}
                >
                  {opt.id === "mtn" ? "MTN" : "Airtel"}
                </span>
                <span className="flex-1 text-sm font-semibold text-text">{opt.label}</span>
                <span className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 inline-flex items-center justify-center",
                  method === opt.id ? "border-brand-orange" : "border-border",
                )}>
                  {method === opt.id && (
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* Confirm button — inline on desktop (no sticky bar) */}
          <div className="mt-6">
            <Button
              fullWidth
              size="lg"
              disabled={lines.length === 0 || createBooking.isPending}
              loading={createBooking.isPending}
              onClick={handleConfirm}
              aria-label="Confirm booking"
            >
              {createBooking.isPending ? "Creating booking…" : "Confirm booking"}
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar — mobile only */}
      <div className="md:hidden shrink-0 border-t border-border bg-surface px-[18px] py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]">
        <Button
          fullWidth
          size="lg"
          disabled={lines.length === 0 || createBooking.isPending}
          loading={createBooking.isPending}
          onClick={handleConfirm}
          aria-label="Confirm booking"
        >
          {createBooking.isPending ? "Creating booking…" : "Confirm booking"}
        </Button>
      </div>
    </div>
  );
}
