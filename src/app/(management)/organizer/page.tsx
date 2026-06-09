'use client';

import { useState } from "react";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { HBarChart } from "@/components/Shared/HBarChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Icon } from "@/components/Shared/Icon";
import { formatSSP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DASH } from "@/lib/mock-data";

type DashState = "live" | "loading" | "noevent";

export default function OrgDashboardPage() {
  const [dashState, setDashState] = useState<DashState>("live");
  const [page, setPage] = useState(1);
  const d = DASH;

  const admittedPct = Math.round((d.admitted / d.capacity) * 100);

  const lineData = d.entryRate.map((pt) => ({
    label: pt.t,
    value: pt.v,
  }));

  const barData = d.tiers.map((t) => ({
    label: t.name,
    value: t.count,
    color: t.color,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar
        crumb="Dashboard"
        eventName={d.eventName}
        onEvent={() => {}}
      />

      {/* State toggle (demo) */}
      <div className="flex gap-2 px-6 pt-4">
        {(["live", "loading", "noevent"] as DashState[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setDashState(s)}
            className={cn(
              "px-3 py-1 rounded-sm text-xs font-semibold border transition-colors",
              dashState === s
                ? "bg-brand-navy text-white border-brand-navy"
                : "border-border text-text-secondary hover:border-brand-navy/30",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-6 pt-5 pb-8 flex flex-col gap-6">
        {dashState === "noevent" && (
          <>
            <div>
              <h1 className="font-display font-bold text-[26px] text-text mb-0.5">Dashboard</h1>
              <p className="text-sm text-text-secondary">Real-time gate attendance and revenue.</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-6">
              <EmptyState
                icon="CalendarOff"
                heading="No live event selected"
                subtext="Choose an event from the dropdown above to see real-time attendance."
              />
            </div>
          </>
        )}

        {dashState === "loading" && (
          <>
            <div>
              <div className="h-7 w-72 skeleton rounded mb-2" />
              <div className="h-4 w-48 skeleton rounded" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-5">
                  <div className="h-3 w-24 skeleton rounded mb-3" />
                  <div className="h-8 w-32 skeleton rounded mb-4" />
                  <div className="h-2 w-full skeleton rounded" />
                </div>
              ))}
            </div>
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="h-5 w-32 skeleton rounded mb-4" />
              <div className="h-[200px] skeleton rounded" />
            </div>
          </>
        )}

        {dashState === "live" && (
          <>
            {/* Page header */}
            <div>
              <h1 className="font-display font-bold text-[26px] text-text flex items-center gap-3 flex-wrap mb-0.5">
                {d.eventName}
                <StatusPill status="Live" />
              </h1>
              <p className="text-sm text-text-secondary flex items-center gap-1.5">
                <Icon name="RefreshCw" size={13} className="text-text-muted" />
                Updated 12s ago
              </p>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Admitted"
                value={d.admitted.toLocaleString()}
                chipIcon={<Icon name="DoorOpen" size={17} />}
                progress={admittedPct}
                progressColor="bg-brand-orange"
                footText={`${admittedPct}% of ${d.capacity.toLocaleString()} capacity`}
              />
              <StatCard
                label="Tickets Sold"
                value={d.sold.toLocaleString()}
                chipIcon={<Icon name="Ticket" size={17} />}
                chipBg="bg-status-info-bg"
                chipFg="text-brand-navy"
                footDot="bg-status-info"
                footText="Across all tiers"
              />
              <StatCard
                label="Fraud Attempts"
                value={String(d.fraud)}
                chipIcon={<Icon name="ShieldAlert" size={17} />}
                chipBg="bg-status-danger-bg"
                chipFg="text-status-danger"
                footDot="bg-status-danger"
                footText="Rejected at the gate"
              />
              <StatCard
                label="Revenue"
                value={formatSSP(d.revenue)}
                chipIcon={<Icon name="TrendingUp" size={17} />}
                chipBg="bg-status-success-bg"
                chipFg="text-status-success"
                footDot="bg-status-success"
                footText="Net of service fees"
              />
            </div>

            {/* Line chart */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-[17px] text-text m-0">Entry rate</h3>
                <span className="text-sm text-text-muted">Admissions per 30 min</span>
              </div>
              <LineChart data={lineData} />
            </div>

            {/* 2-col grid: tier breakdown + recent scans */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Tier breakdown */}
              <div className="bg-surface border border-border rounded-lg p-5">
                <h3 className="font-display font-semibold text-[17px] text-text mb-3 m-0">Tier breakdown</h3>
                <HBarChart data={barData} />
              </div>

              {/* Recent scans table */}
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-display font-semibold text-[17px] text-text m-0">Recent scans</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Recent scans">
                    <thead>
                      <tr className="border-b border-border bg-surface-bg">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Time</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Gate</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tier</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wide">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.scans.map((s: { time: string; gate: string; tier: string; result: string }, i: number) => (
                        <tr key={i} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                          <td className="px-4 py-3 font-mono text-[13px]">{s.time}</td>
                          <td className="px-4 py-3 text-text-secondary">{s.gate}</td>
                          <td className="px-4 py-3">{s.tier}</td>
                          <td className="px-4 py-3">
                            <StatusPill status={s.result === "ADMIT" ? "Admitted" : "Rejected"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface-bg">
                  <span className="text-xs text-text-muted">Showing 10 of 1,247</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="w-7 h-7 rounded border border-border inline-flex items-center justify-center text-text-secondary hover:border-brand-navy/30 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                    >
                      <Icon name="ChevronLeft" size={15} />
                    </button>
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={page === p ? "page" : undefined}
                        className={cn(
                          "w-7 h-7 rounded border text-xs font-semibold inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                          page === p
                            ? "bg-brand-navy text-white border-brand-navy"
                            : "border-border text-text-secondary hover:border-brand-navy/30",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Next page"
                      className="w-7 h-7 rounded border border-border inline-flex items-center justify-center text-text-secondary hover:border-brand-navy/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                    >
                      <Icon name="ChevronRight" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
