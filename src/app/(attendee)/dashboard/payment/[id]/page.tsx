"use client";

import { useState, useEffect, useRef, use, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Shared/Button";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { StatusPill } from "@/components/Shared/StatusPill";
import { Icon } from "@/components/Shared/Icon";
import { cn, formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import apiClient from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/types";

const TOTAL_SECS = 300; // 5:00
const POLL_INTERVAL_MS = 3000;

interface BookingStatus {
  id: string;
  ref: string;
  status: "PENDING" | "CONFIRMED" | "FAILED" | "EXPIRED" | "REFUNDED";
  paidAt: string | null;
  total: number;
}

// ── Reducer keeps all phase transitions out of effect bodies ──────────────────
type Phase = "waiting" | "timeout" | "failed";
type Action =
  | { type: "TICK" }
  | { type: "TIMEOUT" }
  | { type: "FAILED" }
  | { type: "COPIED" }
  | { type: "UNCOPY" };

interface State {
  secs: number;
  phase: Phase;
  copied: boolean;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TICK":
      if (state.secs <= 1) return { ...state, secs: 0, phase: "timeout" };
      return { ...state, secs: state.secs - 1 };
    case "TIMEOUT":
      return { ...state, phase: "timeout" };
    case "FAILED":
      return { ...state, phase: "failed" };
    case "COPIED":
      return { ...state, copied: true };
    case "UNCOPY":
      return { ...state, copied: false };
    default:
      return state;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Read booking context written by BookingPage — stable, read once
  const [ctx] = useState(() => {
    if (typeof window === "undefined") {
      return {
        method: "mtn" as "mtn" | "airtel",
        total: 0,
        bookingId: "",
        eventId: "",
        eventTitle: "",
        eventDate: "",
      };
    }
    return {
      method:
        (sessionStorage.getItem("tiketi-method") as "mtn" | "airtel") ?? "mtn",
      total: Number(sessionStorage.getItem("tiketi-total") ?? 0),
      bookingId: sessionStorage.getItem("tiketi-booking-id") ?? "",
      eventId: sessionStorage.getItem("tiketi-event-id") ?? "",
      eventTitle: sessionStorage.getItem("tiketi-event-title") ?? "",
      eventDate: sessionStorage.getItem("tiketi-event-date") ?? "",
    };
  });

  const [state, dispatch] = useReducer(reducer, {
    secs: TOTAL_SECS,
    phase: "waiting",
    copied: false,
  });

  const { secs, phase, copied } = state;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didRedirect = useRef(false);

  // Manual confirm state
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const provider = ctx.method === "mtn" ? "MTN Mobile Money" : "Airtel Money";
  const ussdCode = `*182*7*1#`;

  // ── Polling: DB-only — webhook updates booking status in production ─────────
  useEffect(() => {
    if (!ctx.bookingId || phase !== "waiting") return;

    const poll = async () => {
      try {
        const res = await apiClient.get<ApiResponse<BookingStatus>>(
          `/payments/status/${encodeURIComponent(ctx.bookingId)}`,
        );
        const status = res.data.data.status;

        if (status === "CONFIRMED" && !didRedirect.current) {
          didRedirect.current = true;
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(ROUTES.CONFIRMATION);
        } else if (status === "FAILED" || status === "EXPIRED") {
          if (pollRef.current) clearInterval(pollRef.current);
          dispatch({ type: "FAILED" });
        }
      } catch {
        // Network blip — keep polling silently
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [ctx.bookingId, phase, router]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "waiting") return;
    const t = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Stop polling when countdown expires
  useEffect(() => {
    if (phase !== "waiting" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [phase]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const low = secs < 60;

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(ussdCode).catch(() => {});
    }
    dispatch({ type: "COPIED" });
    setTimeout(() => dispatch({ type: "UNCOPY" }), 1500);
  };

  // User-triggered: call PayPack to check if payment went through
  const handleConfirmPayment = async () => {
    if (!ctx.bookingId) return;
    setConfirmLoading(true);
    setConfirmError("");
    try {
      const res = await apiClient.post<ApiResponse<{ status: string; ref: string }>>(
        "/payments/confirm",
        { bookingId: ctx.bookingId },
      );
      const status = res.data.data.status;
      if (status === "CONFIRMED" && !didRedirect.current) {
        didRedirect.current = true;
        router.push(ROUTES.CONFIRMATION);
      } else if (status === "FAILED") {
        dispatch({ type: "FAILED" });
      } else {
        // Still processing
        setConfirmError("Payment not yet received. Please wait a moment and try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not check payment status. Please try again.";
      setConfirmError(msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleRetry = () => {
    // Use the stored event ID — `id` here is the booking ID (URL param)
    const eventId = ctx.eventId || id;
    router.push(ROUTES.BOOKING(eventId));
  };

  const isTerminal = phase === "timeout" || phase === "failed";

  // Format date for display — strip raw ISO if possible
  const displayDate = ctx.eventDate
    ? (() => {
        try {
          return formatDate(ctx.eventDate);
        } catch {
          return ctx.eventDate;
        }
      })()
    : "";

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
        <h1 className="font-display font-semibold text-[18px] text-text flex-1 m-0">
          Complete payment
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
        <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-4 pb-8 flex flex-col gap-4">
          {/* Compact order summary */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-bg">
              <div>
                <div className="text-sm font-semibold text-text">
                  {ctx.eventTitle || "Your booking"}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {displayDate}
                </div>
              </div>
              <div className="font-display font-bold text-[17px] shrink-0">
                ${ctx.total.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 border-t border-border/50">
              <span
                className="inline-flex items-center justify-center w-[34px] h-[34px] rounded text-[10px] font-bold shrink-0"
                style={{
                  background: ctx.method === "mtn" ? "#FFCC00" : "#FF0000",
                  color: ctx.method === "mtn" ? "#000" : "#fff",
                }}
              >
                {ctx.method === "mtn" ? "MTN" : "Airtel"}
              </span>
              <span className="text-sm font-semibold text-text flex-1">
                {provider}
              </span>
              <StatusPill status="Pending" />
            </div>
          </div>

          {/* Terminal states: timeout or failed */}
          {isTerminal ? (
            <div className="flex flex-col gap-3">
              <AlertBanner
                tone="danger"
                title={phase === "failed" ? "Payment failed" : "Payment window expired"}
                message={
                  phase === "failed"
                    ? "Your payment could not be completed. Your reserved tickets have been released."
                    : "Your reserved tickets have been released. Start a new booking to try again."
                }
              />
              <Button fullWidth size="lg" onClick={handleRetry} className="gap-2">
                <Icon name="RotateCcw" size={18} />
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Instruction */}
              <p className="text-sm font-semibold text-text">
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
                  className="w-10 h-10 rounded-sm border border-white/20 bg-white/[0.08] inline-flex items-center justify-center shrink-0 hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <Icon name={copied ? "Check" : "Copy"} size={18} />
                </button>
              </div>

              {/* Open dialer */}
              <a
                href={`tel:${ussdCode}`}
                aria-label={`Open dialer with ${ussdCode}`}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-border bg-surface text-text text-sm font-semibold hover:bg-surface-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Icon name="PhoneCall" size={18} />
                Open dialer
              </a>

              {/* Countdown bar */}
              <div>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="text-text-muted">Payment window closes in</span>
                  <span
                    className={cn(
                      "font-mono font-medium",
                      low ? "text-status-warning" : "text-text",
                    )}
                  >
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

              {/* Polling indicator */}
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <svg
                  className="animate-spin h-4 w-4 shrink-0 text-brand-orange"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Waiting for payment confirmation…
              </div>

              {/* Manual confirm — shown after dialling so user can check immediately */}
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <p className="text-xs text-text-muted text-center">
                  Already dialled and paid? Tap below to confirm now.
                </p>
                {confirmError && (
                  <AlertBanner tone="warning" message={confirmError} />
                )}
                <Button
                  fullWidth
                  variant="ghost"
                  size="lg"
                  loading={confirmLoading}
                  disabled={confirmLoading}
                  onClick={handleConfirmPayment}
                  className="gap-2"
                  aria-label="Check payment status manually"
                >
                  <Icon name="CircleCheck" size={18} />
                  {confirmLoading ? "Checking…" : "I've paid — confirm payment"}
                </Button>
              </div>

              <p className="text-xs text-text-muted text-center">
                You will also be redirected automatically once payment is received.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
