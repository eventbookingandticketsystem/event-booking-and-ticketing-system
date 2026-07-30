'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useScan } from "@/lib/api/hooks/useScan";
import type { ScanOutcome } from "@/lib/api/hooks/useScan";

type ResultKind = "admit" | "used" | "invalid" | "wrong" | "expired";
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
  admit:   { bg: "#1A7A4A", icon: "CircleCheck", verdict: "ADMIT",          showName: true  },
  used:    { bg: "#A32D2D", icon: "X",            verdict: "ALREADY USED"                    },
  invalid: { bg: "#A32D2D", icon: "X",            verdict: "INVALID TICKET"                  },
  wrong:   { bg: "#7A4A00", icon: "TriangleAlert", verdict: "WRONG EVENT"                    },
  expired: { bg: "#1a2030", icon: "Clock",         verdict: "TICKET EXPIRED"                 },
};

// ── Scanning progress overlay ──────────────────────────────────────────────

function ScanningOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-full border-4 border-brand-orange/30 border-t-brand-orange animate-spin" />
      <p className="text-white font-semibold text-[16px]">Verifying ticket…</p>
      <p className="text-white/50 text-sm">Checking against system records</p>
    </div>
  );
}

// ── Result overlay ─────────────────────────────────────────────────────────

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

// ── Main Scanner Page ──────────────────────────────────────────────────────

export default function ScannerPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const scanLoopRef  = useRef<number | null>(null);
  const lastPayload  = useRef<string>("");   // debounce: don't re-scan same code twice

  const agentId    = searchParams.get("agentId")    ?? "";
  const eventId    = searchParams.get("eventId")    ?? "";
  const gate       = searchParams.get("gate")       ?? "A";
  const eventTitle = searchParams.get("eventTitle") ?? searchParams.get("eventId") ?? "Current Event";

  const [camState,    setCamState]    = useState<CamState>("requesting");
  const [online,      setOnline]      = useState(true);
  const [admitted,    setAdmitted]    = useState(0);
  const [result,      setResult]      = useState<ScanResult | null>(null);
  const [scanning,    setScanning]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const scanMutation = useScan();

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

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real scan ─────────────────────────────────────────────────────────────
  const fireRealScan = useCallback(async (qrPayload: string) => {
    if (!agentId || !eventId) return;   // no context — do nothing (no demo mode)
    if (scanning) return;
    setScanning(true);
    try {
      const outcome = await scanMutation.mutateAsync({ qrPayload, eventId, gate, agentId });
      const r = outcomeToResult(outcome, eventTitle, gate);
      setResult(r);
      if (r.kind === "admit") setAdmitted((a) => a + 1);
    } catch {
      setResult({ kind: "invalid", sub: "Network error — could not verify", eventTitle, gate });
    } finally {
      setScanning(false);
    }
  }, [agentId, eventId, gate, eventTitle, scanning, scanMutation]);

  // ── jsQR camera loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (camState !== "active" || result || scanning) return;

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
            await fireRealScan(code.data);
            // reset debounce after 3 s so the same code can be re-scanned
            setTimeout(() => { lastPayload.current = ""; }, 3000);
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
  }, [camState, result, scanning, fireRealScan]);

  const handleReset = () => {
    setResult(null);
    lastPayload.current = "";
  };

  const cashEntryUrl = agentId
    ? `${ROUTES.AGENT_CASH}?agentId=${agentId}&eventId=${eventId}&gate=${gate}`
    : ROUTES.AGENT_CASH;

  return (
    <div className="h-full bg-brand-navy flex flex-col md:flex-row overflow-hidden relative">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/8 bg-brand-navy-2/60 p-5 gap-6">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-md bg-brand-orange inline-flex items-center justify-center shrink-0">
            <Icon name="ScanLine" size={18} className="text-white" />
          </span>
          <span className="font-display font-bold text-[16px] text-white">Tiketi Gate</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.8px] text-white/40 mb-1">Event</div>
          <div className="text-white font-semibold text-[14px] leading-snug">{eventTitle}</div>
          <div className="text-white/40 text-[12px] mt-0.5">Gate {gate}</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Admitted</span>
            <span className="font-mono font-bold text-white text-[20px]">{admitted}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Status</span>
            <span className={cn(
              "flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-pill",
              online ? "bg-status-success-bg text-status-success" : "bg-status-warning-bg text-status-warning"
            )}>
              <Icon name={online ? "Wifi" : "WifiOff"} size={11} />
              {online ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-1">
          {[
            { icon: "Wallet" as const,  label: "Cash entry",   action: () => router.push(cashEntryUrl) },
            { icon: "House"  as const,  label: "Home",         action: () => router.push(ROUTES.HOME)  },
            { icon: "LogOut" as const,  label: "Sign out",     action: () => signOut({ redirect: true, callbackUrl: "/login" }) },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden flex items-center justify-between h-10 px-4 shrink-0 border-b border-white/8 bg-brand-navy-2/60">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Icon name="Ticket" size={13} className="text-brand-orange shrink-0" />
          <span className="text-white/70 text-xs truncate">{eventTitle} · Gate {gate}</span>
        </div>
        <span className="font-mono text-white text-xs px-1 shrink-0">
          {admitted} <span className="text-white/40">in</span>
        </span>
        <button
          type="button"
          onClick={() => setOnline((o) => !o)}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-semibold shrink-0 ml-2",
            online ? "bg-status-success-bg text-status-success" : "bg-status-warning-bg text-status-warning",
          )}
        >
          <Icon name={online ? "Wifi" : "WifiOff"} size={11} />
          {online ? "Online" : "Offline"}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen((m) => !m)}
          className="w-7 h-7 ml-1 rounded-full inline-flex items-center justify-center text-white/60 hover:bg-white/10"
        >
          <Icon name="Ellipsis" size={16} />
        </button>
      </div>

      {/* ── Viewfinder area ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 relative overflow-hidden p-4 md:p-8">

        {/* Desktop stat strip */}
        <div className="hidden md:flex items-center gap-6 w-full max-w-lg mb-2">
          <div className="flex flex-col">
            <span className="text-white/40 text-[11px] uppercase tracking-wider">Admitted</span>
            <span className="font-mono text-white font-bold text-[28px]">{admitted}</span>
          </div>
          {scanning && (
            <span className="flex items-center gap-2 text-brand-orange text-sm font-semibold animate-pulse">
              <Icon name="ScanLine" size={14} />
              Verifying…
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
              camState === "active" ? "opacity-100" : "opacity-0",
            )}
          />
          {/* Hidden canvas for jsQR frame extraction */}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

          {/* Camera state overlays */}
          {camState !== "active" && (
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
          {camState === "active" && (
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
            : camState === "active"
            ? "Point camera at a ticket QR code — detection is automatic"
            : camState === "denied"
            ? "Grant camera permission and retry"
            : "Camera unavailable"}
        </p>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute top-12 right-2 z-40 w-52 bg-surface border border-border rounded-xl shadow-pop overflow-hidden md:hidden">
            {[
              { icon: "Wallet"  as const, label: "Cash entry", action: () => router.push(cashEntryUrl) },
              { icon: "House"   as const, label: "Home",        action: () => router.push(ROUTES.HOME)  },
              { icon: "LogOut"  as const, label: "Sign out",    action: () => signOut({ redirect: true, callbackUrl: "/login" }) },
            ].map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { setMenuOpen(false); item.action(); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3.5 text-left text-[15px] font-medium text-text hover:bg-surface-bg transition-colors",
                  i > 0 && "border-t border-border",
                )}
              >
                <Icon name={item.icon} size={18} className="text-text-secondary shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Scanning progress overlay ── */}
      {scanning && <ScanningOverlay />}

      {/* ── Result overlay ── */}
      {result && <ResultOverlay result={result} onReset={handleReset} />}

      <style>{`
        @keyframes scanline {
          from { top: 6px; }
          to   { top: calc(100% - 8px); }
        }
      `}</style>
    </div>
  );
}
