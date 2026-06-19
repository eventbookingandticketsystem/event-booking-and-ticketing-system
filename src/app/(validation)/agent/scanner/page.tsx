'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ATTENDEE_NAMES } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { useScan } from "@/lib/api/hooks/useScan";
import type { ScanOutcome } from "@/lib/api/hooks/useScan";

// ── Types ──────────────────────────────────────────────────────────────────

type ResultKind = "admit" | "used" | "invalid" | "wrong" | "expired";
type CamState   = "requesting" | "active" | "denied" | "unavailable";

interface ScanResult {
  kind: ResultKind;
  name?: string;
  tier?: string;
  /** Dynamic sub-text from API (overrides static config sub) */
  sub?:  string;
}

// Map API outcome discriminant → local UI ResultKind + populate dynamic fields
function outcomeToResult(o: ScanOutcome): ScanResult {
  switch (o.result) {
    case "ADMIT":
      return { kind: "admit", name: o.attendee, tier: o.tier };
    case "ALREADY_USED":
      return {
        kind: "used",
        sub: o.usedAt
          ? `First scanned at ${new Date(o.usedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
          : "Ticket has already been scanned",
      };
    case "EXPIRED":
      return { kind: "expired", sub: o.message };
    case "WRONG_EVENT":
      return { kind: "wrong", sub: o.message };
    case "INVALID":
    default:
      return { kind: "invalid", sub: o.message };
  }
}

const RESULT_CONFIG: Record<ResultKind, {
  bg: string;
  icon: "CircleCheck" | "X" | "TriangleAlert" | "Clock";
  verdict: string;
  sub?: string;         // fallback sub-text for demo mode
  showName?: boolean;
}> = {
  admit: {
    bg: "#1A7A4A",
    icon: "CircleCheck",
    verdict: "ADMIT",
    showName: true,
  },
  used: {
    bg: "#A32D2D",
    icon: "X",
    verdict: "ALREADY USED",
    sub: "First scanned at 2:34 PM at Gate A",
  },
  invalid: {
    bg: "#A32D2D",
    icon: "X",
    verdict: "INVALID TICKET",
    sub: "This ticket could not be verified",
  },
  wrong: {
    bg: "#7A4A00",
    icon: "TriangleAlert",
    verdict: "WRONG EVENT",
    sub: "This ticket is for a different event",
  },
  expired: {
    bg: "#1a2030",
    icon: "Clock",
    verdict: "TICKET EXPIRED",
    sub: "This ticket is no longer valid",
  },
};

const DEMO_CYCLE: ResultKind[] = ["admit", "used", "invalid", "wrong", "expired"];

// ── Result Overlay ─────────────────────────────────────────────────────────

function ResultOverlay({
  result,
  onReset,
}: {
  result: ScanResult;
  onReset: () => void;
}) {
  const cfg = RESULT_CONFIG[result.kind];
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (countdown <= 0) { onReset(); return; }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onReset]);

  // Use API-supplied sub-text if available, fall back to static config
  const subText = result.sub ?? cfg.sub;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 cursor-pointer select-none"
      style={{ background: cfg.bg }}
      role="alert"
      aria-live="assertive"
      onClick={onReset}
    >
      <Icon name={cfg.icon} size={64} strokeWidth={2.5} className="text-white" />

      <h1
        className={cn(
          "font-display font-bold text-white text-center leading-none",
          result.kind === "admit" ? "text-[72px]" : "text-[56px]",
        )}
      >
        {cfg.verdict}
      </h1>

      {cfg.showName && result.name && (
        <div className="flex flex-col items-center gap-2 mt-1">
          <p className="text-white/90 text-[22px] font-semibold text-center">{result.name}</p>
          {result.tier && (
            <span className="px-4 py-1.5 rounded-pill border-2 border-white/50 text-white text-[15px] font-semibold">
              {result.tier}
            </span>
          )}
        </div>
      )}

      {!cfg.showName && subText && (
        <p className="text-white/70 text-[18px] text-center max-w-70 leading-snug">
          {subText}
        </p>
      )}

      <div className="absolute bottom-8 flex items-center gap-2 text-white/60 text-sm">
        <Icon name="RotateCcw" size={14} />
        Auto-reset in {countdown}s
      </div>
    </div>
  );
}

// ── Offline Sync Sheet ─────────────────────────────────────────────────────

function OfflineSyncSheet({
  online,
  onRestore,
  onClose,
}: {
  online: boolean;
  onRestore: () => void;
  onClose: () => void;
}) {
  const [syncPhase, setSyncPhase] = useState<"idle" | "syncing" | "done">("idle");
  const [syncPct,   setSyncPct]   = useState(0);

  useEffect(() => {
    if (syncPhase !== "syncing") return;
    if (syncPct >= 100) { setSyncPhase("done"); return; }
    const t = setTimeout(() => setSyncPct((p) => Math.min(100, p + 9)), 90);
    return () => clearTimeout(t);
  }, [syncPhase, syncPct]);

  const handleSync = () => { setSyncPct(0); setSyncPhase("syncing"); };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div
          className="w-full max-w-97.5 rounded-t-2xl p-5"
          style={{ background: "#0e1c29" }}
          role="dialog"
          aria-label="Offline sync"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1.5 rounded-pill bg-white/20 mx-auto mb-5" aria-hidden="true" />

          <h2 className="font-display font-bold text-[18px] text-white mb-1">Offline mode</h2>
          <p className="text-white/60 text-sm mb-4">
            Scans are saved on this device and uploaded when you reconnect.
          </p>

          {[
            { label: "Scans recorded locally", value: "38" },
            { label: "Pending sync",            value: syncPhase === "done" ? "0" : "38", highlight: syncPhase === "done" ? "#8fe0ad" : "#f0c878" },
            { label: "Last sync",               value: "Today, 6:12 PM" },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/8 last:border-b-0">
              <span className="text-sm text-white/70">{label}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: highlight ?? "rgba(255,255,255,0.9)" }}>
                {value}
              </span>
            </div>
          ))}

          {syncPhase === "syncing" && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[13px] text-white">
                <span className="text-white/70">Uploading scans…</span>
                <span className="font-mono">{syncPct}%</span>
              </div>
              <div className="h-2 rounded-pill bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-pill bg-brand-orange transition-[width] duration-100"
                  style={{ width: `${syncPct}%` }}
                  role="progressbar"
                  aria-valuenow={syncPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {syncPhase === "done" && (
            <div className="flex items-center gap-3 mt-4 px-4 py-3 rounded-lg bg-[#1A4A2A] text-sm font-semibold text-white">
              <Icon name="CircleCheck" size={18} className="text-[#8fe0ad] shrink-0" />
              All scans uploaded
            </div>
          )}

          <div className="flex flex-col gap-3 mt-5">
            <button
              type="button"
              disabled={!online || syncPhase === "syncing"}
              onClick={handleSync}
              aria-label="Sync now"
              className={cn(
                "flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                online && syncPhase !== "syncing"
                  ? "bg-brand-orange text-white hover:bg-brand-orange-hover"
                  : "bg-white/10 text-white/30 cursor-not-allowed",
              )}
            >
              {syncPhase === "syncing" ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Syncing…
                </>
              ) : syncPhase === "done" ? "Synced" : online ? "Sync now" : "Sync now (offline)"}
            </button>

            <button
              type="button"
              onClick={onRestore}
              className="flex items-center justify-center w-full h-12 rounded-xl border border-white/30 text-white text-[14px] font-semibold hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {online ? "Connection restored" : "Simulate connection restored"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Scanner Page ──────────────────────────────────────────────────────

export default function ScannerPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  // Real IDs passed by G1 via query string; empty strings when accessed directly
  const agentId    = searchParams.get("agentId") ?? "";
  const eventId    = searchParams.get("eventId") ?? "";
  const gate       = searchParams.get("gate")    ?? "A";
  const eventTitle = searchParams.get("eventTitle") ?? searchParams.get("eventId") ?? "Current event";

  const [camState,  setCamState]  = useState<CamState>("requesting");
  const [online,    setOnline]    = useState(true);
  const [admitted,  setAdmitted]  = useState(0);
  const [result,    setResult]    = useState<ScanResult | null>(null);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const cycleRef = useRef(0);

  // ── Scan mutation ──────────────────────────────────────────────────────
  const scanMutation = useScan();

  // ── Camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamState("requesting");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
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
        try { await videoRef.current.play(); } catch { /* already playing */ }
      }
      setCamState("active");
    } catch (err) {
      const errName = (err as Error).name;
      setCamState(
        errName === "NotAllowedError" || errName === "PermissionDeniedError"
          ? "denied"
          : "unavailable",
      );
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [startCamera]);

  // ── Demo fire (quick-fire buttons + cycle) ────────────────────────────
  const randName = () => ATTENDEE_NAMES[Math.floor(Math.random() * ATTENDEE_NAMES.length)];

  const fireDemoResult = useCallback((kind: ResultKind) => {
    const r: ScanResult =
      kind === "admit" ? { kind, name: randName(), tier: "General Admission" } : { kind };
    setResult(r);
    if (kind === "admit") setAdmitted((a) => a + 1);
  // randName is stable (no deps) — suppress exhaustive-deps warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real scan ─────────────────────────────────────────────────────────
  // Called when a QR payload is decoded from the camera (or from the
  // "Real scan" test button).  Falls back to demo cycle when agentId/
  // eventId are not available (e.g. navigated to /agent/scanner directly).
  const fireRealScan = useCallback(async (qrPayload: string) => {
    if (!agentId || !eventId) {
      // No context — treat as demo
      const kind = DEMO_CYCLE[cycleRef.current % DEMO_CYCLE.length];
      cycleRef.current++;
      fireDemoResult(kind);
      return;
    }
    try {
      const outcome = await scanMutation.mutateAsync({ qrPayload, eventId, gate, agentId });
      const r = outcomeToResult(outcome);
      setResult(r);
      if (r.kind === "admit") setAdmitted((a) => a + 1);
    } catch {
      setResult({ kind: "invalid", sub: "Network error — scan recorded offline" });
    }
  }, [agentId, eventId, gate, scanMutation, fireDemoResult]);

  // ── Main "Scan QR" button ─────────────────────────────────────────────
  // Cycles through demo outcomes (same as before). In a production build
  // this button would be replaced by automatic decoding from the camera
  // feed — the real API path is exposed via fireRealScan / the test button.
  const handleScanButton = () => {
    const kind = DEMO_CYCLE[cycleRef.current % DEMO_CYCLE.length];
    cycleRef.current++;
    fireDemoResult(kind);
  };

  const handleReset      = () => setResult(null);
  const handlePillClick  = () => { if (online) setOnline(false); else setSheetOpen(true); };

  const cashEntryUrl = agentId
    ? `${ROUTES.AGENT_CASH}?agentId=${agentId}&eventId=${eventId}&gate=${gate}`
    : ROUTES.AGENT_CASH;

  return (
    <div className="h-full bg-brand-navy flex flex-col overflow-hidden relative">

      {/* ── Info bar ── */}
      <div className="h-10 flex items-center gap-2 px-4 shrink-0 border-b border-white/8 bg-brand-navy-2/60">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Icon name="Ticket" size={14} className="text-brand-orange shrink-0" />
          <span className="text-white/70 text-xs truncate">{eventTitle}</span>
        </div>

        <span className="font-mono text-white text-xs shrink-0 px-1">
          {admitted.toLocaleString()} <span className="text-white/40">in</span>
        </span>

        <button
          type="button"
          onClick={handlePillClick}
          aria-label={online ? "Online — tap for sync" : "Offline — tap for sync"}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-pill text-[11px] font-semibold shrink-0 transition-colors",
            online
              ? "bg-status-success-bg text-status-success"
              : "bg-status-warning-bg text-status-warning",
          )}
        >
          <Icon name={online ? "Wifi" : "WifiOff"} size={11} />
          {online ? "Online" : "Offline"}
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((m) => !m)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="w-7 h-7 rounded-full inline-flex items-center justify-center text-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <Icon name="Ellipsis" size={16} />
        </button>
      </div>

      {/* ── Offline banner ── */}
      {!online && (
        <div className="flex items-center justify-center gap-2 py-2 bg-status-warning-bg text-status-warning text-[13px] font-semibold shrink-0 z-20">
          <Icon name="WifiOff" size={14} />
          Offline mode — scans saved locally
        </div>
      )}

      {/* ── Viewfinder area ── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 relative overflow-hidden">

        <div className="relative w-70 h-70 md:w-85 md:h-85">

          {/* Dark bg fallback */}
          <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#040d14]">
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 32px)" }}
              aria-hidden="true"
            />
          </div>

          {/* Camera video */}
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label="Camera viewfinder"
            className={cn(
              "absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-300",
              camState === "active" ? "opacity-100" : "opacity-0",
            )}
          />

          {/* Camera state overlay */}
          {camState !== "active" && (
            <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3 px-5 z-10">
              {camState === "requesting" && (
                <>
                  <svg className="animate-spin h-7 w-7 text-brand-orange/60" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <p className="text-white/50 text-[13px] text-center">Requesting camera access…</p>
                </>
              )}
              {camState === "denied" && (
                <>
                  <Icon name="CameraOff" size={28} className="text-white/30" />
                  <p className="text-white/55 text-[13px] text-center leading-snug">
                    Camera blocked.<br />
                    <span className="text-white/35 text-[11px]">Allow access in browser settings, then retry.</span>
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    aria-label="Retry camera access"
                    className="px-4 py-1.5 rounded-lg bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-[12px] font-semibold hover:bg-brand-orange/30 transition-colors"
                  >
                    Retry
                  </button>
                </>
              )}
              {camState === "unavailable" && (
                <>
                  <Icon name="CameraOff" size={28} className="text-white/30" />
                  <p className="text-white/55 text-[13px] text-center leading-snug">
                    No camera available.<br />
                    <span className="text-white/35 text-[11px]">Use the demo buttons below to simulate scans.</span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Animated scan line */}
          <div
            className="absolute left-3 right-3 h-0.5 rounded-full z-20 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, #FF5A00, transparent)",
              boxShadow: "0 0 8px 2px rgba(255,90,0,0.5)",
              animation: "scanline 1.8s ease-in-out infinite alternate",
            }}
            aria-hidden="true"
          />

          {/* Corner brackets */}
          {[
            { top: -1,    left: -1,  borderTop: true,    borderLeft: true    },
            { top: -1,    right: -1, borderTop: true,    borderRight: true   },
            { bottom: -1, left: -1,  borderBottom: true, borderLeft: true    },
            { bottom: -1, right: -1, borderBottom: true, borderRight: true   },
          ].map((pos, i) => (
            <span
              key={i}
              className="absolute w-7 h-7 z-20"
              style={{
                top:               pos.top    !== undefined ? pos.top    : undefined,
                bottom:            pos.bottom !== undefined ? pos.bottom : undefined,
                left:              pos.left   !== undefined ? pos.left   : undefined,
                right:             pos.right  !== undefined ? pos.right  : undefined,
                borderTopWidth:    pos.borderTop    ? 3 : 0,
                borderBottomWidth: pos.borderBottom ? 3 : 0,
                borderLeftWidth:   pos.borderLeft   ? 3 : 0,
                borderRightWidth:  pos.borderRight  ? 3 : 0,
                borderColor: "#FF5A00",
                borderStyle: "solid",
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Hint text */}
        <p className="text-white/50 text-sm text-center">
          {camState === "active"
            ? "Point camera at a ticket QR code"
            : camState === "denied"
            ? "Grant camera permission, then retry"
            : camState === "requesting"
            ? "Waiting for camera permission…"
            : "Use demo buttons to simulate a scan"}
        </p>

        {/* Main scan button — cycles demo outcomes */}
        <button
          type="button"
          onClick={handleScanButton}
          disabled={scanMutation.isPending}
          aria-label="Scan QR code"
          className="flex items-center justify-center gap-2 w-full max-w-70 h-13 rounded-xl bg-brand-orange text-white font-display font-bold text-[16px] hover:bg-brand-orange-hover disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          {scanMutation.isPending ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Validating…
            </>
          ) : (
            <>
              <Icon name="ScanLine" size={20} />
              Scan QR
            </>
          )}
        </button>

        {/* Quick-fire demo buttons */}
        <div className="flex flex-wrap gap-2 justify-center px-4" role="group" aria-label="Simulate specific result">
          {(["admit", "used", "invalid", "wrong", "expired"] as ResultKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => fireDemoResult(k)}
              aria-label={`Simulate ${k}`}
              className="px-3 py-1.5 rounded-pill bg-white/10 text-white/60 text-[12px] font-semibold hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              {k}
            </button>
          ))}
        </div>

        {/* Real API scan test button — only visible when agentId is present */}
        {agentId && eventId && (
          <button
            type="button"
            disabled={scanMutation.isPending}
            onClick={() => fireRealScan("TIX-E12A-6819:6a33fa8d83957708f9f6d707:6a342d99ffe24e93e4d2a89f")}
            aria-label="Fire real API scan with test payload"
            className="px-4 py-2 rounded-lg border border-brand-orange/40 text-brand-orange text-[12px] font-semibold hover:bg-brand-orange/10 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            Real scan (test payload)
          </button>
        )}
      </div>

      {/* ── Menu dropdown ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute top-12 right-2 z-40 w-52 bg-surface border border-border rounded-lg shadow-pop overflow-hidden">
            {[
              { icon: "Wallet"    as const, label: "Manual cash entry",  action: () => router.push(cashEntryUrl) },
              { icon: "RefreshCw" as const, label: "Sync offline scans", action: () => { setSheetOpen(true); setMenuOpen(false); } },
              { icon: "House"     as const, label: "Back to home",       action: () => router.push(ROUTES.HOME) },
              { icon: "LogOut"    as const, label: "Sign out",           action: () => signOut({ redirect: true, callbackUrl: "/login" }) },
            ].map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => { setMenuOpen(false); item.action(); }}
                aria-label={item.label}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3.5 text-left text-[15px] font-medium text-text hover:bg-surface-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
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

      {/* ── Offline Sync Sheet (G8) ── */}
      {sheetOpen && (
        <OfflineSyncSheet
          online={online}
          onRestore={() => setOnline(true)}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {/* ── Result overlay ── */}
      {result && <ResultOverlay result={result} onReset={handleReset} />}

      {/* Scan line keyframe */}
      <style>{`
        @keyframes scanline {
          from { top: 6px; }
          to   { top: calc(100% - 8px); }
        }
      `}</style>
    </div>
  );
}
