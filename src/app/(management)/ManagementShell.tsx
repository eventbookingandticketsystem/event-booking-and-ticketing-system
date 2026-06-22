"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { OrgSidebar } from "@/components/Organizer/OrgSidebar";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { type icons } from "lucide-react";
import { useCurrentUser } from "@/lib/api/hooks/useCurrentUser";
import { initials } from "@/components/Organizer/OrgTopbar";

interface NavItem { id: string; label: string; icon: keyof typeof icons; route: string; }

const MOBILE_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", route: "/organizer" },
  { id: "events",    label: "Events",    icon: "CalendarDays",    route: "/organizer/events" },
  { id: "create",    label: "Create",    icon: "CirclePlus",      route: "/organizer/events/create" },
  { id: "agents",    label: "Agents",    icon: "Users",           route: "/organizer/gate-agents" },
  { id: "reports",   label: "Reports",   icon: "ChartBar",        route: "/organizer/reports" },
];

const NAV_ROUTES: Record<string, string> = {
  dashboard: "/organizer", events: "/organizer/events", create: "/organizer/events/create",
  agents: "/organizer/gate-agents", reports: "/organizer/reports", settings: "/organizer/settings",
};

const NAV_LABELS: Record<string, string> = {
  dashboard: "Dashboard", events: "My Events", create: "Create Event",
  agents: "Gate Agents", reports: "Reports", settings: "Settings",
};

function getActiveNav(pathname: string): string {
  if (pathname.startsWith("/organizer/events/create")) return "create";
  if (pathname.startsWith("/organizer/events"))        return "events";
  if (pathname.startsWith("/organizer/gate-agents"))   return "agents";
  if (pathname.startsWith("/organizer/reports"))       return "reports";
  if (pathname.startsWith("/organizer/settings"))      return "settings";
  return "dashboard";
}

interface MobileTopBarProps { label: string; user?: { name: string | null; image: string | null } | null; }

function MobileTopBar({ label, user }: MobileTopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-sm bg-brand-orange inline-flex items-center justify-center shrink-0">
          <Icon name="Ticket" size={14} className="text-white" />
        </span>
        <span className="font-display font-bold text-[15px] text-text leading-none">Tiketi</span>
      </div>
      <span className="font-display font-semibold text-[15px] text-text absolute left-1/2 -translate-x-1/2 pointer-events-none">{label}</span>
      <div className="flex items-center gap-2">
        {user?.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={user.image} alt={user.name ?? "User avatar"} className="w-8 h-8 rounded-full object-cover shrink-0 border border-border" />
          : <div className="w-8 h-8 rounded-full bg-brand-navy inline-flex items-center justify-center text-[12px] font-bold text-white font-body shrink-0" aria-label={user?.name ?? "User avatar"}>{initials(user?.name)}</div>
        }
      </div>
    </header>
  );
}

function MobileBottomNav({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <nav className="grid border-t border-border bg-surface shrink-0 px-1 py-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]"
      style={{ gridTemplateColumns: `repeat(${MOBILE_NAV.length}, 1fr)` }}
      aria-label="Organizer navigation">
      {MOBILE_NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button key={item.id} type="button" onClick={() => onNav(item.id)}
            aria-current={isActive ? "page" : undefined} aria-label={item.label}
            className={cn(
              "flex flex-col items-center gap-[3px] py-2 px-1 text-[11px] font-semibold font-body rounded-sm transition-colors",
              isActive ? "text-brand-orange" : "text-text-muted hover:text-text-secondary",
            )}>
            <Icon name={item.icon} size={21} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function ManagementShell({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const activeNav  = getActiveNav(pathname);
  const { data: currentUser } = useCurrentUser();
  const user = currentUser ? { name: currentUser.name, image: currentUser.image } : null;
  const handleNav  = (id: string) => { const route = NAV_ROUTES[id]; if (route) router.push(route); };
  const pageLabel  = NAV_LABELS[activeNav] ?? "Dashboard";

  return (
    <>
      <div className="flex lg:hidden flex-col min-h-screen bg-surface-bg">
        <div className="sticky top-0 z-20"><MobileTopBar label={pageLabel} user={user} /></div>
        <main className="flex-1 overflow-y-auto pb-16">{children}</main>
        <div className="fixed bottom-0 left-0 right-0 z-30"><MobileBottomNav active={activeNav} onNav={handleNav} /></div>
      </div>
      <div className="hidden lg:flex h-screen overflow-hidden w-full">
        <div className="fixed top-0 left-0 h-screen z-30">
          <OrgSidebar active={activeNav} onNav={handleNav} user={user} />
        </div>
        <div className="flex flex-col flex-1 ml-[220px] h-screen overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-surface-bg">{children}</main>
        </div>
      </div>
    </>
  );
}
