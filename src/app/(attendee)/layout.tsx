'use client';

import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@/components/Shared/Icon";
import { BottomNav, type AttendeeTab } from "@/components/Attendee/BottomNav";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { type icons } from "lucide-react";

// ── Shared helpers ────────────────────────────────────────────────────────────

function getActiveTab(pathname: string): AttendeeTab {
  if (pathname.startsWith("/dashboard/tickets")) return "tickets";
  if (pathname.startsWith("/dashboard/account"))  return "account";
  if (pathname.includes("?tab=discover"))          return "discover";
  return "home";
}

function tabRoute(tab: AttendeeTab): string {
  switch (tab) {
    case "home":     return ROUTES.DASHBOARD;
    case "discover": return ROUTES.DASHBOARD + "?tab=discover";
    case "tickets":  return ROUTES.TICKETS;
    case "account":  return ROUTES.ACCOUNT;
  }
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

interface SidebarItem {
  id: AttendeeTab;
  label: string;
  icon: keyof typeof icons;
}

const SIDEBAR_NAV: SidebarItem[] = [
  { id: "home",     label: "Home",       icon: "House"   },
  { id: "discover", label: "Discover",   icon: "Compass" },
  { id: "tickets",  label: "My Tickets", icon: "Ticket"  },
  { id: "account",  label: "Account",    icon: "User"    },
];

function AttendeeSidebar({
  active,
  onNav,
}: {
  active: AttendeeTab;
  onNav: (tab: AttendeeTab) => void;
}) {
  const router = useRouter();

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-brand-navy shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 mb-1">
        <span className="w-8 h-8 rounded-sm bg-brand-orange inline-flex items-center justify-center shrink-0">
          <Icon name="Ticket" size={17} className="text-white" />
        </span>
        <div>
          <div className="font-display font-bold text-[16px] text-white leading-none">Tiketi</div>
          <div className="text-[11px] text-white/50 mt-0.5 font-body">Attendee</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5" aria-label="Attendee navigation">
        {SIDEBAR_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNav(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-[14px] font-semibold font-body transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/6",
              )}
            >
              <Icon name={item.icon} size={18} className="shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer — home + sign out */}
      <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-white/10 pt-4">
        {/* Back to home */}
        <button
          type="button"
          onClick={() => router.push(ROUTES.HOME)}
          aria-label="Back to home page"
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-[14px] font-semibold font-body transition-colors text-left text-white/60 hover:text-white hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Icon name="House" size={18} className="shrink-0" />
          Home page
        </button>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          aria-label="Sign out"
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-[14px] font-semibold font-body transition-colors text-left text-red-400 hover:text-red-300 hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Icon name="LogOut" size={18} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Desktop top bar ───────────────────────────────────────────────────────────

const TAB_LABELS: Record<AttendeeTab, string> = {
  home:     "Home",
  discover: "Discover",
  tickets:  "My Tickets",
  account:  "Account",
};

function AttendeeTopbar({ active }: { active: AttendeeTab }) {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-surface shrink-0">
      <span className="font-display font-semibold text-[17px] text-text">
        {TAB_LABELS[active]}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-full bg-surface-bg text-text-secondary inline-flex items-center justify-center hover:bg-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Icon name="Bell" size={18} />
        </button>
        <div
          className="w-8 h-8 rounded-full bg-brand-navy inline-flex items-center justify-center text-[13px] font-bold text-white font-body shrink-0"
          aria-label="Attendee profile"
        >
          AD
        </div>
      </div>
    </header>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  const handleTab = (tab: AttendeeTab) => {
    router.push(tabRoute(tab));
  };

  return (
    <>
      {/* ── MOBILE (< 768px) — unchanged narrow phone shell ── */}
      <div className="flex md:hidden min-h-screen bg-surface-bg flex-col items-center">
        <div className="w-full max-w-[390px] flex flex-col min-h-screen bg-surface-bg relative">
          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto pb-16">
            {children}
          </main>
          {/* Fixed bottom nav */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-30">
            <BottomNav activeTab={activeTab} onTab={handleTab} />
          </div>
        </div>
      </div>

      {/* ── DESKTOP (≥ 768px) — full-width sidebar shell ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-surface-bg">
        {/* Sidebar — sticky full height */}
        <AttendeeSidebar active={activeTab} onNav={handleTab} />
        {/* Right column: topbar fixed + scrollable content */}
        <div className="flex flex-col flex-1 min-w-0 h-screen">
          <AttendeeTopbar active={activeTab} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
