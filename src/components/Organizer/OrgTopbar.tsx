'use client';

import { Icon } from "@/components/Shared/Icon";

export interface UserMini {
  name: string | null;
  image: string | null;
}

interface OrgTopbarProps {
  crumb: string;
  eventName?: string;
  onEvent?: () => void;
  user?: UserMini | null;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OrgTopbar({ crumb, eventName, onEvent, user }: OrgTopbarProps) {
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
        {eventName && onEvent && (
          <button
            type="button"
            onClick={onEvent}
            aria-label={`Selected event: ${eventName}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface-bg text-sm text-text hover:border-brand-orange/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            <Icon name="Calendar" size={15} className="text-text-secondary" />
            <span className="font-medium">{eventName}</span>
            <Icon name="ChevronDown" size={14} className="text-text-secondary" />
          </button>
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
