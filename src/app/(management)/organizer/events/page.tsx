'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ORG_EVENTS } from "@/lib/mock-data";
import { CREATED_EVENTS } from "@/lib/created-events";
import { ROUTES } from "@/constants/routes";
import type { OrgEventRow } from "@/types/event";

const EVENT_FILTERS = ["All", "Upcoming", "Ongoing", "Completed", "Draft"] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];

function progressColor(pct: number): string {
  if (pct >= 90) return "bg-status-danger";
  if (pct >= 60) return "bg-brand-orange";
  return "bg-status-success";
}

export default function OrgEventsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<EventFilter>("All");

  // Merge created events (in-memory) with mock data
  const allRows: OrgEventRow[] = [...CREATED_EVENTS, ...ORG_EVENTS];
  const rows = allRows.filter(
    (e) => filter === "All" || e.status === filter,
  );

  const isEmpty = allRows.length === 0;

  return (
    <div className="flex flex-col min-h-full">
      <OrgTopbar crumb="My Events" />

      <div className="px-6 pt-5 pb-8 flex flex-col gap-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-[26px] text-text mb-0.5">My events</h1>
            <p className="text-sm text-text-secondary">Create, monitor, and manage your events.</p>
          </div>
          <Button
            onClick={() => router.push(ROUTES.ORGANIZER_CREATE)}
            className="gap-2 shrink-0"
            aria-label="Create event"
          >
            <Icon name="Plus" size={16} />
            Create event
          </Button>
        </div>

        {isEmpty ? (
          <div className="bg-surface border border-border rounded-lg p-6">
            <EmptyState
              icon="CalendarDays"
              heading="No events yet"
              subtext="Create your first event to start selling tickets."
              cta={
                <Button
                  size="sm"
                  onClick={() => router.push(ROUTES.ORGANIZER_CREATE)}
                  className="mt-1 gap-2"
                >
                  <Icon name="Plus" size={15} />
                  Create event
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Filter tabs */}
            <div
              className="flex gap-1 border-b border-border"
              role="tablist"
              aria-label="Event status filter"
            >
              {EVENT_FILTERS.map((f) => (
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

            {/* Table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Events table">
                  <thead>
                    <tr className="border-b border-border bg-surface-bg">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Event</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Venue</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Tickets sold</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => {
                      const pct = e.sold && e.capacity
                        ? Math.round((e.sold / e.capacity) * 100)
                        : 0;
                      return (
                        <tr
                          key={e.id}
                          className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/50"
                        >
                          <td className="px-5 py-4 font-semibold text-text max-w-[220px] truncate">{e.name}</td>
                          <td className="px-4 py-4 text-text-secondary whitespace-nowrap">{e.date}</td>
                          <td className="px-4 py-4 text-text-muted max-w-[160px] truncate">{e.venue}</td>
                          <td className="px-4 py-4">
                            {e.status === "Draft" ? (
                              <span className="text-text-muted">—</span>
                            ) : (
                              <div className="flex flex-col gap-1.5 min-w-[120px]">
                                <span className="font-mono text-[13px]">
                                  {e.sold.toLocaleString()} / {e.capacity.toLocaleString()}
                                </span>
                                <div className="h-1.5 rounded-pill bg-border overflow-hidden w-28">
                                  <div
                                    className={cn("h-full rounded-pill transition-[width]", progressColor(pct))}
                                    style={{ width: `${pct}%` }}
                                    role="progressbar"
                                    aria-valuenow={pct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={`${pct}% sold`}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <StatusPill status={e.status as Parameters<typeof StatusPill>[0]["status"]} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => router.push(`/organizer/events/${e.id}`)}
                                aria-label={`View ${e.name}`}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                              >
                                <Icon name="Eye" size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Edit ${e.name}`}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                              >
                                <Icon name="Pencil" size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label={`Archive ${e.name}`}
                                className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                              >
                                <Icon name="Archive" size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-bg">
                <span className="text-xs text-text-muted">
                  Showing {rows.length} of {allRows.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    aria-label="Previous page"
                    className="w-7 h-7 rounded border border-border inline-flex items-center justify-center text-text-secondary disabled:opacity-40"
                  >
                    <Icon name="ChevronLeft" size={15} />
                  </button>
                  <button
                    type="button"
                    aria-current="page"
                    className="w-7 h-7 rounded border bg-brand-navy text-white border-brand-navy text-xs font-semibold inline-flex items-center justify-center"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    aria-label="Next page"
                    className="w-7 h-7 rounded border border-border inline-flex items-center justify-center text-text-secondary hover:border-brand-navy/30"
                  >
                    <Icon name="ChevronRight" size={15} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
