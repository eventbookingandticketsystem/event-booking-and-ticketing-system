"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { type icons } from "lucide-react";

// ── Nav config ────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof icons;
  route: string;
}

const AGENT_NAV: NavItem[] = [
  { id: "selector", label: "Events",  icon: "CalendarDays", route: ROUTES.AGENT },
  { id: "scanner",  label: "Scanner", icon: "ScanLine",     route: ROUTES.AGENT_SCAN },
  { id: "cash",     label: "Cash",    icon: "Wallet",       route: ROUTES.AGENT_CASH },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/agent/scanner"))    return "scanner";
  if (pathname.startsWith("/agent/cash-entry")) return "cash";
  return "selector";
}

const PAGE_LABELS: Record<string, string> = {
  selector: "Select Event",
  scanner:  "QR Scanner",
  cash:     "Cash Entry",
};

// ── Mobile top bar ────────────────────────────────────────────────────────

function AgentTopBar({ label }: { label: string }) {
  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-white/8 bg-brand-navy-2/90 shrink-0 z-20 relative">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-sm bg-brand-orange inline-flex items-center justify-center shrink-0">
          <Icon name="ScanLine" size={14} className="text-white" />
        </span>
        <span className="font-display font-bold text-[14px] text-white leading-none">
          Tiketi Gate
        </span>
      </div>

      <span className="font-display font-semibold text-[14px] text-white/80 absolute left-1/2 -translate-x-1/2 pointer-events-none">
        {label}
      </span>

      <button
        type="button"
        onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
        aria-label="Sign out"
        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1 py-1"
      >
        <Icon name="LogOut" size={15} />
        Sign out
      </button>
    </header>
  );
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────

function AgentBottomNav({ active }: { active: string }) {
  const router = useRouter();
  return (
    <nav
      className="grid grid-cols-3 border-t border-white/10 bg-brand-navy shrink-0 px-1 py-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]"
      aria-label="Gate agent navigation"
    >
      {AGENT_NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => router.push(item.route)}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
            className={cn(
              "flex flex-col items-center gap-0.75 py-2 px-1 text-[11px] font-semibold font-body rounded-sm transition-colors",
              isActive ? "text-brand-orange" : "text-white/40 hover:text-white/70",
            )}
          >
            <Icon name={item.icon} size={21} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────────────

function AgentSidebar({ active }: { active: string }) {
  const router = useRouter();
  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-white/8 bg-brand-navy-2/60 p-5 gap-6">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-md bg-brand-orange inline-flex items-center justify-center shrink-0">
          <Icon name="ScanLine" size={18} className="text-white" />
        </span>
        <span className="font-display font-bold text-[16px] text-white">Tiketi Gate</span>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Gate agent navigation">
        {AGENT_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => router.push(item.route)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[14px] font-semibold font-body text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/6",
              )}
            >
              <Icon name={item.icon} size={18} className="shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button
          type="button"
          onClick={() => router.push(ROUTES.HOME)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <Icon name="House" size={16} />
          Home
        </button>
        <button
          type="button"
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-400 hover:bg-white/8 hover:text-red-300 transition-colors"
        >
          <Icon name="LogOut" size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────

export default function ValidationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const pageLabel = PAGE_LABELS[activeTab] ?? "Scanner";

  return (
    <>
      {/* Mobile — top bar + content + bottom nav */}
      <div className="flex md:hidden w-screen h-screen bg-brand-navy flex-col overflow-hidden">
        <AgentTopBar label={pageLabel} />
        <div className="flex-1 overflow-hidden">{children}</div>
        <AgentBottomNav active={activeTab} />
      </div>

      {/* Desktop — sidebar-only, no top bar or bottom nav */}
      <div className="hidden md:flex w-screen h-screen bg-brand-navy overflow-hidden">
        <AgentSidebar active={activeTab} />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
