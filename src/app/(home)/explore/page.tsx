'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Home/Navbar";
import { ExploreFilters } from "@/components/Home/ExploreFilters";
import { ExploreCard } from "@/components/Shared/ExploreCard";
import { EmptyState } from "@/components/Shared/EmptyState";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import {
  EXPLORE_EVENTS,
  EXPLORE_CATEGORIES,
  EXPLORE_TIMES,
} from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

// Skeleton card for explore page (3:4 dark)
function ExploreCardSkeleton({ fixed = false }: { fixed?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden aspect-[3/4]",
        fixed ? "flex-none w-[248px]" : "w-full",
      )}
      style={{ background: "#0e1c29" }}
    >
      <div className="absolute inset-0 skeleton" style={{ borderRadius: 12 }} />
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTime, setActiveTime] = useState("");
  const [city, setCity] = useState("Juba");
  const [search, setSearch] = useState("");

  // Simulate brief data-load delay
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Filter logic: AND — all active filters must match
  const filtered = EXPLORE_EVENTS.filter((ev) => {
    const catMatch  = activeCategory === "All" || ev.category === activeCategory;
    const timeMatch = !activeTime || ev.times.includes(activeTime);
    const searchMatch = !search.trim() ||
      ev.title.toLowerCase().includes(search.trim().toLowerCase());
    return catMatch && timeMatch && searchMatch;
  });

  const happeningNow = filtered.filter((e) => e.status === "happening-now");
  const upcoming     = filtered.filter((e) => e.status !== "happening-now");

  const handleOpenEvent = (id: string) => router.push(ROUTES.EXPLORE_EVENT(id));
  const handleSignIn    = () => router.push(ROUTES.LOGIN);
  const handleRegister  = () => router.push(ROUTES.REGISTER);
  const handleExplore   = () => router.push(ROUTES.EXPLORE);

  const clearFilters = () => {
    setActiveCategory("All");
    setActiveTime("");
    setSearch("");
  };

  return (
    <div className="min-h-screen" style={{ background: "#060F18", color: "#fff" }}>
      <Navbar
        onSignIn={handleSignIn}
        onRegister={handleRegister}
        onExplore={handleExplore}
        exploreActive
      />

      <ExploreFilters
        categories={EXPLORE_CATEGORIES}
        times={EXPLORE_TIMES}
        activeCategory={activeCategory}
        activeTime={activeTime}
        city={city}
        search={search}
        onCategory={setActiveCategory}
        onTime={setActiveTime}
        onCity={setCity}
        onSearch={setSearch}
      />

      <main className="max-w-[1180px] mx-auto px-7 py-7">
        {/* Loading skeleton */}
        {loading && (
          <>
            {/* Active events skeleton */}
            <div className="mb-9">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-[22px] text-white flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-orange shadow-[0_0_0_4px_rgba(255,90,0,0.25)]" />
                  Active Events
                </h2>
              </div>
              <div
                className="flex gap-[18px] overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <ExploreCardSkeleton key={i} fixed />
                ))}
              </div>
            </div>
            {/* Upcoming skeleton */}
            <div>
              <div className="mb-4">
                <h2 className="font-display font-bold text-[22px] text-white">
                  Upcoming Events
                </h2>
              </div>
              <div className="grid grid-cols-4 gap-[18px] max-md:grid-cols-2 max-sm:grid-cols-1">
                {[0, 1, 2, 3].map((i) => (
                  <ExploreCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Loaded state */}
        {!loading && filtered.length === 0 && (
          <div
            className="max-w-[520px] mx-auto mt-10 rounded-xl p-8 text-center"
            style={{ background: "rgba(14,28,41,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <EmptyState
              icon="CalendarX2"
              heading={`No events found in ${city === "All Cities" ? "any city" : city}`}
              subtext="Try a different city or category."
              dark
              cta={
                <Button size="sm" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              }
            />
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            {/* Active / Happening Now */}
            {happeningNow.length > 0 && (
              <section className="mb-9" aria-labelledby="active-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    id="active-heading"
                    className="font-display font-bold text-[22px] text-white flex items-center gap-2.5"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-brand-orange"
                      style={{ boxShadow: "0 0 0 4px rgba(255,90,0,0.25)" }}
                      aria-hidden="true"
                    />
                    Active Events
                  </h2>
                </div>
                <div
                  className="flex gap-[18px] overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
                >
                  {happeningNow.map((ev) => (
                    <ExploreCard
                      key={ev.id}
                      event={ev}
                      fixed
                      onClick={() => handleOpenEvent(ev.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section aria-labelledby="upcoming-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    id="upcoming-heading"
                    className="font-display font-bold text-[22px] text-white"
                  >
                    Upcoming Events
                  </h2>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                  >
                    See all
                    <Icon name="ArrowRight" size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-[18px] max-md:grid-cols-2 max-sm:grid-cols-1">
                  {upcoming.map((ev) => (
                    <ExploreCard
                      key={ev.id}
                      event={ev}
                      onClick={() => handleOpenEvent(ev.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
