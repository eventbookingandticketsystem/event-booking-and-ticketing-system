'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Shared/Icon";
import { EventCard } from "@/components/Shared/EventCard";
import { SkeletonCard } from "@/components/Shared/SkeletonCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/Shared/Button";
import { EVENTS } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Concert", "Football", "Conference", "Graduation"] as const;
type Filter = (typeof FILTERS)[number];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDiscover = searchParams.get("tab") === "discover";

  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const featured = EVENTS.find((e) => e.featured);
  const filtered = EVENTS.filter((e) => {
    const catMatch = filter === "All" || e.category === filter;
    const searchMatch =
      !search.trim() ||
      e.title.toLowerCase().includes(search.trim().toLowerCase());
    return catMatch && searchMatch;
  });
  const upcoming = filter === "All" ? filtered.filter((e) => !e.featured) : filtered;
  const isEmpty = !loading && filtered.length === 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar — mobile only (desktop shell topbar shows the title) */}
      <div className="flex md:hidden items-center gap-3 px-[18px] pt-4 pb-3 bg-surface border-b border-border shrink-0">
        <h1 className="font-display font-semibold text-[22px] text-text flex-1 m-0">
          {isDiscover ? "Discover" : "Discover"}
        </h1>
        <button
          type="button"
          aria-label="Notifications"
          className="w-[38px] h-[38px] rounded-full bg-surface-bg text-text inline-flex items-center justify-center hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name="Bell" size={19} />
        </button>
      </div>

      {/* Content wrapper — centred on desktop */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8">
        {/* Search bar */}
        <div className="mt-4 md:mt-6">
          <div className="flex items-center gap-2.5 h-[46px] px-3.5 bg-surface-bg border border-border rounded-md">
            <Icon name="Search" size={18} className="text-text-muted shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              aria-label="Search events"
              className="flex-1 border-none outline-none bg-transparent text-[15px] text-text font-body placeholder:text-text-muted min-w-0"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div
          className="flex gap-2 overflow-x-auto py-3.5 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
          role="tablist"
          aria-label="Event categories"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-none h-[34px] px-[15px] rounded-pill border text-[13px] font-semibold font-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                filter === f
                  ? "bg-brand-navy border-brand-navy text-white"
                  : "bg-white border-border text-text-secondary hover:border-brand-navy/30",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="pb-8">
          {loading ? (
            <>
              <SkeletonCard variant="event" className="mb-3" />
              <div className="h-5 w-36 skeleton rounded mb-3 mt-5" />
              <div className="flex flex-col gap-3">
                <SkeletonCard variant="event" />
                <SkeletonCard variant="event" />
                <SkeletonCard variant="event" />
              </div>
            </>
          ) : isEmpty ? (
            <EmptyState
              icon="CalendarSearch"
              heading="No events found"
              subtext="No events match this filter right now."
              cta={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setFilter("All"); setSearch(""); }}
                  className="mt-1"
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              {/* Featured hero card */}
              {filter === "All" && !isDiscover && featured && (
                <EventCard
                  event={featured}
                  featured
                  onClick={() => router.push(ROUTES.EVENT_DETAIL(featured.id))}
                  className="mb-5 w-full"
                />
              )}

              {/* Section heading */}
              <h2 className="font-display font-semibold text-[17px] text-text mb-3 mt-1">
                {isDiscover ? "Browse all events" : filter === "All" ? "Upcoming events" : filter}
              </h2>

              {/* Event list — 2-col grid on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcoming.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onClick={() => router.push(ROUTES.EVENT_DETAIL(ev.id))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pt-4 pb-6 flex flex-col gap-3">
        <div className="h-[46px] skeleton rounded-md mb-2" />
        <div className="flex gap-2 mb-2">
          {[0,1,2,3,4].map(i => <div key={i} className="h-[34px] w-24 skeleton rounded-pill" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SkeletonCard variant="event" />
          <SkeletonCard variant="event" />
          <SkeletonCard variant="event" />
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
