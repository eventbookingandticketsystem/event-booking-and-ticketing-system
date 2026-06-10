"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExploreCard } from "@/components/Shared/ExploreCard";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { EXPLORE_EVENTS } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Music",
  "Sports",
  "Conference",
  "Church",
  "Graduation",
  "Food & Drinks",
  "Arts & Culture",
] as const;
type Category = (typeof CATEGORIES)[number];

const INITIAL_VISIBLE = 8;

export function FeaturedEvents() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [showAll, setShowAll] = useState(false);

  const filtered =
    activeCategory === "All"
      ? EXPLORE_EVENTS
      : EXPLORE_EVENTS.filter((e) => e.category === activeCategory);

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE && !showAll;

  // Reset "show all" when category changes
  const handleCategory = (cat: Category) => {
    setActiveCategory(cat);
    setShowAll(false);
  };

  return (
    <section className="py-[72px] bg-surface-bg">
      <div className="max-w-[1120px] mx-auto px-7">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[12px] font-semibold tracking-[1.2px] uppercase text-brand-orange block mb-2">
              Live &amp; Upcoming
            </span>
            <h2 className="font-display font-bold text-[32px] tracking-[-0.6px] text-text m-0 max-md:text-[26px]">
              Events happening now
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(ROUTES.EXPLORE)}
            className="gap-1.5 shrink-0"
            aria-label="Browse all events on the explore page"
          >
            Browse all
            <Icon name="ArrowRight" size={15} />
          </Button>
        </div>

        {/* Category filter chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-none"
          style={{ scrollbarWidth: "none" }}
          role="tablist"
          aria-label="Filter events by category"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => handleCategory(cat)}
              className={cn(
                "flex-none h-[34px] px-[15px] rounded-pill border text-[13px] font-semibold font-body transition-colors whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                activeCategory === cat
                  ? "bg-brand-navy border-brand-navy text-white"
                  : "bg-surface border-border text-text-secondary hover:border-brand-navy/30 hover:text-text",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-surface border border-border mb-4">
              <Icon
                name="CalendarSearch"
                size={26}
                className="text-text-muted"
              />
            </span>
            <p className="font-display font-semibold text-[17px] text-text mb-1">
              No events in this category
            </p>
            <p className="text-sm text-text-secondary">
              Try a different category or check back soon.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-sm:grid-cols-1">
              {visible.map((ev) => (
                <ExploreCard
                  key={ev.id}
                  event={ev}
                  onClick={() => router.push(ROUTES.EXPLORE_EVENT(ev.id))}
                />
              ))}
            </div>

            {/* View more / Show less */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowAll(true)}
                  className="gap-2 min-w-[200px]"
                  aria-label={`Show all ${filtered.length} events`}
                >
                  <Icon name="ChevronDown" size={18} />
                  View more events
                  <span className="ml-1 inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-[11px] font-bold">
                    +{filtered.length - INITIAL_VISIBLE}
                  </span>
                </Button>
              </div>
            )}

            {showAll && filtered.length > INITIAL_VISIBLE && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowAll(false)}
                  className="gap-2 min-w-[200px]"
                  aria-label="Show fewer events"
                >
                  <Icon name="ChevronUp" size={18} />
                  Show less
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
