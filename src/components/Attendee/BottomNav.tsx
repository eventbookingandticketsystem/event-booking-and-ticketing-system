'use client';

import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { type LucideProps, icons } from "lucide-react";

export type AttendeeTab = "home" | "discover" | "tickets" | "account";

const ATTENDEE_TABS: { id: AttendeeTab; label: string; icon: keyof typeof icons }[] = [
  { id: "home",    label: "Home",       icon: "House"   },
  { id: "discover",label: "Discover",   icon: "Compass" },
  { id: "tickets", label: "My Tickets", icon: "Ticket"  },
  { id: "account", label: "Account",    icon: "User"    },
];

interface BottomNavProps {
  activeTab: AttendeeTab;
  onTab: (tab: AttendeeTab) => void;
}

export function BottomNav({ activeTab, onTab }: BottomNavProps) {
  return (
    <nav
      className="grid grid-cols-4 border-t border-border bg-surface shrink-0 px-1 py-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]"
      aria-label="Primary navigation"
    >
      {ATTENDEE_TABS.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={t.label}
            className={cn(
              "flex flex-col items-center gap-[3px] py-2 px-1 border-none bg-transparent text-[11px] font-semibold font-body rounded-sm transition-colors",
              isActive ? "text-brand-orange" : "text-text-muted hover:text-text-secondary",
            )}
          >
            <Icon name={t.icon} size={21} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
