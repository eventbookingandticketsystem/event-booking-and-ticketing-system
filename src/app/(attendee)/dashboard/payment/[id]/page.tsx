'use client';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { StatusPill } from "@/components/Shared/StatusPill";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useConfirmPayment } from "@/lib/api/hooks/useConfirmPayment";
import { ROUTES } from "@/constants/routes";

const TOTAL_SECS = 300; // 5:00

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentPage({ params }: PageProps) {
  const { id } = use(params);   // event id — used for fallback only
  const router = useRouter();
  const confirmPayment = useConfirmPayment();

  const [secs, setSecs] = useState(TOTAL_SECS);
  const [phase, setPhase] = useState<"waiting" | "timeout">("waiting");
  const [copied, setCopied] = useState(false);

  // Read booking context written by BookingPage on mutation success
  const method = typeof window !== "undefined"
    ? (sessionStorage.getItem("tiketi-method") as "mtn" | "airtel") ?? "mtn"
    : "mtn";
  const total = typeof window !== "undefined"
    ? Number(sessionStorage.getItem("tiketi-total") ?? 0)
    : 0;
  const bookingId = typeof window !== "undefined"
    ? sessionStorage.getItem("tiketi-booking-id") ?? ""
    : "";
  // Event title for the compact summary header
  const eventTitle = typeof window !== "undefined"
    ? sessionStorage.getItem("tiketi-event-title") ?? ""
    : "";
  const eventDate = typeof window !== "undefined"
    ? sessionStorage.getItem("tiketi-event-date") ?? ""
    : "";

  const provider = method === "mtn" ? "MTN Mobile Money" : "Airtel Money";
  const ussdCode = method === "mtn" ? `*165*4*1*${total}#` : `*185*4*1*${total}#`;

  useEffect(() => {
    if (phase !== "waiting") return;
    if (secs <= 0) { setPhase("timeout"); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secs]);

  const mm  = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss  = String(secs % 60).padStart(2, "0");
  const low = secs < 60;

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(ussdCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleConfirmPayment = async () => {
    if (!bookingId) {
      // No booking ID — shouldn't happen; navigate anyway (demo fallback)
      router.push(ROUTES.CONFIRMATION);
      return;
    }
    try {
      await confirmPayment.mutateAsync(bookingId);
      router.push(ROUTES.CONFIRMATION);
    } catch {
      // Error surfaced via confirmPayment.error banner below
    }
  };

  const handleRetry = () => { setSecs(TOTAL_SECS); setPhase("waiting"); };

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
        <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">Complete payment</h1>
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
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-4 pb-8 flex flex-col gap-4">

          {/* Payment mutation error */}
          {confirmPayment.isError && (
            <AlertBanner
              tone="danger"
              title="Payment confirmation failed"
              message={confirmPayment.error?.message ?? "Could not confirm payment. Please try again."}
            />
          )}

          {/* Compact order summary */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-bg">
              <div>
                <div className="text-sm font-semibold text-text">{eventTitle || "Your booking"}</div>
                <div className="text-xs text-text-secondary mt-0.5">{eventDate}</div>
              </div>
              <div className="font-display font-bold text-[17px] shrink-0">{formatSSP(total)}</div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 border-t border-border/50">
              <span
                className="inline-flex items-center justify-center w-[34px] h-[34px] rounded text-[10px] font-bold shrink-0"
                style={{ background: method === "mtn" ? "#FFCC00" : "#FF0000", color: method === "mtn" ? "#000" : "#fff" }}
              >
                {method === "mtn" ? "MTN" : "Airtel"}
              </span>
              <span className="text-sm font-semibold text-text flex-1">{provider}</span>
              <StatusPill status="Confirmed" />
            </div>
          </div>

          {/* Timeout state */}
          {phase === "timeout" ? (
            <div className="flex flex-col gap-4">
              <AlertBanner
                tone="danger"
                title="Payment window expired"
                message="Your reserved tickets have been released. You can start again to re-reserve them."
              />
              <Button
                fullWidth
                size="lg"
                onClick={handleRetry}
                className="gap-2"
              >
                <Icon name="RotateCcw" size={18} />
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* USSD label */}
              <div>
                <p className="text-sm font-semibold text-text mb-2">
                  Dial this code on your phone to pay
                </p>
                {/* USSD box */}
                <div className="flex items-center gap-3 px-4 py-[18px] rounded-md bg-brand-navy text-white border border-brand-navy">
                  <span className="flex-1 font-mono text-[22px] font-medium tracking-[0.5px] break-all">
                    {ussdCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy USSD code"
                    className="w-10 h-10 rounded-sm border border-white/20 bg-white/8 inline-flex items-center justify-center shrink-0 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    <Icon name={copied ? "Check" : "Copy"} size={18} />
                  </button>
                </div>
              </div>

              {/* Open dialer */}
              <a
                href={`tel:${ussdCode}`}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-border bg-surface text-text text-sm font-semibold hover:bg-surface-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Icon name="PhoneCall" size={18} />
                Open dialer
              </a>

              {/* Countdown */}
              <div>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-text-muted">Payment window closes in</span>
                  <span className={cn("font-mono font-medium", low ? "text-status-warning" : "text-text")}>
                    {mm}:{ss}
                  </span>
                </div>
                <div className="h-2 rounded-pill bg-border overflow-hidden">
                  <div
                    className="h-full rounded-pill transition-[width] duration-1000"
                    style={{
                      width: `${(secs / TOTAL_SECS) * 100}%`,
                      background: low ? "#7A4A00" : "#FF5A00",
                    }}
                    role="progressbar"
                    aria-valuenow={secs}
                    aria-valuemin={0}
                    aria-valuemax={TOTAL_SECS}
                    aria-label="Payment countdown"
                  />
                </div>
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <svg className="animate-spin h-4 w-4 shrink-0 text-brand-orange" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Waiting for payment confirmation…
              </div>

              {/* Confirm payment — calls PATCH /api/bookings/[id] */}
              <Button
                fullWidth
                size="lg"
                loading={confirmPayment.isPending}
                disabled={confirmPayment.isPending}
                onClick={handleConfirmPayment}
                className="gap-2"
              >
                {confirmPayment.isPending ? (
                  "Confirming…"
                ) : (
                  <>
                    <Icon name="Check" size={18} />
                    I&apos;ve completed payment
                  </>
                )}
              </Button>

              <Button
                fullWidth
                variant="ghost"
                disabled={confirmPayment.isPending}
                onClick={handleConfirmPayment}
                className="text-text-secondary"
              >
                Simulate payment (demo)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
