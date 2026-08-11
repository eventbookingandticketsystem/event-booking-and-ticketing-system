"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AdminSidebar } from "@/components/Admin/AdminSidebar";
import { AdminTopbar } from "@/components/Admin/AdminTopbar";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { type icons } from "lucide-react";

interface NavItem { id: string; label: string; icon: keyof typeof icons; route: string; }

const ADMIN_NAV: NavItem[] = [
  { id: "overview",   label: "Overview",     icon: "LayoutDashboard", route: ROUTES.ADMIN             },
  { id: "organizers", label: "Orgs",         icon: "Building2",       route: ROUTES.ADMIN_ORGANIZERS  },
  { id: "events",     label: "Events",       icon: "CalendarDays",    route: ROUTES.ADMIN_EVENTS      },
  { id: "gateagents", label: "Agents",       icon: "Users",           route: ROUTES.ADMIN_GATE_AGENTS },
  { id: "health",     label: "Health",       icon: "Activity",        route: ROUTES.ADMIN_HEALTH      },
  { id: "settings",   label: "Settings",     icon: "Settings",        route: ROUTES.ADMIN_SETTINGS    },
];

function pathToNav(pathname: string): string {
  if (pathname.startsWith("/admin/organizers")) return "organizers";
  if (pathname.startsWith("/admin/events"))     return "events";
  if (pathname.startsWith("/admin/gate-agents")) return "gateagents";
  if (pathname.startsWith("/admin/health"))     return "health";
  if (pathname.startsWith("/admin/settings"))   return "settings";
  return "overview";
}

const NAV_LABELS: Record<string, string> = {
  overview: "Overview", organizers: "Organizers", events: "Events",
  gateagents: "Gate Agents", health: "System Health", settings: "Settings",
};

function MobileTopBar({ label }: { label: string }) {
  return (
    <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border shrink-0 relative">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-sm bg-brand-orange inline-flex items-center justify-center shrink-0">
          <Icon name="Ticket" size={14} className="text-white" />
        </span>
        <span className="font-display font-bold text-[15px] text-text leading-none">Tiketi</span>
      </div>
      <span className="font-display font-semibold text-[15px] text-text absolute left-1/2 -translate-x-1/2 pointer-events-none">{label}</span>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-status-danger-bg text-status-danger font-body">Admin</span>
        <button type="button" aria-label="Sign out"
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          className="w-8 h-8 rounded-full bg-brand-navy inline-flex items-center justify-center text-[12px] font-bold text-white font-body shrink-0 hover:bg-brand-navy-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
          SA
        </button>
      </div>
    </header>
  );
}

function MobileBottomNav({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <nav className="grid grid-cols-6 border-t border-border bg-surface shrink-0 px-1 py-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]"
      aria-label="Admin navigation">
      {ADMIN_NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button key={item.id} type="button" onClick={() => onNav(item.id)}
            aria-current={isActive ? "page" : undefined} aria-label={item.label}
            className={cn(
              "flex flex-col items-center gap-0.75 py-2 px-0.5 text-[10px] font-semibold font-body rounded-sm transition-colors",
              isActive ? "text-brand-orange" : "text-text-muted hover:text-text-secondary",
            )}>
            <Icon name={item.icon} size={20} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export default function SystemShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const nav      = pathToNav(pathname);
  const crumb    = NAV_LABELS[nav] ?? "Overview";

  const handleNav = (id: string) => {
    const item = ADMIN_NAV.find((n) => n.id === id);
    if (item) router.push(item.route);
  };

  return (
    <>
      <div className="flex lg:hidden flex-col min-h-screen bg-surface-bg">
        <div className="sticky top-0 z-20"><MobileTopBar label={crumb} /></div>
        <main className="flex-1 overflow-y-auto pb-16">{children}</main>
        <div className="fixed bottom-0 left-0 right-0 z-30"><MobileBottomNav active={nav} onNav={handleNav} /></div>
      </div>
      <div className="hidden lg:flex h-screen overflow-hidden bg-surface-bg">
        <AdminSidebar active={nav} onNav={handleNav} />
        <div className="flex flex-col flex-1 min-w-0 h-screen">
          <AdminTopbar crumb={crumb} onCrumbRoot={() => router.push(ROUTES.ADMIN)} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
