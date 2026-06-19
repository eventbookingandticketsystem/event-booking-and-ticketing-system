'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Shared/Icon";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useAgents } from "@/lib/api/hooks/useAgents";
import type { ApiGateAgent } from "@/lib/api/types";

type Phase = "ready" | "downloading" | "failed";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function GateSelectorPage() {
  const router  = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [dropOpen,   setDropOpen]   = useState(false);
  const [phase,      setPhase]      = useState<Phase>("downloading");
  const [pct,        setPct]        = useState(0);

  const { data: agents = [], isLoading, isError, error } = useAgents({ limit: 50 });

  // Cast to raw ApiGateAgent so we can access eventId/gate/scansToday
  const agentList = agents as unknown as ApiGateAgent[];

  useEffect(() => {
    if (agentList.length > 0 && !selectedId) {
      setSelectedId(agentList[0].id);
    }
  }, [agentList, selectedId]);

  const selected = agentList.find((a) => a.id === selectedId) ?? agentList[0];

  // Animate download progress
  useEffect(() => {
    if (phase !== "downloading") return;
    if (pct >= 100) { setPhase("ready"); return; }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 7)), 130);
    return () => clearTimeout(t);
  }, [phase, pct]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectAgent = (id: string) => {
    setSelectedId(id);
    setDropOpen(false);
    setPhase("downloading");
    setPct(0);
  };

  const startDownload = () => { setPhase("downloading"); setPct(0); };

  const handleStart = () => {
    if (!selected) return;
    const params = new URLSearchParams({
      agentId: selected.id,
      eventId: selected.eventId,
      gate:    selected.gate,
    });
    router.push(`${ROUTES.AGENT_SCAN}?${params.toString()}`);
  };

  return (
    <div className="h-full bg-brand-navy flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-[390px] flex flex-col gap-6 p-8 rounded-2xl bg-white/5 backdrop-blur-sm">

          {/* Brand row */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-md bg-brand-orange inline-flex items-center justify-center shrink-0">
              <Icon name="ScanLine" size={22} className="text-white" />
            </span>
            <div>
              <div className="font-display font-bold text-[19px] text-white leading-none">Tiketi Gate</div>
              <div className="text-[12px] text-white/50 mt-0.5 font-body">Scanner</div>
            </div>
          </div>

          {/* Error */}
          {isError && (
            <AlertBanner
              tone="danger"
              title="Could not load assigned events"
              message={(error as Error | null)?.message ?? "Check your connection and try again."}
            />
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-3">
              <SkeletonCard className="h-12" />
              <SkeletonCard className="h-10" />
            </div>
          )}

          {/* No agents */}
          {!isLoading && !isError && agentList.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#4A1A1A] text-sm text-white">
              <Icon name="CircleAlert" size={18} className="text-[#f0a8a8] shrink-0" />
              <span>No events assigned to this account. Ask an organizer to add you as a gate agent.</span>
            </div>
          )}

          {/* Main content — agents loaded */}
          {!isLoading && !isError && agentList.length > 0 && selected && (
            <>
              {/* Agent row */}
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-white text-brand-navy inline-flex items-center justify-center font-display font-bold text-[15px] shrink-0">
                  {(selected.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="font-semibold text-white text-[15px]">{selected.name}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">
                    Gate agent · Gate {selected.gate} · {fmtDate(selected.event.date)}
                  </div>
                </div>
              </div>

              {/* Event selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/50">
                  Assigned event
                </span>

                <div className="relative" ref={dropRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={dropOpen}
                    aria-label="Select event"
                    onClick={() => setDropOpen((o) => !o)}
                    className="flex items-center justify-between gap-2 w-full px-4 py-3 rounded-lg bg-white/8 border border-white/12 text-left hover:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    <span className="text-white font-medium text-[14px] leading-snug truncate">
                      {selected.event.title}
                    </span>
                    <Icon
                      name="ChevronDown"
                      size={18}
                      className={cn("text-white/50 shrink-0 transition-transform duration-150", dropOpen && "rotate-180")}
                    />
                  </button>

                  {dropOpen && (
                    <div
                      role="listbox"
                      aria-label="Select an event"
                      className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg overflow-hidden border border-white/12 shadow-pop"
                      style={{ background: "#0e1c29" }}
                    >
                      {agentList.map((ag) => {
                        const isSel = ag.id === selectedId;
                        return (
                          <button
                            key={ag.id}
                            type="button"
                            role="option"
                            aria-selected={isSel}
                            onClick={() => selectAgent(ag.id)}
                            className={cn(
                              "flex items-start justify-between gap-3 w-full px-4 py-3.5 text-left transition-colors",
                              "border-b border-white/6 last:border-b-0",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange",
                              isSel
                                ? "bg-brand-orange/15 text-white"
                                : "text-white/70 hover:bg-white/8 hover:text-white",
                            )}
                          >
                            <div className="flex flex-col gap-0.75 min-w-0">
                              <span className="text-[14px] font-semibold leading-snug truncate">{ag.event.title}</span>
                              <span className="text-[11px] text-white/40">
                                {fmtDate(ag.event.date)} · Gate {ag.gate}
                              </span>
                            </div>
                            {isSel && <Icon name="Check" size={16} className="text-brand-orange shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-fetch status */}
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
                    <span className="font-bold">Tickets ready</span>
                    {" "}for offline validation · Gate {selected.gate}
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

              {/* State toggle pills (demo) */}
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

              {/* Start scanning */}
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={handleStart}
                aria-label="Start scanning"
                className={cn(
                  "flex items-center justify-center gap-2 w-full h-13 rounded-xl font-display font-bold text-[16px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                  phase === "ready"
                    ? "bg-brand-orange text-white hover:bg-brand-orange-hover"
                    : "bg-white/10 text-white/30 cursor-not-allowed",
                )}
              >
                <Icon name="ScanLine" size={20} />
                Start scanning
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
