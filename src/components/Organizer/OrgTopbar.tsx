'use client';

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Shared/Icon";

export interface UserMini {
  name: string | null;
  image: string | null;
}

export interface EventOption {
  id: string;
  name: string;
}

interface OrgTopbarProps {
  crumb: string;
  eventName?: string;
  /** All of the organizer's events, for the switcher dropdown. */
  events?: EventOption[];
  /** Currently selected event id, or null/undefined for "All events". */
  selectedEventId?: string | null;
  /** Called with the chosen event id, or null when "All events" is picked. */
  onSelectEvent?: (eventId: string | null) => void;
  user?: UserMini | null;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OrgTopbar({
  crumb,
  eventName,
  events,
  selectedEventId,
  onSelectEvent,
  user,
}: OrgTopbarProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickAway(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const hasSwitcher = !!events && !!onSelectEvent;
  const label = eventName ?? "All events";

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm font-body">
        <span className="text-text-secondary">Organizer</span>
        <Icon name="ChevronRight" size={14} className="text-text-muted" />
        <span className="font-semibold text-text">{crumb}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {hasSwitcher && (
          <div className="relative" ref={wrapRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={`Selected event: ${label}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface-bg text-sm text-text hover:border-brand-orange/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <Icon name="Calendar" size={15} className="text-text-secondary" />
              <span className="font-medium max-w-50 truncate">{label}</span>
              <Icon name="ChevronDown" size={14} className="text-text-secondary" />
            </button>

            {open && (
              <ul
                role="listbox"
                aria-label="Switch event"
                className="absolute right-0 top-full mt-1.5 w-64 max-h-80 overflow-y-auto bg-surface border border-border rounded-md shadow-lg py-1 z-30"
              >
                <li role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={!selectedEventId}
                    onClick={() => {
                      onSelectEvent!(null);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-bg transition-colors flex items-center gap-2 ${
                      !selectedEventId ? "text-brand-orange font-semibold" : "text-text"
                    }`}
                  >
                    <Icon name="LayoutGrid" size={14} className="shrink-0" />
                    <span className="truncate">All events</span>
                  </button>
                </li>
                {events!.length > 0 && (
                  <li role="none" className="my-1 border-t border-border" />
                )}
                {events!.map((ev) => (
                  <li role="none" key={ev.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selectedEventId === ev.id}
                      onClick={() => {
                        onSelectEvent!(ev.id);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-bg transition-colors truncate ${
                        selectedEventId === ev.id ? "text-brand-orange font-semibold" : "text-text"
                      }`}
                    >
                      {ev.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Role badge */}
        <span className="inline-flex items-center px-3 py-1 rounded-pill text-[13px] font-semibold bg-surface-alt text-brand-orange-deep border border-brand-orange/20">
          Organizer
        </span>

        {/* Avatar — real image or initials */}
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? "User avatar"}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-brand-navy text-white inline-flex items-center justify-center text-[13px] font-bold font-body shrink-0"
            aria-label={user?.name ? `User avatar: ${user.name}` : "User avatar"}
          >
            {initials(user?.name)}
          </div>
        )}
      </div>
    </header>
  );
}
