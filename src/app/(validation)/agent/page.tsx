'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

const GATE_EVENTS = [
  { id: "evt-jmf", name: "Juba Music Festival 2025",        tickets: 2000, date: "Sat, 14 Dec 2025" },
  { id: "evt-psl", name: "South Sudan Premier League Final", tickets: 8600, date: "Sun, 22 Dec 2025" },
];

type Phase = "ready" | "downloading" | "failed";

export default function GateSelectorPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("downloading");
  const [pct,   setPct]   = useState(0);

  // Animate download progress
  useEffect(() => {
    if (phase !== "downloading") return;
    if (pct >= 100) { setPhase("ready"); return; }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 7)), 130);
    return () => clearTimeout(t);
  }, [phase, pct]);

  const ev = GATE_EVENTS[0];

  const startDownload = () => { setPhase("downloading"); setPct(0); };

  return (
    <div className="w-screen h-screen bg-brand-navy flex flex-col overflow-hidden">

      {/* ── Top bar: exit controls ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-white/8 shrink-0">
        <button
          type="button"
          onClick={() => router.push(ROUTES.HOME)}
          aria-label="Back to home page"
          className="flex items-center gap-2 text-white/60 hover:text-white text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md px-2 py-1"
        >
          <Icon name="ChevronLeft" size={16} />
          Home
        </button>
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          aria-label="Sign out"
          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md px-2 py-1"
        >
          <Icon name="LogOut" size={15} />
          Sign out
        </button>
      </div>

      {/* ── Card ── */}
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] flex flex-col gap-6 p-8 rounded-2xl bg-white/5 backdrop-blur-sm">

        {/* 1. Brand row */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-md bg-brand-orange inline-flex items-center justify-center shrink-0">
            <Icon name="ScanLine" size={22} className="text-white" />
          </span>
          <div>
            <div className="font-display font-bold text-[19px] text-white leading-none">Tiketi Gate</div>
            <div className="text-[12px] text-white/50 mt-0.5 font-body">Scanner</div>
          </div>
        </div>

        {/* 2. Agent row */}
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-white text-brand-navy inline-flex items-center justify-center font-display font-bold text-[15px] shrink-0">
            JM
          </span>
          <div>
            <div className="font-semibold text-white text-[15px]">James Majok</div>
            <div className="text-[12px] text-white/50 mt-0.5">Gate agent · {ev.date}</div>
          </div>
        </div>

        {/* 3. Event selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/50">
            Assigned event
          </span>
          <button
            type="button"
            aria-label="Selected event"
            className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-lg bg-white/8 border border-white/12 text-left hover:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <span className="text-white font-medium text-[14px] leading-snug">{ev.name}</span>
            <Icon name="ChevronDown" size={18} className="text-white/50 shrink-0" />
          </button>
        </div>

        {/* 4. Pre-fetch status */}
        {phase === "downloading" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-white/70">Downloading ticket data…</span>
              <span className="font-mono text-white">{pct}%</span>
            </div>
            <div className="h-2 rounded-pill bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-pill bg-brand-orange transition-[width] duration-150"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Download progress"
              />
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1A4A2A] text-sm font-semibold text-white">
            <Icon name="CircleCheck" size={18} className="text-[#8fe0ad] shrink-0" />
            <span>
              <span className="font-bold">{ev.tickets.toLocaleString()} tickets ready</span>
              {" "}for offline validation
            </span>
          </div>
        )}

        {phase === "failed" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#4A1A1A] text-sm font-semibold text-white">
              <Icon name="CircleX" size={18} className="text-[#f0a8a8] shrink-0" />
              <span>
                <span className="font-bold">Download failed.</span>
                {" "}Check your connection and retry.
              </span>
            </div>
            <button
              type="button"
              onClick={startDownload}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Icon name="RotateCcw" size={16} />
              Retry download
            </button>
          </div>
        )}

        {/* 5. State toggle pills (demo) */}
        <div className="flex gap-2" role="group" aria-label="Demo state selector">
          {(["ready", "downloading", "failed"] as Phase[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setPhase(s); if (s === "downloading") setPct(0); }}
              className={cn(
                "flex-1 h-8 rounded-pill text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                phase === s
                  ? "bg-white text-brand-navy"
                  : "bg-white/10 text-white/50 hover:bg-white/16",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 6. Start scanning button */}
        <button
          type="button"
          disabled={phase !== "ready"}
          onClick={() => router.push(ROUTES.AGENT_SCAN)}
          aria-label="Start scanning"
          className={cn(
            "flex items-center justify-center gap-2 w-full h-[52px] rounded-xl font-display font-bold text-[16px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
            phase === "ready"
              ? "bg-brand-orange text-white hover:bg-brand-orange-hover"
              : "bg-white/10 text-white/30 cursor-not-allowed",
          )}
        >
          <Icon name="ScanLine" size={20} />
          Start scanning
        </button>
      </div>
      </div>
    </div>
  );
}
