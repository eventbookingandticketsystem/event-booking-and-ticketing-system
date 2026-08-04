'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP, formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import apiClient from "@/lib/api/client";

interface BookingContext {
  bookingRef:  string;
  total:       number;
  eventTitle:  string;
  eventDate:   string;
  ticketCount: string;
}

export default function ConfirmationPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [ctx, setCtx] = useState<BookingContext>({
    bookingRef:  "—",
    total:       0,
    eventTitle:  "—",
    eventDate:   "",
    ticketCount: "1",
  });

  // Read sessionStorage only on the client to avoid hydration mismatch
  useEffect(() => {
    setCtx({
      bookingRef:  sessionStorage.getItem("tiketi-booking-ref")   ?? "—",
      total:       Number(sessionStorage.getItem("tiketi-total")  ?? 0),
      eventTitle:  sessionStorage.getItem("tiketi-event-title")   ?? "—",
      eventDate:   sessionStorage.getItem("tiketi-event-date")    ?? "",
      ticketCount: sessionStorage.getItem("tiketi-ticket-count")  ?? "1",
    });
  }, []);

  // When Stripe redirects back with ?session_id=..., poll until confirmed
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const bookingId = sessionStorage.getItem("tiketi-booking-id");
    if (!sessionId || !bookingId) return;

    console.log("[confirmation] polling booking:", bookingId, "stripe session:", sessionId);

    let tries = 0;
    const iv = setInterval(async () => {
      tries++;
      try {
        const res = await apiClient.get<{ data: { status: string } }>(
          `/payments/status/${encodeURIComponent(bookingId)}`,
        );
        const status = res.data.data.status;
        console.log("[confirmation] poll", tries, "→ status:", status);
        if (status === "CONFIRMED") {
          clearInterval(iv);
          const url = new URL(window.location.href);
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        }
      } catch (e) {
        console.warn("[confirmation] poll error:", e);
      }
      if (tries >= 20) {
        console.warn("[confirmation] gave up polling after", tries, "attempts");
        clearInterval(iv);
      }
    }, 3000);

    return () => clearInterval(iv);
  }, [searchParams]);

  const displayDate = ctx.eventDate ? formatDate(ctx.eventDate) : "—";

  const summaryRows = [
    { k: "Event",   v: ctx.eventTitle },
    { k: "Date",    v: displayDate },
    { k: "Tickets", v: ctx.ticketCount },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto px-4 md:px-8 pt-9 pb-8">

        {/* Success icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-[88px] h-[88px] rounded-full bg-status-success-bg text-status-success inline-flex items-center justify-center mb-5">
            <Icon name="Check" size={44} strokeWidth={3} className="text-status-success" />
          </span>
          <h1 className="font-display font-bold text-[24px] text-text m-0 mb-1.5">
            Booking confirmed
          </h1>
          <p className="text-sm text-text-secondary">Your tickets are ready in your wallet.</p>
          <div className="font-mono text-[15px] bg-surface-bg px-3.5 py-2 rounded-sm mt-1.5 tracking-[0.5px]">
            {ctx.bookingRef}
          </div>
        </div>

        {/* Summary card */}
        <div className="border border-border rounded-md overflow-hidden mb-[18px]">
          {summaryRows.map((row) => (
            <div key={row.k} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50">
              <span className="text-sm font-medium text-text-secondary">{row.k}</span>
              <span className="font-display font-semibold text-sm text-text">{row.v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-[15px] bg-surface-bg border-t border-border">
            <span className="text-sm font-semibold">Total paid</span>
            <span className="font-display font-bold text-[20px]">{formatSSP(ctx.total)}</span>
          </div>
        </div>

        {/* Info banner */}
        <AlertBanner
          tone="info"
          title="Ticket link sent"
          message="A confirmation with your ticket link was sent to your registered phone number."
          className="mb-[18px]"
        />

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button fullWidth size="lg" onClick={() => router.push(ROUTES.TICKETS)} className="gap-2">
            <Icon name="Ticket" size={18} />
            View my tickets
          </Button>
          <Button fullWidth variant="ghost" onClick={() => router.push(ROUTES.DASHBOARD)}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
