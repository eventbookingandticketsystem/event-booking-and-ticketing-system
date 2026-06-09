'use client';

import { useState } from "react";
import { StatCard } from "@/components/Shared/StatCard";
import { StatusPill } from "@/components/Shared/StatusPill";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { SYSTEM_HEALTH } from "@/lib/mock-data";

type PageState = "loaded" | "loading" | "error";

export default function AdminHealthPage() {
  const [state, setState] = useState<PageState>("loaded");
  const h = SYSTEM_HEALTH;
  const degraded = h.services.find((s) => s.status === "Degraded");

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
              <h1 className="font-display font-bold text-[26px] text-text mb-0.5">System health</h1>
              <p className="text-sm text-text-secondary">Live status of every connected service.</p>
            </div>
            <AlertBanner
              tone="danger"
              title="Health check failed"
              message="Could not reach the monitoring service. Status below may be stale."
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
            <div className="h-7 w-48 skeleton rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-5">
                  <div className="h-3 w-24 skeleton rounded mb-3" />
                  <div className="h-8 w-24 skeleton rounded mb-4" />
                  <div className="h-2 w-full skeleton rounded" />
                </div>
              ))}
            </div>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <div className="h-5 w-32 skeleton rounded" />
              </div>
              <div className="divide-y divide-border">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="w-2 h-2 rounded-full skeleton shrink-0" />
                    <div className="h-4 flex-1 skeleton rounded" />
                    <div className="h-5 w-16 skeleton rounded-pill" />
                    <div className="h-3 w-16 skeleton rounded" />
                  </div>
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
              <h1 className="font-display font-bold text-[26px] text-text mb-0.5">System health</h1>
              <p className="text-sm text-text-secondary flex items-center gap-1.5">
                <Icon name="RefreshCw" size={13} className="text-text-muted" />
                Auto-refreshing every 30s
              </p>
            </div>

            {/* Degraded banner */}
            {degraded && (
              <AlertBanner
                tone="warning"
                title={`${degraded.name} is degraded`}
                message="Payments through this provider may be delayed."
              />
            )}

            {/* 3 stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="API Uptime"
                value={h.uptime}
                chipIcon={<Icon name="TrendingUp" size={17} />}
                chipBg="bg-status-success-bg"
                chipFg="text-status-success"
                footDot="bg-status-success"
                footText="Last 30 days"
              />
              <StatCard
                label="Avg Response Time"
                value={h.responseTime}
                chipIcon={<Icon name="Timer" size={17} />}
                chipBg="bg-status-success-bg"
                chipFg="text-status-success"
                footDot="bg-status-success"
                footText="p50 across endpoints"
              />
              <StatCard
                label="Failed Callbacks (24h)"
                value={String(h.failedCallbacks)}
                chipIcon={<Icon name="TriangleAlert" size={17} />}
                chipBg="bg-status-warning-bg"
                chipFg="text-status-warning"
                footDot="bg-status-warning"
                footText="Retried automatically"
              />
            </div>

            {/* Services list */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-display font-semibold text-[17px] text-text m-0">Service status</h3>
              </div>
              <div className="divide-y divide-border">
                {h.services.map((s) => (
                  <div key={s.name} className="flex items-center gap-4 px-6 py-3.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        s.status === "Operational" ? "bg-status-success" : "bg-status-warning",
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-[14px] text-text flex-1">{s.name}</span>
                    <StatusPill
                      status={s.status === "Operational" ? "Online" : "Pending"}
                    />
                    <span className="text-xs text-text-muted w-20 text-right shrink-0">
                      {s.checked}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error log table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-display font-semibold text-[17px] text-text m-0">
                  Recent error log
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Recent error log">
                  <thead>
                    <tr className="border-b border-border bg-surface-bg">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Service</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Code</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Message</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {h.errors.map((e, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50"
                      >
                        <td className="px-5 py-3.5 font-mono text-[13px]">{e.time}</td>
                        <td className="px-4 py-3.5">{e.service}</td>
                        <td className="px-4 py-3.5 font-mono text-[13px]">{e.code}</td>
                        <td className="px-4 py-3.5 text-text-secondary">{e.message}</td>
                        <td className="px-4 py-3.5">
                          {e.resolved ? (
                            <StatusPill status="Completed" />
                          ) : (
                            <StatusPill status="Pending" />
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
