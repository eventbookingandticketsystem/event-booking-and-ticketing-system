'use client';

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { EXPLORE_CITIES } from "@/lib/mock-data";

interface TimeOption {
  id: string;
  label: string;
}

interface ExploreFiltersProps {
  categories: string[];
  times: TimeOption[];
  activeCategory: string;
  activeTime: string;
  city: string;
  search: string;
  onCategory: (cat: string) => void;
  onTime: (time: string) => void;
  onCity: (city: string) => void;
  onSearch: (q: string) => void;
}

export function ExploreFilters({
  categories,
  times,
  activeCategory,
  activeTime,
  city,
  search,
  onCategory,
  onTime,
  onCity,
  onSearch,
}: ExploreFiltersProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Close city dropdown on outside click
  useEffect(() => {
    if (!cityOpen) return;
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cityOpen]);

  const anyFilter = activeCategory !== "All" || activeTime !== "" || search.trim() !== "";

  return (
    <div
      className="sticky top-16 z-30 border-b py-4 px-7"
      style={{
        background: "rgba(6,15,24,0.94)",
        backdropFilter: "blur(8px)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {/* Row 1: city + search */}
      <div className="flex items-center gap-5 max-w-[1180px] mx-auto mb-3.5 max-md:flex-col max-md:items-stretch max-md:gap-3">
        {/* City selector */}
        <div ref={cityRef} className="relative flex items-center gap-2.5 shrink-0 max-md:justify-between">
          <span className="text-sm text-white/50">Showing events in</span>
          <button
            type="button"
            onClick={() => setCityOpen((o) => !o)}
            aria-label="Select city"
            aria-expanded={cityOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-[9px] px-3.5 py-2 rounded-pill text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <Icon name="MapPin" size={14} className="text-white/60" aria-hidden="true" />
            {city === "All Cities" ? "All Cities" : city}
            <Icon name="ChevronDown" size={15} />
          </button>

          {/* City dropdown */}
          {cityOpen && (
            <div
              role="listbox"
              aria-label="Select city"
              className="absolute top-[calc(100%+8px)] left-0 z-40 w-[220px] rounded-md shadow-pop overflow-hidden p-1.5"
              style={{ background: "#0e1c29", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {EXPLORE_CITIES.map((c) => (
                <button
                  key={c}
                  role="option"
                  aria-selected={c === city}
                  type="button"
                  onClick={() => { onCity(c); setCityOpen(false); }}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-[11px] rounded-sm text-sm font-medium text-white/80 hover:bg-white/6 focus-visible:outline-none focus-visible:bg-white/6",
                    c === city && "text-white",
                  )}
                >
                  {c}
                  {c === city && <Icon name="Check" size={15} className="text-brand-orange" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div
          className="flex-1 flex items-center gap-2.5 h-[46px] px-4 rounded-pill"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <Icon name="Search" size={18} className="text-white/30 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search events, organizers..."
            aria-label="Search events"
            className="flex-1 border-none outline-none bg-transparent text-[15px] text-white min-w-0 font-body placeholder:text-white/25"
          />
        </div>
      </div>

      {/* Row 2: category chips */}
      <div
        className="flex gap-[9px] overflow-x-auto scrollbar-none max-w-[1180px] mx-auto pb-0.5"
        style={{ scrollbarWidth: "none" }}
        role="group"
        aria-label="Filter by category"
      >
        {categories.map((cat) => {
          const isOn = cat === "All" ? activeCategory === "All" : activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategory(cat)}
              aria-pressed={isOn}
              className={cn(
                "flex-none h-9 px-4 rounded-pill text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                isOn
                  ? "bg-brand-orange border border-brand-orange text-white"
                  : "bg-transparent text-white/50 hover:text-white hover:border-white/32",
              )}
              style={!isOn ? { border: "1px solid rgba(255,255,255,0.16)" } : undefined}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Row 3: time chips + date sort */}
      <div className="flex items-center gap-4 mt-3 max-w-[1180px] mx-auto max-sm:flex-col max-sm:items-stretch">
        <div
          className="flex flex-1 gap-[9px] overflow-x-auto scrollbar-none pb-0.5"
          style={{ scrollbarWidth: "none" }}
          role="group"
          aria-label="Filter by time"
        >
          {times.map((t) => {
            const isOn = activeTime === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTime(isOn ? "" : t.id)}
                aria-pressed={isOn}
                className={cn(
                  "flex-none h-9 px-4 rounded-pill text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
                  isOn
                    ? "bg-brand-orange border border-brand-orange text-white"
                    : "bg-transparent text-white/50 hover:text-white hover:border-white/32",
                )}
                style={!isOn ? { border: "1px solid rgba(255,255,255,0.16)" } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Date sort toggle */}
        <button
          type="button"
          aria-label="Sort by date"
          className="flex-none inline-flex items-center gap-[7px] h-9 px-3.5 rounded-pill text-[13px] font-semibold text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          style={{ border: "1px solid rgba(255,255,255,0.16)" }}
        >
          <Icon name="Calendar" size={15} />
          Date
          <Icon name="ArrowDown" size={14} />
        </button>
      </div>

      {/* Clear filters */}
      {anyFilter && (
        <div className="max-w-[1180px] mx-auto mt-3.5">
          <button
            type="button"
            onClick={() => {
              onCategory("All");
              onTime("");
              onSearch("");
            }}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
          >
            <Icon name="X" size={14} />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
