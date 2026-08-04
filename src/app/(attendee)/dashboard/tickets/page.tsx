'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { StatusPill } from "@/components/Shared/StatusPill";
import type { StatusValue } from "@/components/Shared/StatusPill";
import { cn, formatSSP, formatDate } from "@/lib/utils";
import { useBookings } from "@/lib/api/hooks/useBookings";
import { ROUTES } from "@/constants/routes";
import { POSTERS } from "@/lib/mock-data";
import type { ApiMyBooking } from "@/lib/api/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

type BookingStatus = ApiMyBooking["status"];

function pillStatus(s: BookingStatus): StatusValue {
  switch (s) {
    case "CONFIRMED": return "Confirmed";
    case "PENDING":   return "Pending";
    case "FAILED":    return "Rejected";
    case "EXPIRED":   return "Expired";
    case "REFUNDED":  return "Archived";
  }
}

function statusLabel(s: BookingStatus): string {
  switch (s) {
    case "CONFIRMED": return "Payment confirmed — your tickets are ready";
    case "PENDING":   return "Awaiting payment — complete within the payment window";
    case "FAILED":    return "Payment failed — seats released, book again to retry";
    case "EXPIRED":   return "Seats released — booking window closed";
    case "REFUNDED":  return "Refunded";
  }
}

function isRetryable(s: BookingStatus): boolean {
  return s === "FAILED" || s === "EXPIRED";
}

function bookingTab(b: ApiMyBooking): "upcoming" | "pending" | "past" {
  if (b.status === "PENDING" || b.status === "FAILED" || b.status === "EXPIRED") {
    return "pending";
  }
  const eventDate = new Date(b.event.date);
  return eventDate > new Date() ? "upcoming" : "past";
}

// ── Event group card ──────────────────────────────────────────────────────────
// Groups ALL bookings under the same event into a single expandable card.

interface EventGroupProps {
  bookings: ApiMyBooking[];
  onResume: (b: ApiMyBooking) => void;
  onRetry:  (b: ApiMyBooking) => void;
}

function EventGroupCard({ bookings, onResume, onRetry }: EventGroupProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  // Use the first booking's event info for the header
  const { event } = bookings[0];
  const poster = POSTERS[event.category] ?? POSTERS["Conference"];

  // All confirmed tickets across all bookings in this group
  const allTickets = bookings.flatMap((b) =>
    b.status === "CONFIRMED" ? b.tickets : [],
  );
  const totalTickets = allTickets.length;

  // Representative status for the group header: prefer CONFIRMED, then PENDING
  const dominantBooking =
    bookings.find((b) => b.status === "CONFIRMED") ??
    bookings.find((b) => b.status === "PENDING") ??
    bookings[0];
  const isConfirmedGroup = bookings.some((b) => b.status === "CONFIRMED");

  return (
    <div
      className={cn(
        "w-full bg-surface border rounded-lg shadow-card overflow-hidden",
        isConfirmedGroup ? "border-border" : "border-status-warning/60",
      )}
    >
      {/* ── Poster header ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} bookings for ${event.title}`}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-inset"
      >
        <div
          className="relative h-[88px] overflow-hidden"
          style={{ backgroundImage: poster }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              background: isConfirmedGroup
                ? "linear-gradient(to right, rgba(8,40,59,0.72) 0%, rgba(8,40,59,0.22) 100%)"
                : "linear-gradient(to right, rgba(40,10,10,0.78) 0%, rgba(40,10,10,0.35) 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-end justify-between p-3 gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/50 mb-0.5">
                {event.category}
              </p>
              <h3 className="font-display font-bold text-sm text-white leading-tight line-clamp-1">
                {event.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {totalTickets > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.15] backdrop-blur-sm rounded-pill text-[11px] font-semibold text-white">
                  <Icon name="Ticket" size={10} />
                  {totalTickets}
                </span>
              )}
              <span
                className={cn(
                  "w-7 h-7 rounded-full bg-white/[0.1] inline-flex items-center justify-center transition-transform duration-200",
                  expanded && "rotate-180",
                )}
              >
                <Icon name="ChevronDown" size={16} className="text-white" />
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* ── Collapsed summary: show dominant booking status ───────────────── */}
      {!expanded && (
        <div className="px-4 py-3 flex items-start gap-3">
          <div
            className={cn(
              "shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5",
              dominantBooking.status === "CONFIRMED" ? "bg-status-success-bg text-status-success"
              : dominantBooking.status === "PENDING"  ? "bg-status-warning-bg text-status-warning"
              : "bg-status-danger-bg text-status-danger",
            )}
            aria-hidden="true"
          >
            <Icon
              name={
                dominantBooking.status === "CONFIRMED" ? "CircleCheck"
                : dominantBooking.status === "PENDING"  ? "Clock"
                : "CircleX"
              }
              size={18}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusPill status={pillStatus(dominantBooking.status)} size="sm" />
              <span className="text-[11px] font-mono text-text-muted">{dominantBooking.ref}</span>
              {bookings.length > 1 && (
                <span className="text-[11px] text-text-muted">+{bookings.length - 1} more</span>
              )}
            </div>
            <p className="text-[12px] text-text-secondary leading-snug">
              {statusLabel(dominantBooking.status)}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={10} />
                {formatDate(event.date)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="MapPin" size={10} />
                {event.venue}
              </span>
              <span className="flex items-center gap-1 font-semibold text-text-secondary">
                <Icon name="CreditCard" size={10} />
                {formatSSP(bookings.reduce((s, b) => s + b.total, 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded: one section per booking ────────────────────────────── */}
      {expanded && (
        <div>
          {bookings.map((booking, bIdx) => {
            const isConfirmed = booking.status === "CONFIRMED";
            const isPending   = booking.status === "PENDING";
            return (
              <div
                key={booking.id}
                className={cn(
                  "border-t border-border/60",
                  bIdx === 0 && "border-t",
                )}
              >
                {/* Booking header row */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
                      isConfirmed ? "bg-status-success-bg text-status-success"
                      : isPending  ? "bg-status-warning-bg text-status-warning"
                      : "bg-status-danger-bg text-status-danger",
                    )}
                    aria-hidden="true"
                  >
                    <Icon
                      name={isConfirmed ? "CircleCheck" : isPending ? "Clock" : "CircleX"}
                      size={16}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <StatusPill status={pillStatus(booking.status)} size="sm" />
                      <span className="text-[11px] font-mono text-text-muted">{booking.ref}</span>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-snug">
                      {statusLabel(booking.status)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" size={10} />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="MapPin" size={10} />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-text-secondary">
                        <Icon name="CreditCard" size={10} />
                        {formatSSP(booking.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket rows — confirmed bookings only */}
                {isConfirmed && booking.tickets.length > 0 && (
                  <div className="divide-y divide-border/40 bg-surface-bg/40">
                    {booking.tickets.map((t, idx) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => router.push(ROUTES.TICKET_QR(t.ticketRef))}
                        aria-label={`View QR for ${t.tier} — ${t.ticketRef}`}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-surface-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                      >
                        <span className="shrink-0 w-5 h-5 rounded-full bg-surface border border-border text-[10px] font-bold text-text-secondary inline-flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div
                          className="shrink-0 w-9 h-9 rounded border-2 border-brand-navy flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <Icon name="QrCode" size={16} className="text-brand-navy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text truncate">{t.tier}</div>
                          <div className="text-[11px] font-mono text-text-muted">{t.ticketRef}</div>
                        </div>
                        <Icon name="ChevronRight" size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                )}

                {/* CTA for this booking */}
                {(isConfirmed || isPending || isRetryable(booking.status)) && (
                  <div className="flex gap-2 px-4 py-2.5 border-t border-border/40 bg-surface">
                    {isConfirmed && booking.tickets.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(ROUTES.TICKET_QR(booking.tickets[0].ticketRef))}
                        className="flex-1 gap-1.5"
                      >
                        <Icon name="QrCode" size={14} />
                        View tickets
                      </Button>
                    )}
                    {isPending && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onResume(booking)}
                          className="flex-1 gap-1.5"
                        >
                          <Icon name="PhoneCall" size={14} />
                          Resume payment
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRetry(booking)}
                          className="gap-1.5 text-text-secondary"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {isRetryable(booking.status) && (
                      <Button
                        size="sm"
                        onClick={() => onRetry(booking)}
                        className="flex-1 gap-1.5 bg-brand-orange hover:bg-brand-orange-hover"
                      >
                        <Icon name="RotateCcw" size={14} />
                        Book again
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "pending" | "past">("upcoming");

  const { data: allBookings, isLoading, isError, error } = useBookings();

  // Group bookings by eventId within the active tab
  const tabBookings = (allBookings ?? []).filter((b) => bookingTab(b) === tab);

  const grouped = tabBookings.reduce<Map<string, ApiMyBooking[]>>((map, b) => {
    const key = b.event.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(b);
    return map;
  }, new Map());

  const groups = Array.from(grouped.entries());

  const pendingCount = (allBookings ?? []).filter((b) => bookingTab(b) === "pending").length;

  const handleResume = async (booking: ApiMyBooking) => {
    // Persist context for confirmation page
    sessionStorage.setItem("tiketi-booking-id",   booking.id);
    sessionStorage.setItem("tiketi-booking-ref",  booking.ref);
    sessionStorage.setItem("tiketi-method",       booking.method.toLowerCase());
    sessionStorage.setItem("tiketi-total",        String(booking.total));
    sessionStorage.setItem("tiketi-event-title",  booking.event.title);
    sessionStorage.setItem("tiketi-event-date",   formatDate(booking.event.date));
    sessionStorage.setItem("tiketi-ticket-count", String(booking.tickets.length));

    if (booking.method === "CARD") {
      // Re-create a Stripe Checkout session for this booking
      try {
        const res = await fetch("/api/payments/stripe-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: booking.id }),
        });
        const json = await res.json();
        const url: string | undefined = json?.data?.url;
        if (url) {
          window.location.assign(url);
          return;
        }
        console.error("[resume] stripe-session error:", json);
      } catch (e) {
        console.error("[resume] stripe-session fetch failed:", e);
      }
      return;
    }

    // MoMo / PayPack flow
    router.push(ROUTES.PAYMENT(booking.event.id));
  };

  const handleRetry = (booking: ApiMyBooking) => {
    router.push(ROUTES.EVENT_DETAIL(booking.event.id));
  };

  return (
    <div className="flex flex-col">
      {/* Top bar — mobile only */}
      <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <h1 className="font-display font-semibold text-[22px] text-text flex-1 m-0">
          My Tickets
        </h1>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 md:px-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-bg rounded-md mt-4 md:mt-6" role="tablist">
          {(["upcoming", "pending", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "relative flex-1 h-[38px] rounded-sm text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                tab === t
                  ? "bg-surface text-text shadow-card"
                  : "bg-transparent text-text-secondary hover:text-text",
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-status-warning text-[10px] font-bold text-white leading-none">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Booking list */}
        <div className="pt-4 pb-8 flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[160px]" />
            ))
          ) : isError ? (
            <AlertBanner
              tone="danger"
              message={(error as Error)?.message ?? "Failed to load tickets. Please try again."}
            />
          ) : groups.length === 0 ? (
            tab === "upcoming" ? (
              <EmptyState
                icon="Ticket"
                heading="No upcoming tickets"
                subtext="Browse events to book your first ticket."
                cta={
                  <Button size="sm" onClick={() => router.push(ROUTES.DASHBOARD)} className="mt-1">
                    Browse events
                  </Button>
                }
              />
            ) : tab === "pending" ? (
              <EmptyState
                icon="CircleCheck"
                heading="No pending bookings"
                subtext="All caught up — no payments waiting or failed bookings to retry."
              />
            ) : (
              <EmptyState
                icon="Clock"
                heading="No past events yet"
                subtext="Tickets from events you've attended will appear here."
              />
            )
          ) : (
            groups.map(([eventId, bookings]) => (
              <EventGroupCard
                key={eventId}
                bookings={bookings}
                onResume={handleResume}
                onRetry={handleRetry}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
