'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/Organizer/OrgTopbar";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { Modal } from "@/components/Shared/Modal";
import { cn } from "@/lib/utils";
import { useOrgEvents } from "@/lib/api/hooks/useOrgEvents";
import { useDeleteEvent } from "@/lib/api/hooks/useUpdateEvent";
import { ROUTES } from "@/constants/routes";
import type { OrgEventRow } from "@/types/event";

const EVENT_FILTERS = ["All", "Upcoming", "Ongoing", "Completed", "Draft"] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];

const FILTER_TO_STATUS: Record<EventFilter, string | undefined> = {
  All:       undefined,
  Upcoming:  "PUBLISHED",
  Ongoing:   "ONGOING",
  Completed: "COMPLETED",
  Draft:     "DRAFT",
};

function progressColor(pct: number): string {
  if (pct >= 90) return "bg-status-danger";
  if (pct >= 60) return "bg-brand-orange";
  return "bg-status-success";
}

export default function OrgEventsPage() {
  const router = useRouter();
  const [filter,       setFilter]       = useState<EventFilter>("All");
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgEventRow | null>(null);

  const { data: rows, isLoading, isError, error } = useOrgEvents({
    status: FILTER_TO_STATUS[filter],
    limit:  50,
  });
  const displayRows: OrgEventRow[] = rows ?? [];

  // Delete mutation is created per-target; we open a confirm modal first
  const deleteEvent = useDeleteEvent(deleteTarget?.id ?? "");

  const handleNavigate = (id: string) => {
    setNavigatingId(id);
    router.push(`/organizer/events/${id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync();
      setDeleteTarget(null);
    } catch {
      // Error shown inside modal via deleteEvent.isError
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <OrgTopbar crumb="My Events" />
        <div className="px-6 pt-5 pb-8 flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="h-7 w-40 skeleton rounded mb-2" />
              <div className="h-4 w-56 skeleton rounded" />
            </div>
            <div className="h-10 w-32 skeleton rounded" />
          </div>
          <div className="flex flex-col gap-3">
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col min-h-full">
        <OrgTopbar crumb="My Events" />
        <div className="px-6 pt-5">
          <AlertBanner
            tone="danger"
            title="Could not load events"
            message={error?.message ?? "An error occurred. Please try again."}
          />
        </div>
      </div>
    );
  }

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

        {displayRows.length === 0 && filter === "All" ? (
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
            <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Event status filter">
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

            {/* Filtered-empty state */}
            {displayRows.length === 0 && (
              <div className="bg-surface border border-border rounded-lg p-6">
                <EmptyState
                  icon="CalendarDays"
                  heading={`No ${filter.toLowerCase()} events`}
                  subtext="Try a different filter or create a new event."
                />
              </div>
            )}

            {/* Table */}
            {displayRows.length > 0 && (
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
                      {displayRows.map((e) => {
                        const pct = e.sold && e.capacity
                          ? Math.round((e.sold / e.capacity) * 100)
                          : 0;
                        const isNavigating = navigatingId === e.id;
                        return (
                          <tr
                            key={e.id}
                            onClick={() => handleNavigate(e.id)}
                            className="border-b border-border/50 last:border-b-0 hover:bg-surface-bg/80 cursor-pointer transition-colors"
                            role="button"
                            tabIndex={0}
                            aria-label={`View event: ${e.name}`}
                            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") handleNavigate(e.id); }}
                          >
                            {/* Event poster + name */}
                            <td className="px-5 py-3 font-semibold text-text">
                              <div className="flex items-center gap-3">
                                {/* Poster thumbnail */}
                                <div
                                  className="w-12 h-9 rounded shrink-0 overflow-hidden"
                                  style={
                                    e.image
                                      ? { backgroundImage: `url(${e.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                                      : { backgroundImage: e.poster, backgroundSize: "cover" }
                                  }
                                  aria-hidden="true"
                                />
                                <div className="flex items-center gap-2 min-w-0">
                                  {isNavigating && (
                                    <svg className="animate-spin shrink-0 h-3.5 w-3.5 text-brand-orange" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                  )}
                                  <span className="truncate max-w-[180px]">{e.name}</span>
                                </div>
                              </div>
                            </td>
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
                            <td
                              className="px-5 py-4"
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-2">
                                {/* View — same as row click, shown for discoverability */}
                                <button
                                  type="button"
                                  onClick={(ev) => { ev.stopPropagation(); handleNavigate(e.id); }}
                                  aria-label={`View ${e.name}`}
                                  className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                                >
                                  {isNavigating
                                    ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                    : <Icon name="Eye" size={15} />
                                  }
                                </button>
                                {/* Delete / cancel */}
                                <button
                                  type="button"
                                  onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(e); }}
                                  aria-label={`Cancel ${e.name}`}
                                  className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-status-danger/40 hover:text-status-danger transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
                                >
                                  <Icon name="Trash2" size={15} />
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
                    Showing {displayRows.length} event{displayRows.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <Modal
          open
          title="Cancel event?"
          description={`"${deleteTarget.name}" will be marked cancelled and hidden from attendees. This cannot be undone.`}
          onClose={() => { if (!deleteEvent.isPending) { setDeleteTarget(null); deleteEvent.reset(); } }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => { setDeleteTarget(null); deleteEvent.reset(); }}
                disabled={deleteEvent.isPending}
              >
                Keep event
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteEvent.isPending}
                className="gap-2 bg-status-danger hover:bg-status-danger/90 border-status-danger"
                aria-label="Confirm cancel event"
              >
                {deleteEvent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={15} />
                    Yes, cancel event
                  </>
                )}
              </Button>
            </>
          }
        >
          {deleteEvent.isError && (
            <AlertBanner
              tone="danger"
              title="Could not cancel event"
              message={deleteEvent.error?.message ?? "Please try again."}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
