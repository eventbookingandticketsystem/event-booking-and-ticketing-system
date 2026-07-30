"use client";

import { useState, use, useEffect, useRef } from "react";
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
import apiClient from "@/lib/api/client";

interface BookingLine extends TicketTier {
  qty: number;
}

const SERVICE_FEE = 0;

// Rwanda phone prefixes accepted by PayPack
const RWANDA_PREFIXES = ["078", "079", "075", "072", "073"];

function normalizeRwandaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("2507")) local = "0" + local.slice(3);
  else if (local.startsWith("250")) local = "0" + local.slice(3);
  else if (local.length === 9 && !local.startsWith("0")) local = "0" + local;
  // Match PayPack's own regex: 078/079/075/073/072
  if (!/^07[235789]\d{7}$/.test(local)) return null;
  return local;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BookingPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: ev, isLoading: evLoading, isError: evError } = useEvent(id);
  const createBooking = useCreateBooking();

  // Stored overrides from sessionStorage (set when user came from event detail page).
  // Read once on mount — never written back from an effect.
  const [storedLines] = useState<BookingLine[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(`tiketi-booking-${id}`);
      if (raw) return JSON.parse(raw) as BookingLine[];
    } catch {
      /* ignore */
    }
    return null;
  });

  // User-driven quantity overrides (keyed by tier id → qty).
  // Start empty; populated when the user taps +/-.
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});

  const [method, setMethod] = useState<"mtn" | "airtel" | "card">("mtn");

  // Phone modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [payPhone, setPayPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cashinLoading, setCashinLoading] = useState(false);
  const [cashinError, setCashinError] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // The booking that was just created — held while modal is open
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  // Derive the lines to display — no setState in any effect.
  // Priority: storedLines (from session) > event first-tier default + user overrides.
  const lines: BookingLine[] = storedLines
    ? storedLines
        .map((l) =>
          l.id in qtyOverrides ? { ...l, qty: qtyOverrides[l.id] } : l,
        )
        .filter((l) => l.qty > 0)
    : ev
      ? ev.tiers
          .filter((t) => !t.soldOut && t.remaining > 0)
          .slice(0, 1) // default: first available tier
          .map((t) => ({
            ...t,
            qty: qtyOverrides[t.id] ?? 1,
          }))
          .filter((l) => l.qty > 0)
      : [];

  // Focus phone input when modal opens
  useEffect(() => {
    if (showPhoneModal) {
      setTimeout(() => phoneInputRef.current?.focus(), 80);
    }
  }, [showPhoneModal]);

  const setQty = (tierId: string, delta: number) => {
    // Find current qty from derived lines so we can clamp correctly
    const current = lines.find((l) => l.id === tierId);
    if (!current) return;
    const next = Math.max(0, Math.min(current.remaining, current.qty + delta));
    setQtyOverrides((prev) => ({ ...prev, [tierId]: next }));
  };

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const total = subtotal + SERVICE_FEE;

  const apiMethod =
    method === "mtn" ? "MTN" : method === "airtel" ? "AIRTEL" : "CARD";

  // Step 1: create the booking, then open the phone modal
  const handleConfirm = async () => {
    if (!ev || lines.length === 0) return;
    setCashinError("");
    try {
      const booking = await createBooking.mutateAsync({
        eventId: id,
        lines: lines.map((l) => ({ tierId: l.id, qty: l.qty })),
        method: apiMethod,
      });

      // Persist booking data for payment + confirmation pages
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tiketi-booking-id", booking.id);
        sessionStorage.setItem("tiketi-booking-ref", booking.ref);
        sessionStorage.setItem("tiketi-method", method);
        sessionStorage.setItem("tiketi-total", String(booking.total));
        sessionStorage.setItem("tiketi-event-id", id); // event ID for "Try again"
        sessionStorage.setItem(
          "tiketi-event-title",
          booking.event?.title ?? ev.title,
        );
        sessionStorage.setItem(
          "tiketi-event-date",
          booking.event?.date ?? ev.date,
        );
        sessionStorage.setItem(
          "tiketi-ticket-count",
          String(
            booking.tickets?.length ?? lines.reduce((a, l) => a + l.qty, 0),
          ),
        );
      }

      if (method === "card") {
        // Stripe — create a checkout session and redirect
        const res = await apiClient.post<{ data: { url: string } }>(
          "/payments/stripe-session",
          {
            bookingId: booking.id,
          },
        );
        const url = res.data.data.url;
        if (url) window.location.assign(url);
        return;
      }

      setPendingBookingId(booking.id);
      setShowPhoneModal(true);
    } catch {
      // Error surfaced via createBooking.error banner
    }
  };

  // Step 2: submit phone → call PayPack cashin → navigate to payment page
  const handlePhoneSubmit = async () => {
    setPhoneError("");
    setCashinError("");

    const normalized = normalizeRwandaPhone(payPhone);
    if (!normalized) {
      setPhoneError(
        `Enter a valid Rwanda number (${RWANDA_PREFIXES.join(", ")})`,
      );
      return;
    }

    if (!pendingBookingId) return;
    setCashinLoading(true);
    try {
      await apiClient.post("/payments/cashin", {
        bookingId: pendingBookingId,
        phone: normalized,
      });
      // Success — navigate to the dialer / waiting page
      setShowPhoneModal(false);
      router.push(ROUTES.PAYMENT(id));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Payment initiation failed. Please try again.";
      setCashinError(msg);
    } finally {
      setCashinLoading(false);
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits
    setPayPhone(e.target.value.replace(/[^\d+]/g, ""));
    setPhoneError("");
    setCashinError("");
  };

  const methodLabel =
    method === "mtn"
      ? "MTN Mobile Money"
      : method === "airtel"
        ? "Airtel Money"
        : "Credit / Debit Card";

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (evLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
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

  // ── Event fetch error ────────────────────────────────────────────────────────
  if (evError || !ev) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-surface-bg inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">
            Booking summary
          </h1>
        </div>
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-6">
          <AlertBanner tone="danger" message="Event not found." />
        </div>
      </div>
    );
  }

  return (
    <>
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
          <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">
            Booking summary
          </h1>
        </div>

        {/* Desktop back link */}
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
          <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-4 pb-8">
            {/* Booking mutation error */}
            {createBooking.isError && (
              <div className="mb-4">
                <AlertBanner
                  tone="danger"
                  title="Booking failed"
                  message={
                    createBooking.error?.message ??
                    "Could not create booking. Please try again."
                  }
                />
              </div>
            )}

            {/* Order summary card */}
            <div className="border border-border rounded-md overflow-hidden mb-5">
              <div className="px-4 py-3.5 bg-surface-bg border-b border-border">
                <div className="font-display font-semibold text-[15px] text-text">
                  {ev.title}
                </div>
                <div className="text-[13px] text-text-secondary mt-0.5">
                  {ev.date} · {ev.venue}
                </div>
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
                    <div className="text-sm font-semibold text-text">
                      {l.name}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {formatSSP(l.price)} each
                    </div>
                    {l.qty >= l.remaining && (
                      <div className="flex items-center gap-1 text-xs text-status-warning mt-0.5">
                        <Icon name="TriangleAlert" size={11} />
                        Only {l.remaining} remaining
                      </div>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-1.5"
                    role="group"
                    aria-label={`Qty for ${l.name}`}
                  >
                    <button
                      type="button"
                      onClick={() => setQty(l.id, -1)}
                      aria-label="Remove one"
                      className="w-7 h-7 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                    >
                      <Icon name="Minus" size={13} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {l.qty}
                    </span>
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
                  <div className="font-display font-semibold text-sm shrink-0">
                    {formatSSP(l.qty * l.price)}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between px-4 py-[15px] bg-surface-bg border-t border-border">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display font-bold text-[20px]">
                  {formatSSP(total)}
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div className="font-display font-semibold text-[17px] text-text mb-3">
              Payment method
            </div>
            <div className="flex flex-col gap-3">
              {(
                [
                  {
                    id: "mtn",
                    label: "MTN Mobile Money",
                    color: "#FFCC00",
                    textColor: "#000",
                    abbr: "MTN",
                  },
                  {
                    id: "airtel",
                    label: "Airtel Money",
                    color: "#FF0000",
                    textColor: "#fff",
                    abbr: "Airtel",
                  },
                  {
                    id: "card",
                    label: "Credit / Debit Card",
                    color: "#635BFF",
                    textColor: "#fff",
                    abbr: "Card",
                  },
                ] as const
              ).map((opt) => (
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
                    {opt.abbr}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-text">
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0 inline-flex items-center justify-center",
                      method === opt.id
                        ? "border-brand-orange"
                        : "border-border",
                    )}
                  >
                    {method === opt.id && (
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-orange" />
                    )}
                  </span>
                </label>
              ))}
            </div>

            {/* Confirm button — desktop inline */}
            <div className="mt-6">
              <Button
                fullWidth
                size="lg"
                disabled={lines.length === 0 || createBooking.isPending}
                loading={createBooking.isPending}
                onClick={handleConfirm}
                aria-label="Confirm booking"
              >
                {createBooking.isPending
                  ? "Creating booking…"
                  : "Confirm booking"}
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

      {/* ── Phone number modal ─────────────────────────────────────────────── */}
      {showPhoneModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Enter payment phone number"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => !cashinLoading && setShowPhoneModal(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-pop overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div>
                <h2 className="font-display font-semibold text-[18px] text-[#0F1A20]">
                  Enter payment number
                </h2>
                <p className="text-[13px] text-[#5A6870] mt-0.5">
                  We will send a payment request to your {methodLabel} number
                </p>
              </div>
              <button
                type="button"
                onClick={() => !cashinLoading && setShowPhoneModal(false)}
                aria-label="Close"
                disabled={cashinLoading}
                className="w-8 h-8 rounded-full inline-flex items-center justify-center hover:bg-[#F7F6F2] text-[#5A6870] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange disabled:opacity-40"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 flex flex-col gap-4">
              {/* Amount summary */}
              <div className="flex items-center justify-between px-4 py-3 rounded-md bg-[#F7F6F2] border border-[#E2E0D8]">
                <span className="text-sm font-medium text-[#5A6870]">
                  Amount to pay
                </span>
                <span className="font-display font-bold text-[18px] text-[#0F1A20]">
                  {formatSSP(total)}
                </span>
              </div>

              {/* Phone input */}
              <div>
                <label
                  htmlFor="pay-phone"
                  className="block text-sm font-semibold text-[#0F1A20] mb-1.5"
                >
                  {methodLabel} number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#5A6870] pointer-events-none select-none">
                    +250
                  </span>
                  <input
                    ref={phoneInputRef}
                    id="pay-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="078 XXX XXX"
                    value={payPhone}
                    onChange={handlePhoneInput}
                    disabled={cashinLoading}
                    aria-invalid={!!phoneError}
                    aria-describedby={phoneError ? "phone-error" : undefined}
                    className={cn(
                      "w-full h-11 pl-12 pr-4 rounded-md border text-[#0F1A20] text-sm font-medium placeholder:text-[#6B7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange transition-colors disabled:opacity-50",
                      phoneError
                        ? "border-status-danger"
                        : "border-[#E2E0D8] hover:border-[#a0a09a]",
                    )}
                  />
                </div>
                {phoneError && (
                  <p
                    id="phone-error"
                    className="mt-1 text-xs text-status-danger"
                  >
                    {phoneError}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-[#6B7280]">
                  MTN: 078/079/075 · Airtel: 072/073
                </p>
              </div>

              {/* Cashin API error */}
              {cashinError && (
                <AlertBanner tone="danger" message={cashinError} />
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  fullWidth
                  size="lg"
                  loading={cashinLoading}
                  disabled={cashinLoading || !payPhone}
                  onClick={handlePhoneSubmit}
                  aria-label="Send payment request"
                >
                  {cashinLoading ? "Sending request…" : "Send payment request"}
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  disabled={cashinLoading}
                  onClick={() => setShowPhoneModal(false)}
                  className="text-[#5A6870]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
