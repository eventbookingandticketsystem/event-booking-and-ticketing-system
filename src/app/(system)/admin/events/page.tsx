'use client';

import { useState } from "react";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { Icon } from "@/components/Shared/Icon";
import { ALL_EVENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AdminEventRow } from "@/types/event";

type PageState = "loaded" | "loading" | "empty";
type FilterTab = "All" | "Upcoming" | "Ongoing" | "Completed" | "Flagged";

const FILTER_TABS: FilterTab[] = ["All", "Upcoming", "Ongoing", "Completed", "Flagged"];

export default function AdminEventsPage() {
  const [state, setState] = useState<PageState>("loaded");
  const [filter, setFilter] = useState<FilterTab>("All");
  const [q, setQ] = useState("");

  let rows: AdminEventRow[] = state === "empty" ? [] : ALL_EVENTS;
  if (filter === "Flagged") rows = rows.filter((e) => e.fraud > 5);
  else if (filter !== "All") rows = rows.filter((e) => e.status === filter);
  rows = rows.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex flex-col min-h-full">
      {/* Demo state toggle */}
      <div className="flex gap-2 px-6 pt-4">
        {(["loaded", "loading", "empty"] as PageState[]).map((s) => (
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

        {/* Flagged warning */}
        {filter === "Flagged" && rows.length > 0 && (
          <AlertBanner
            tone="warning"
            title="Elevated fraud activity"
            message="These events have more than 5 fraud attempts and may need review."
          />
        )}

        {/* Search */}
        {state !== "loading" && state !== "empty" && (
          <div className="flex items-center gap-2 h-10 px-3.5 border border-border rounded-sm bg-white max-w-[360px] focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/20 transition-colors">
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

        {/* Empty / no results */}
        {(state === "empty" || (state === "loaded" && rows.length === 0)) && (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="CalendarOff"
              heading="No events match this filter"
              subtext="Try a different filter or search term."
            />
          </div>
        )}

        {/* Table */}
        {state !== "empty" && rows.length > 0 && (
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
                  {state === "loading"
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-5 py-4"><div className="h-4 w-40 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-24 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-16 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-12 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-3 w-8 skeleton rounded" /></td>
                          <td className="px-4 py-4"><div className="h-5 w-16 skeleton rounded-pill" /></td>
                          <td className="px-5 py-4 text-right"><div className="h-7 w-20 skeleton rounded ml-auto" /></td>
                        </tr>
                      ))
                    : rows.map((e) => (
                        <tr key={e.id} className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50">
                          <td className="px-5 py-3.5 font-semibold">{e.name}</td>
                          <td className="px-4 py-3.5 text-text-muted">{e.organizer}</td>
                          <td className="px-4 py-3.5">{e.date}</td>
                          <td className="px-4 py-3.5 font-mono text-[13px]">{e.sold.toLocaleString()}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "font-mono text-[13px]",
                                e.fraud > 5 ? "text-status-danger font-semibold" : "text-text",
                              )}
                            >
                              {e.fraud}
                            </span>
                          </td>
                          <td className="px-4 py-3.5"><StatusPill status={e.status} /></td>
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
