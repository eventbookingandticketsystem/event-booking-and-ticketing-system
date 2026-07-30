'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useRawAgents } from "@/lib/api/hooks/useAgents";
import type { ApiGateAgent } from "@/lib/api/types";

type Phase = "ready" | "downloading" | "failed";

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function GateSelectorPage() {
  const router  = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string>("");
  const [dropOpen,   setDropOpen]   = useState(false);
  const [phase,      setPhase]      = useState<Phase>("downloading");
  const [pct,        setPct]        = useState(0);

  const { data: agentList = [], isLoading, isError, error } = useRawAgents({ limit: 50 });
  const agents = agentList as ApiGateAgent[];

  useEffect(() => {
    if (agents.length > 0 && !selectedId) setSelectedId(agents[0].id);
  }, [agents, selectedId]);

  const selected = agents.find((a) => a.id === selectedId) ?? agents[0];

  // Animate download progress bar
  useEffect(() => {
    if (phase !== "downloading") return;
    if (pct >= 100) { setPhase("ready"); return; }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 7)), 130);
    return () => clearTimeout(t);
  }, [phase, pct]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
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

  const handleStart = () => {
    if (!selected) return;
    const params = new URLSearchParams({
      agentId:    selected.id,
      eventId:    selected.eventId,
      gate:       selected.gate,
      eventTitle: selected.event.title,
    });
    router.push(`${ROUTES.AGENT_SCAN}?${params.toString()}`);
  };

  return (
    <div className="min-h-full bg-brand-navy flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-md bg-brand-orange inline-flex items-center justify-center shrink-0">
            <Icon name="ScanLine" size={20} className="text-white" />
          </span>
          <span className="font-display font-bold text-[18px] text-white">Tiketi Gate</span>
        </div>
        <button
          type="button"
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <Icon name="LogOut" size={15} />
          Sign out
        </button>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {isError && (
            <AlertBanner
              tone="danger"
              title="Could not load assigned events"
              message={(error as Error | null)?.message ?? "Check your connection and try again."}
              className="mb-4"
            />
          )}

          {isLoading && (
            <div className="flex flex-col gap-3">
              <SkeletonCard className="h-20" />
              <SkeletonCard className="h-12" />
              <SkeletonCard className="h-12" />
            </div>
          )}

          {!isLoading && !isError && agents.length === 0 && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#4A1A1A] text-sm text-white">
              <Icon name="CircleAlert" size={18} className="text-[#f0a8a8] shrink-0" />
              <span>No events assigned to this account. Ask an organizer to add you as a gate agent.</span>
            </div>
          )}

          {!isLoading && !isError && agents.length > 0 && selected && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-5">

              {/* Agent identity */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/8">
                <span className="w-12 h-12 rounded-full bg-brand-orange text-white inline-flex items-center justify-center font-display font-bold text-[16px] shrink-0">
                  {(selected.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="font-semibold text-white text-[16px]">{selected.name}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">
                    Gate Agent · Gate {selected.gate}
                  </div>
                </div>
              </div>

              {/* Event selector */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.8px] text-white/40">
                  Assigned Event
                </span>

                <div className="relative" ref={dropRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={dropOpen}
                    onClick={() => setDropOpen((o) => !o)}
                    className="flex items-center justify-between gap-3 w-full px-4 py-3.5 rounded-xl bg-white/8 border border-white/10 text-left hover:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-semibold text-[14px] truncate">{selected.event.title}</span>
                      <span className="text-white/40 text-[12px] mt-0.5">{fmtDate(selected.event.date)} · Gate {selected.gate}</span>
                    </div>
                    <Icon
                      name="ChevronDown"
                      size={18}
                      className={cn("text-white/40 shrink-0 transition-transform duration-150", dropOpen && "rotate-180")}
                    />
                  </button>

                  {dropOpen && (
                    <div
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden border border-white/10 shadow-pop"
                      style={{ background: "#0d1c2b" }}
                    >
                      {agents.map((ag) => {
                        const isSel = ag.id === selectedId;
                        return (
                          <button
                            key={ag.id}
                            type="button"
                            role="option"
                            aria-selected={isSel}
                            onClick={() => selectAgent(ag.id)}
                            className={cn(
                              "flex items-start justify-between gap-3 w-full px-4 py-3.5 text-left transition-colors border-b border-white/6 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange",
                              isSel ? "bg-brand-orange/15 text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                            )}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[14px] font-semibold truncate">{ag.event.title}</span>
                              <span className="text-[11px] text-white/40">{fmtDate(ag.event.date)} · Gate {ag.gate}</span>
                            </div>
                            {isSel && <Icon name="Check" size={16} className="text-brand-orange shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Download status */}
              {phase === "downloading" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-white/60">Syncing ticket data…</span>
                    <span className="font-mono text-white">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-pill bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-pill bg-brand-orange transition-[width] duration-150"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}

              {phase === "ready" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1A4A2A] text-sm font-semibold text-white">
                  <Icon name="CircleCheck" size={18} className="text-[#8fe0ad] shrink-0" />
                  <span>Ready · <span className="font-bold">{selected.event.title}</span> · Gate {selected.gate}</span>
                </div>
              )}

              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={handleStart}
                className={cn(
                  "flex items-center justify-center gap-2 w-full h-13 rounded-xl font-display font-bold text-[16px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                  phase === "ready"
                    ? "bg-brand-orange text-white hover:bg-brand-orange-hover"
                    : "bg-white/10 text-white/30 cursor-not-allowed",
                )}
              >
                <Icon name="ScanLine" size={20} />
                Start Scanning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
