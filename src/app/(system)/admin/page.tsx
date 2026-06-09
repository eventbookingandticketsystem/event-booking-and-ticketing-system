'use client';

import { useState } from "react";
import { StatCard } from "@/components/Shared/StatCard";
import { LineChart } from "@/components/Shared/LineChart";
import { StatusPill } from "@/components/Shared/StatusPill";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ADMIN_OVERVIEW } from "@/lib/mock-data";

type PageState = "loaded" | "loading" | "error";

export default function AdminOverviewPage() {
  const [state, setState] = useState<PageState>("loaded");
  const d = ADMIN_OVERVIEW;

  const lineData = d.salesTrend.map((pt) => ({
    label: pt.t,
    value: pt.v,
  }));

  return (
    <div className="flex flex-col min-h-full">
      {/* Demo state toggle */}
      <div className="flex gap-2 px-6 pt-4">
        {(["loaded", "loading", "error"] as PageState[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={cn(
              "px-3 py-1 rounded-sm text-xs font-semibold border transition-colors",
              state === s
                ? "bg-brand-navy text-white border-brand-navy"
                : "border-border text-text-secondary hover:border-brand-navy/30",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-6 pt-5 pb-10 flex flex-col gap-6">
        {/* ERROR state */}
        {state === "error" && (
          <>
            <div>
              <h1 className="font-display font-bold text-[26px] text-text mb-0.5">System overview</h1>
              <p className="text-sm text-text-secondary">System-wide activity across all organizers.</p>
            </div>
            <AlertBanner
              tone="danger"
              title="Failed to load system data"
              message="The monitoring service could not be reached."
            />
            <div>
              <Button className="gap-2">
                <Icon name="RefreshCw" size={15} />
                Retry
              </Button>
            </div>
          </>
        )}

        {/* LOADING state */}
        {state === "loading" && (
          <>
            <div>
              <div className="h-7 w-60 skeleton rounded mb-2" />
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
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="h-5 w-36 skeleton rounded" />
              </div>
              <div className="p-4 flex flex-col gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-5 skeleton rounded" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* LOADED state */}
        {state === "loaded" && (
          <>
            {/* Page header */}
            <div>
              <h1 className="font-display font-bold text-[26px] text-text mb-0.5">System overview</h1>
              <p className="text-sm text-text-secondary flex items-center gap-1.5">
                <Icon name="RefreshCw" size={13} className="text-text-muted" />
                Updated just now · 6 Dec 2025, 14:30
              </p>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Organizers"
                value={String(d.organizers)}
                chipIcon={<Icon name="Building2" size={17} />}
                footText="Across South Sudan"
              />
              <StatCard
                label="Active Events Today"
                value={String(d.activeToday)}
                chipIcon={<Icon name="CalendarCheck" size={17} />}
                chipBg="bg-status-info-bg"
                chipFg="text-brand-navy"
                footDot="bg-status-info"
                footText="Gates open now"
              />
              <StatCard
                label="Tickets Sold (all time)"
                value={d.ticketsAllTime.toLocaleString()}
                chipIcon={<Icon name="Ticket" size={17} />}
                chipBg="bg-status-success-bg"
                chipFg="text-status-success"
                footDot="bg-status-success"
                footText="Platform total"
              />
              <StatCard
                label="Fraud Attempts (30d)"
                value={String(d.fraud30d)}
                chipIcon={<Icon name="ShieldAlert" size={17} />}
                chipBg="bg-status-danger-bg"
                chipFg="text-status-danger"
                footDot="bg-status-danger"
                footText="Rejected at gates"
              />
            </div>

            {/* Sales trend chart */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-[17px] text-text m-0">Tickets sold</h3>
                <span className="text-sm text-text-muted">Per day · last 30 days</span>
              </div>
              <LineChart data={lineData} />
            </div>

            {/* Recent activity table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-display font-semibold text-[17px] text-text m-0">Recent activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Recent activity">
                  <thead>
                    <tr className="border-b border-border bg-surface-bg">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.activity.map((a, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                        <td className="px-5 py-3.5 font-mono text-[13px] whitespace-nowrap">{a.time}</td>
                        <td className="px-4 py-3.5 font-semibold">{a.actor}</td>
                        <td className="px-4 py-3.5 text-text-secondary">{a.action}</td>
                        <td className="px-4 py-3.5">
                          {a.status === "Completed" ? (
                            <StatusPill status="Completed" />
                          ) : a.status === "Pending" ? (
                            <StatusPill status="Pending" />
                          ) : (
                            <StatusPill status="Upcoming" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
