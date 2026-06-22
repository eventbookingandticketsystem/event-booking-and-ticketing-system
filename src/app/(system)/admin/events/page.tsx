'use client';

import { useState } from "react";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { useAdminEvents } from "@/lib/api/hooks/useAdminData";
import type { AdminEventRow } from "@/types/event";

type FilterTab = "All" | "Upcoming" | "Ongoing" | "Completed" | "Flagged";

const FILTER_TABS: FilterTab[] = ["All", "Upcoming", "Ongoing", "Completed", "Flagged"];

const FILTER_TO_STATUS: Record<FilterTab, string | undefined> = {
  All:       undefined,
  Upcoming:  "PUBLISHED",
  Ongoing:   "ONGOING",
  Completed: "COMPLETED",
  Flagged:   undefined,  // all statuses, then filter fraud > 5 client-side
};

export default function AdminEventsPage() {
  const [filter, setFilter] = useState<FilterTab>("All");
  const [q,      setQ]      = useState("");

  const { data: result, isLoading, isError, error } = useAdminEvents({
    status: FILTER_TO_STATUS[filter],
    search: q || undefined,
    limit:  50,
  });

  const allRows = result?.data ?? [];

  // Flagged: events with fraud > 5 — currently 0 in real data since fraud field is always 0
  // (scan-level fraud query not included in list endpoint). Show all with note.
  const rows: AdminEventRow[] = filter === "Flagged"
    ? allRows.filter((e) => e.fraud > 5)
    : allRows;

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-10 flex flex-col gap-5">
        {/* Page header */}
        <div>
          <h1 className="font-display font-bold text-[26px] text-text mb-0.5">All events</h1>
          <p className="text-sm text-text-secondary">Every event across the platform.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-border" role="tablist">
          {FILTER_TABS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                filter === f
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-text-secondary hover:text-text",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Error */}
        {isError && (
          <AlertBanner
            tone="danger"
            title="Could not load events"
            message={error?.message ?? "Please try again."}
          />
        )}

        {/* Flagged banner */}
        {filter === "Flagged" && !isLoading && (
          <AlertBanner
            tone="info"
            title="Fraud data coming soon"
            message="Per-event fraud counts require scan aggregation — currently showing 0. This will be live once scan history is indexed."
          />
        )}

        {/* Search */}
        {!isLoading && !isError && (
          <div className="flex items-center gap-2 h-10 px-3.5 border border-border rounded-sm bg-white max-w-90 focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 transition-colors">
            <Icon name="Search" size={16} className="text-text-muted shrink-0" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events..."
              aria-label="Search events"
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0,1,2,3,4].map((i) => <SkeletonCard key={i} className="h-12" />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="CalendarOff"
              heading="No events match this filter"
              subtext="Try a different filter or search term."
            />
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && rows.length > 0 && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="All events table">
                <thead>
                  <tr className="border-b border-border bg-surface-bg">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Event</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Organizer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Sold</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Fraud</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                      <td className="px-5 py-3.5 font-semibold">{e.name}</td>
                      <td className="px-4 py-3.5 text-text-muted">{e.organizer}</td>
                      <td className="px-4 py-3.5">{e.date}</td>
                      <td className="px-4 py-3.5 font-mono text-[13px]">{e.sold.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn("font-mono text-[13px]", e.fraud > 5 ? "text-status-danger font-semibold" : "text-text")}>
                          {e.fraud}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={e.status as Parameters<typeof StatusPill>[0]["status"]} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label={`View ${e.name}`}
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                          >
                            <Icon name="Eye" size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Flag ${e.name}`}
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-warning/40 hover:text-status-warning transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning"
                          >
                            <Icon name="Flag" size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${e.name}`}
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
