'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useScan } from "@/lib/api/hooks/useScan";
import { useScanLookup } from "@/lib/api/hooks/useScanLookup";
import type { ScanOutcome } from "@/lib/api/hooks/useScan";
import type { LookupOutcome } from "@/lib/api/hooks/useScanLookup";

type ResultKind = "admit" | "used" | "invalid" | "wrong" | "expired" | "too_early" | "event_ended";
type CamState   = "requesting" | "active" | "denied" | "unavailable";

interface ScanResult {
  kind:       ResultKind;
  name?:      string;
  tier?:      string;
  sub?:       string;
  eventTitle?: string;
  gate?:       string;
  scannedAt?:  string;
}

function outcomeToResult(o: ScanOutcome, eventTitle: string, gate: string): ScanResult {
  const scannedAt = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  switch (o.result) {
    case "ADMIT":
      return { kind: "admit", name: o.attendee, tier: o.tier, eventTitle, gate, scannedAt };
    case "ALREADY_USED": {
      let sub = "Ticket has already been scanned";
      if (o.usedAt) {
        const d = new Date(o.usedAt);
        if (!isNaN(d.getTime()))
          sub = `First scanned at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      }
      return { kind: "used", sub, eventTitle, gate, scannedAt };
    }
    case "EXPIRED":
      return { kind: "expired", sub: o.message, eventTitle, gate, scannedAt };
    case "WRONG_EVENT":
      return { kind: "wrong", sub: o.message, eventTitle, gate, scannedAt };
    case "TOO_EARLY": {
      const d = new Date(o.opensAt);
      const sub = !isNaN(d.getTime())
        ? `Gate opens at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        : o.message;
      return { kind: "too_early", sub, eventTitle, gate, scannedAt };
    }
    case "EVENT_ENDED":
      return { kind: "event_ended", sub: o.message, eventTitle, gate, scannedAt };
    case "INVALID":
    default:
      return { kind: "invalid", sub: o.message ?? "This ticket could not be verified", eventTitle, gate, scannedAt };
  }
}

const RESULT_CONFIG: Record<ResultKind, {
  bg: string;
  icon: "CircleCheck" | "X" | "TriangleAlert" | "Clock";
  verdict: string;
  showName?: boolean;
}> = {
  admit:       { bg: "#1A7A4A", icon: "CircleCheck", verdict: "ADMIT",          showName: true  },
  used:        { bg: "#A32D2D", icon: "X",            verdict: "ALREADY USED"                    },
  invalid:     { bg: "#A32D2D", icon: "X",            verdict: "INVALID TICKET"                  },
  wrong:       { bg: "#7A4A00", icon: "TriangleAlert", verdict: "WRONG EVENT"                    },
  expired:     { bg: "#1a2030", icon: "Clock",         verdict: "TICKET EXPIRED"                 },
  too_early:   { bg: "#7A4A00", icon: "Clock",         verdict: "TOO EARLY"                      },
  event_ended: { bg: "#1a2030", icon: "Clock",         verdict: "EVENT ENDED"                    },
};

// ── Start-scanning confirmation modal ───────────────────────────────────────

function StartScanModal({
  eventTitle,
  gate,
  onConfirm,
  onCancel,
}: {
  eventTitle: string;
  gate: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-scan-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-brand-navy-2 border border-white/10 p-6 flex flex-col items-center gap-4 text-center shadow-2xl">
        <span className="w-14 h-14 rounded-full bg-brand-orange/15 border border-brand-orange/30 inline-flex items-center justify-center">
          <Icon name="ScanLine" size={26} className="text-brand-orange" />
        </span>
        <div>
          <h2 id="start-scan-title" className="font-display font-bold text-white text-[19px]">
            Ready to scan?
          </h2>
          <p className="text-white/50 text-sm mt-1.5 leading-snug">
            You&apos;re about to start scanning tickets for{" "}
            <span className="text-white/80 font-semibold">{eventTitle}</span> at Gate {gate}.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-white/60 border border-white/10 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-11 rounded-xl text-[14px] font-bold text-white bg-brand-orange hover:bg-brand-orange-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange flex items-center justify-center gap-2"
          >
            <Icon name="ScanLine" size={16} />
            Start scanning
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Scanning progress overlay ──────────────────────────────────────────────

function ScanningOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-full border-4 border-brand-orange/30 border-t-brand-orange animate-spin" />
      <p className="text-white font-semibold text-[16px]">{label}</p>
      <p className="text-white/50 text-sm">Checking against system records</p>
    </div>
  );
}

// ── Result overlay (after an actual admit / a rejected lookup) ─────────────

function ResultOverlay({ result, onReset }: { result: ScanResult; onReset: () => void }) {
  const cfg = RESULT_CONFIG[result.kind];
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    if (countdown <= 0) { onReset(); return; }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onReset]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: cfg.bg }}
      role="alert"
      aria-live="assertive"
      onClick={onReset}
    >
      {/* Main verdict — centred, takes most of the space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <Icon name={cfg.icon} size={72} strokeWidth={2} className="text-white" />

        <h1 className={cn(
          "font-display font-bold text-white text-center leading-none",
          result.kind === "admit" ? "text-[80px]" : "text-[60px]",
        )}>
          {cfg.verdict}
        </h1>

        {cfg.showName && result.name && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-white/90 text-[24px] font-semibold text-center">{result.name}</p>
            {result.tier && (
              <span className="px-5 py-1.5 rounded-full border-2 border-white/40 text-white text-[15px] font-semibold">
                {result.tier}
              </span>
            )}
          </div>
        )}

        {!cfg.showName && result.sub && (
          <p className="text-white/70 text-[18px] text-center max-w-xs leading-snug">{result.sub}</p>
        )}
      </div>

      {/* Event details panel at bottom */}
      <div
        className="shrink-0 px-6 py-5 mx-4 mb-6 rounded-2xl flex flex-col gap-2"
        style={{ background: "rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {result.eventTitle && (
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Icon name="Ticket" size={14} className="shrink-0 text-white/50" />
            <span className="font-semibold truncate">{result.eventTitle}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-white/50 text-[12px]">
          {result.gate && (
            <span className="flex items-center gap-1">
              <Icon name="DoorOpen" size={12} />
              Gate {result.gate}
            </span>
          )}
          {result.scannedAt && (
            <span className="flex items-center gap-1">
              <Icon name="Clock" size={12} />
              {result.scannedAt}
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 w-full flex items-center justify-center gap-2 text-white/40 text-sm">
        <Icon name="RotateCcw" size={13} />
        Tap to reset · auto in {countdown}s
      </div>
    </div>
  );
}

// ── Review sidebar — shown after a successful (non-mutating) lookup ───────

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function ReviewSidebar({
  lookup,
  gate,
  admitting,
  onAdmit,
  onCancel,
  onScanAnother,
}: {
  lookup: LookupOutcome;
  gate: string;
  admitting: boolean;
  onAdmit: () => void;
  onCancel: () => void;
  onScanAnother: () => void;
}) {
  const isValid  = lookup.valid;
  const isTiming = !lookup.valid && (lookup.result === "TOO_EARLY" || lookup.result === "EVENT_ENDED");
  const headerColor = isValid ? "#1A7A4A" : isTiming ? "#B8720A" : "#A32D2D";

  return (
    <>
      {/* Backdrop on mobile so the sidebar reads as a sheet */}
      <div
        className="fixed inset-0 z-30 bg-black/50 md:hidden"
        onClick={onCancel}
        aria-hidden="true"
      />
      <aside
        className="fixed md:static inset-y-0 right-0 z-40 w-full max-w-sm md:max-w-none md:w-96 shrink-0 bg-brand-navy-2 border-l border-white/10 flex flex-col overflow-hidden"
        role="region"
        aria-label="Scanned ticket details"
      >
        {/* Header */}
        <div
          className="shrink-0 px-5 py-4 border-b border-white/8 flex items-center gap-3"
          style={{ background: `${headerColor}26` }}
        >
          <span
            className="w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0"
            style={{ background: headerColor }}
          >
            <Icon name={isValid ? "CircleCheck" : isTiming ? "Clock" : "TriangleAlert"} size={18} className="text-white" />
          </span>
          <div className="min-w-0">
            <div className="text-white font-display font-bold text-[15px]">
              {isValid ? "Valid ticket" : isTiming ? "Not yet admissible" : "Cannot admit"}
            </div>
            <div className="text-white/50 text-[12px] truncate">
              {isValid ? lookup.ticket.ticketRef : lookup.message}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {isValid ? (
            <>
              {/* Attendee */}
              <section className="flex flex-col gap-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">Customer</h3>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-brand-orange/20 text-brand-orange inline-flex items-center justify-center font-bold text-[14px] shrink-0">
                    {(lookup.attendee.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-[15px] truncate">
                      {lookup.attendee.name ?? "Guest"}
                    </div>
                    {lookup.attendee.phone && (
                      <div className="text-white/50 text-[12px] flex items-center gap-1 truncate">
                        <Icon name="Phone" size={11} className="shrink-0" />
                        {lookup.attendee.phone}
                      </div>
                    )}
                  </div>
                </div>
                {lookup.attendee.email && (
                  <div className="text-white/50 text-[12px] flex items-center gap-1.5 truncate">
                    <Icon name="Mail" size={11} className="shrink-0" />
                    {lookup.attendee.email}
                  </div>
                )}
              </section>

              {/* Ticket */}
              <section className="flex flex-col gap-2.5 pt-4 border-t border-white/8">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">Ticket</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Tier</span>
                  <span className="px-3 py-1 rounded-full border border-white/20 text-white text-[12px] font-semibold">
                    {lookup.ticket.tier}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Reference</span>
                  <span className="font-mono text-white text-[13px]">{lookup.ticket.ticketRef}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Booking</span>
                  <span className="font-mono text-white text-[13px]">{lookup.booking.ref}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Paid via</span>
                  <span className="text-white text-[13px]">{lookup.booking.method}</span>
                </div>
              </section>

              {/* Event */}
              <section className="flex flex-col gap-2.5 pt-4 border-t border-white/8">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">Event</h3>
                <div className="flex items-start gap-2 text-sm">
                  <Icon name="Ticket" size={14} className="text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white font-semibold">{lookup.event.title}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Icon name="MapPin" size={14} className="text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white/70">{lookup.event.venue}, {lookup.event.city}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Icon name="Calendar" size={14} className="text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white/70">{fmtDateTime(lookup.event.date)}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Icon name="DoorOpen" size={14} className="text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white/70">Gate {gate}</span>
                </div>
              </section>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <Icon
                  name={
                    lookup.result === "TOO_EARLY" || lookup.result === "EVENT_ENDED"
                      ? "Clock"
                      : "Ban"
                  }
                  size={36}
                  className="text-white/25"
                />
                <p className="text-white/60 text-sm max-w-55">{lookup.message}</p>
                {lookup.result === "ALREADY_USED" && lookup.usedAt && (
                  <p className="text-white/35 text-xs">
                    First scanned {fmtDateTime(lookup.usedAt)}
                  </p>
                )}
                {lookup.result === "TOO_EARLY" && lookup.opensAt && (
                  <p className="text-white/35 text-xs">
                    Gate opens {fmtDateTime(lookup.opensAt)}
                  </p>
                )}
                {lookup.result === "EVENT_ENDED" && lookup.closedAt && (
                  <p className="text-white/35 text-xs">
                    Admission closed {fmtDateTime(lookup.closedAt)}
                  </p>
                )}
              </div>

              {/* Event details — shown so the agent can confirm this is the
                  right event/time even when the ticket itself is rejected. */}
              {lookup.event && (
                <section className="flex flex-col gap-2.5 pt-4 border-t border-white/8">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">Event</h3>
                  <div className="flex items-start gap-2 text-sm">
                    <Icon name="Ticket" size={14} className="text-white/40 shrink-0 mt-0.5" />
                    <span className="text-white font-semibold">{lookup.event.title}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Icon name="MapPin" size={14} className="text-white/40 shrink-0 mt-0.5" />
                    <span className="text-white/70">{lookup.event.venue}, {lookup.event.city}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Icon name="Calendar" size={14} className="text-white/40 shrink-0 mt-0.5" />
                    <span className="text-white/70">{fmtDateTime(lookup.event.date)}</span>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 px-5 py-4 border-t border-white/8 flex flex-col gap-2.5">
          {isValid && (
            <button
              type="button"
              onClick={onAdmit}
              disabled={admitting}
              className="h-12 rounded-xl bg-status-success text-white font-display font-bold text-[15px] flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {admitting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <Icon name="CircleCheck" size={18} />
              )}
              {admitting ? "Admitting…" : "Admit"}
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={admitting}
              className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white/60 border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onScanAnother}
              disabled={admitting}
              className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white border border-white/15 hover:bg-white/8 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange flex items-center justify-center gap-1.5"
            >
              <Icon name="ScanLine" size={14} />
              Scan another
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Main Scanner Page ──────────────────────────────────────────────────────

export default function ScannerPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const scanLoopRef  = useRef<number | null>(null);
  const lastPayload  = useRef<string>("");   // debounce: don't re-look-up same code twice

  const agentId    = searchParams.get("agentId")    ?? "";
  const eventId    = searchParams.get("eventId")    ?? "";
  const gate       = searchParams.get("gate")       ?? "A";
  const eventTitle = searchParams.get("eventTitle") ?? searchParams.get("eventId") ?? "Current Event";

  const [armed,       setArmed]       = useState(false);   // confirmed + camera allowed to run
  const [camState,    setCamState]    = useState<CamState>("requesting");
  const [online,      setOnline]      = useState(true);
  const [admitted,    setAdmitted]    = useState(0);
  const [lookingUp,   setLookingUp]   = useState(false);
  const [lookup,      setLookup]      = useState<LookupOutcome | null>(null);
  const [result,      setResult]      = useState<ScanResult | null>(null);
  const [admitting,   setAdmitting]   = useState(false);

  const scanMutation   = useScan();
  const lookupMutation = useScanLookup();

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamState("requesting");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCamState("unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState("active");
    } catch (err) {
      const name = (err as Error).name;
      setCamState(name === "NotAllowedError" || name === "PermissionDeniedError" ? "denied" : "unavailable");
    }
  }, []);

  // Camera only activates once the agent confirms the start-scanning modal.
  useEffect(() => {
    if (!armed) return;
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed]);

  // ── Read-only lookup (no mutation, no ScanRecord) ──────────────────────────
  const fireLookup = useCallback(async (qrPayload: string) => {
    if (!eventId) return;   // no context — do nothing (no demo mode)
    if (lookingUp) return;
    setLookingUp(true);
    try {
      const outcome = await lookupMutation.mutateAsync({ qrPayload, eventId });
      setLookup(outcome);
    } catch {
      setLookup({ valid: false, result: "INVALID", message: "Network error — could not verify" });
    } finally {
      setLookingUp(false);
    }
  }, [eventId, lookingUp, lookupMutation]);

  // ── jsQR camera loop — runs while armed, no active lookup/result open ─────
  useEffect(() => {
    if (!armed || camState !== "active" || lookup || result || lookingUp) return;

    let active = true;

    const tick = async () => {
      if (!active) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (
        video && canvas &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        video.videoWidth > 0
      ) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // Dynamically import jsqr to avoid SSR issues
          const jsQR = (await import("jsqr")).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data && code.data !== lastPayload.current) {
            lastPayload.current = code.data;
            await fireLookup(code.data);
            return;
          }
        }
      }
      scanLoopRef.current = requestAnimationFrame(tick);
    };

    scanLoopRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  }, [armed, camState, lookup, result, lookingUp, fireLookup]);

  // ── Sidebar actions ─────────────────────────────────────────────────────────
  const handleAdmit = async () => {
    // Reuse the exact raw QR string captured at scan time — the real /api/scan
    // route matches on the full { ticketRef, qrPayload } pair, so a reconstructed
    // payload (without the embedded userId) would never match.
    const rawPayload = lastPayload.current;
    if (!lookup?.valid || !agentId || !rawPayload) return;
    setAdmitting(true);
    try {
      const outcome = await scanMutation.mutateAsync({
        qrPayload: rawPayload,
        eventId,
        gate,
        agentId,
      });
      const r = outcomeToResult(outcome, eventTitle, gate);
      setLookup(null);
      setResult(r);
      if (r.kind === "admit") setAdmitted((a) => a + 1);
    } catch {
      setLookup(null);
      setResult({ kind: "invalid", sub: "Network error — could not admit", eventTitle, gate });
    } finally {
      setAdmitting(false);
    }
  };

  const handleCancel = () => {
    setLookup(null);
    lastPayload.current = "";
  };

  const handleScanAnother = () => {
    setLookup(null);
    lastPayload.current = "";
    // Debounce window so the same physical ticket isn't instantly re-picked-up
    // if it's still in frame.
    setTimeout(() => { lastPayload.current = ""; }, 300);
  };

  const handleResultReset = () => {
    setResult(null);
    lastPayload.current = "";
  };

  const cashEntryUrl = agentId
    ? `${ROUTES.AGENT_CASH}?agentId=${agentId}&eventId=${eventId}&gate=${gate}`
    : ROUTES.AGENT_CASH;

  return (
    <div className="h-full bg-brand-navy flex flex-col md:flex-row overflow-hidden relative">

      {/* ── Viewfinder area ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 relative overflow-hidden p-4 md:p-8">

        {/* Stat strip — event context, admitted count, online toggle, cash-entry shortcut */}
        <div className="flex items-center gap-3 w-full max-w-lg mb-1 md:mb-2 flex-wrap">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white/70 text-[13px] md:text-[11px] md:uppercase md:tracking-wider font-semibold md:font-normal truncate">
              {eventTitle} <span className="text-white/40 font-normal">· Gate {gate}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-white/50 text-[12px]">
              Admitted <span className="font-mono font-bold text-white text-[16px] md:text-[20px]">{admitted}</span>
            </span>
            <button
              type="button"
              onClick={() => setOnline((o) => !o)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-semibold shrink-0",
                online ? "bg-status-success-bg text-status-success" : "bg-status-warning-bg text-status-warning",
              )}
            >
              <Icon name={online ? "Wifi" : "WifiOff"} size={11} />
              {online ? "Online" : "Offline"}
            </button>
            <button
              type="button"
              onClick={() => router.push(cashEntryUrl)}
              aria-label="Cash entry"
              className="w-7 h-7 rounded-full inline-flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            >
              <Icon name="Wallet" size={15} />
            </button>
          </div>
          {lookingUp && (
            <span className="flex items-center gap-2 text-brand-orange text-sm font-semibold animate-pulse w-full">
              <Icon name="ScanLine" size={14} />
              Looking up…
            </span>
          )}
        </div>

        {/* Camera box */}
        <div className="relative w-full max-w-lg aspect-square md:aspect-video rounded-2xl overflow-hidden bg-[#040d14] shadow-2xl">

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 32px),repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 32px)" }}
            aria-hidden="true"
          />

          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              armed && camState === "active" ? "opacity-100" : "opacity-0",
            )}
          />
          {/* Hidden canvas for jsQR frame extraction */}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

          {/* Not-yet-armed state — waiting on the confirmation modal */}
          {!armed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 z-10">
              <Icon name="ScanLine" size={32} className="text-white/20" />
              <p className="text-white/40 text-sm text-center">Confirm to activate the camera</p>
            </div>
          )}

          {/* Camera state overlays */}
          {armed && camState !== "active" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 z-10">
              {camState === "requesting" && (
                <>
                  <svg className="animate-spin h-8 w-8 text-brand-orange/60" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-white/50 text-sm text-center">Requesting camera access…</p>
                </>
              )}
              {camState === "denied" && (
                <>
                  <Icon name="CameraOff" size={32} className="text-white/30" />
                  <p className="text-white/60 text-sm text-center leading-snug">
                    Camera blocked.<br />
                    <span className="text-white/35 text-xs">Allow access in browser settings, then retry.</span>
                  </p>
                  <button type="button" onClick={startCamera} className="px-4 py-2 rounded-lg bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-sm font-semibold hover:bg-brand-orange/30 transition-colors">
                    Retry
                  </button>
                </>
              )}
              {camState === "unavailable" && (
                <>
                  <Icon name="CameraOff" size={32} className="text-white/30" />
                  <p className="text-white/60 text-sm text-center">No camera available on this device.</p>
                </>
              )}
            </div>
          )}

          {/* Animated scan line */}
          {armed && camState === "active" && !lookup && !lookingUp && (
            <div
              className="absolute left-4 right-4 h-0.5 rounded-full z-20 pointer-events-none"
              style={{
                background: "linear-gradient(90deg,transparent,#FF5A00,transparent)",
                boxShadow: "0 0 8px 2px rgba(255,90,0,0.5)",
                animation: "scanline 1.8s ease-in-out infinite alternate",
              }}
              aria-hidden="true"
            />
          )}

          {/* Corner brackets */}
          {["tl","tr","bl","br"].map((pos) => (
            <span
              key={pos}
              className="absolute w-8 h-8 z-20"
              style={{
                top:               pos.startsWith("t") ? -1 : undefined,
                bottom:            pos.startsWith("b") ? -1 : undefined,
                left:              pos.endsWith("l")   ? -1 : undefined,
                right:             pos.endsWith("r")   ? -1 : undefined,
                borderTopWidth:    pos.startsWith("t") ? 3 : 0,
                borderBottomWidth: pos.startsWith("b") ? 3 : 0,
                borderLeftWidth:   pos.endsWith("l")   ? 3 : 0,
                borderRightWidth:  pos.endsWith("r")   ? 3 : 0,
                borderColor: "#FF5A00",
                borderStyle: "solid",
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <p className="text-white/40 text-sm text-center">
          {!agentId
            ? "No event context — go back and select an event"
            : !armed
            ? "Confirm the prompt to start scanning"
            : camState === "active"
            ? "Point camera at a ticket QR code — detection is automatic"
            : camState === "denied"
            ? "Grant camera permission and retry"
            : "Camera unavailable"}
        </p>
      </div>

      {/* ── Review sidebar (right) — shown after a lookup resolves ── */}
      {lookup && (
        <ReviewSidebar
          lookup={lookup}
          gate={gate}
          admitting={admitting}
          onAdmit={handleAdmit}
          onCancel={handleCancel}
          onScanAnother={handleScanAnother}
        />
      )}

      {/* ── Start-scanning confirmation modal ── */}
      {!armed && agentId && (
        <StartScanModal
          eventTitle={eventTitle}
          gate={gate}
          onConfirm={() => setArmed(true)}
          onCancel={() => router.push(ROUTES.AGENT)}
        />
      )}

      {/* ── Looking-up overlay ── */}
      {lookingUp && <ScanningOverlay label="Looking up ticket…" />}

      {/* ── Post-admit result overlay ── */}
      {result && <ResultOverlay result={result} onReset={handleResultReset} />}

      <style>{`
        @keyframes scanline {
          from { top: 6px; }
          to   { top: calc(100% - 8px); }
        }
      `}</style>
    </div>
  );
}
