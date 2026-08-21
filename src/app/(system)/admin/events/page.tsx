'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "@/components/Shared/StatusPill";
import { EmptyState } from "@/components/Shared/EmptyState";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { Modal } from "@/components/Shared/Modal";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { useAdminEvents, useUpdateAdminEvent, useDeleteAdminEvent } from "@/lib/api/hooks/useAdminData";
import type { AdminEventRow } from "@/types/event";

type FilterTab = "All" | "Upcoming" | "Ongoing" | "Completed" | "Flagged";

const FILTER_TABS: FilterTab[] = ["All", "Upcoming", "Ongoing", "Completed", "Flagged"];

const FILTER_TO_STATUS: Record<FilterTab, string | undefined> = {
  All:       undefined,
  Upcoming:  "PUBLISHED",
  Ongoing:   "ONGOING",
  Completed: "COMPLETED",
  Flagged:   undefined,  // all statuses, then filter flagged === true client-side
};

// Wraps whichever event row is pending a flag toggle so PATCH targets the right id.
function FlagToggleButton({ event }: { event: AdminEventRow }) {
  const updateEvent = useUpdateAdminEvent(event.id);

  return (
    <button
      type="button"
      aria-label={event.flagged ? `Unflag ${event.name}` : `Flag ${event.name}`}
      aria-pressed={event.flagged}
      disabled={updateEvent.isPending}
      onClick={() => updateEvent.mutate({ flagged: !event.flagged })}
      className={cn(
        "w-8 h-8 rounded border inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning disabled:opacity-50",
        event.flagged
          ? "border-status-warning/40 text-status-warning bg-status-warning-bg"
          : "border-border text-text-secondary hover:border-status-warning/40 hover:text-status-warning",
      )}
    >
      <Icon name="Flag" size={15} />
    </button>
  );
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [filter,       setFilter]       = useState<FilterTab>("All");
  const [q,            setQ]            = useState("");
  const [removeTarget, setRemoveTarget] = useState<AdminEventRow | null>(null);

  const { data: result, isLoading, isError, error } = useAdminEvents({
    status: FILTER_TO_STATUS[filter],
    search: q || undefined,
    limit:  50,
  });

  const deleteEvent = useDeleteAdminEvent(removeTarget?.id ?? "");

  const allRows = result?.data ?? [];

  const rows: AdminEventRow[] = filter === "Flagged"
    ? allRows.filter((e) => e.flagged)
    : allRows;

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await deleteEvent.mutateAsync();
      setRemoveTarget(null);
    } catch {
      // Error shown in modal via deleteEvent.isError
    }
  };

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
                      <td className="px-5 py-3.5 font-semibold">
                        <div className="flex items-center gap-2">
                          {e.flagged && <Icon name="Flag" size={13} className="text-status-warning shrink-0" />}
                          {e.name}
                        </div>
                      </td>
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
                            onClick={() => router.push(`/explore/${e.id}`)}
                            className="w-8 h-8 rounded border border-border text-text-secondary inline-flex items-center justify-center hover:border-brand-orange/40 hover:text-brand-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                          >
                            <Icon name="Eye" size={15} />
                          </button>
                          <FlagToggleButton event={e} />
                          <button
                            type="button"
                            aria-label={`Remove ${e.name}`}
                            onClick={() => setRemoveTarget(e)}
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

      {/* Remove confirm modal */}
      {removeTarget && (
        <Modal
          open
          title={`Remove ${removeTarget.name}?`}
          description="This permanently deletes the event and all its ticket tiers, bookings, and tickets."
          onClose={() => { if (!deleteEvent.isPending) { setRemoveTarget(null); deleteEvent.reset(); } }}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => { setRemoveTarget(null); deleteEvent.reset(); }}
                disabled={deleteEvent.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="gap-2"
                onClick={confirmRemove}
                disabled={deleteEvent.isPending}
              >
                {deleteEvent.isPending ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={15} />
                    Remove event
                  </>
                )}
              </Button>
            </>
          }
        >
          {deleteEvent.isError ? (
            <AlertBanner
              tone="danger"
              title="Could not remove event"
              message={deleteEvent.error?.message ?? "Please try again."}
            />
          ) : (
            <AlertBanner tone="danger" title="Irreversible action" message="All ticket data for this event will be permanently removed." />
          )}
        </Modal>
      )}
    </div>
  );
}
