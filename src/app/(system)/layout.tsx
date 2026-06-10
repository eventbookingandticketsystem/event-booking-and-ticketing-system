'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/Admin/AdminSidebar";
import { AdminTopbar } from "@/components/Admin/AdminTopbar";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { type icons } from "lucide-react";

// ── Nav config ────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof icons;
}

const ADMIN_NAV: NavItem[] = [
  { id: "overview",   label: "Overview",      icon: "LayoutDashboard" },
  { id: "organizers", label: "Organizers",    icon: "Building2"       },
  { id: "events",     label: "Events",        icon: "CalendarDays"    },
  { id: "gateagents", label: "Gate Agents",   icon: "Users"           },
  { id: "health",     label: "System Health", icon: "Activity"        },
  { id: "settings",   label: "Settings",      icon: "Settings"        },
];

const NAV_LABELS: Record<string, string> = {
  overview:   "Overview",
  organizers: "Organizers",
  events:     "Events",
  gateagents: "Gate Agents",
  health:     "System Health",
  settings:   "Settings",
};

// ── Mobile top bar ────────────────────────────────────────────────────────

function MobileTopBar({
  label,
  onMenu,
}: {
  label: string;
  onMenu: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-4 h-14 bg-brand-navy border-b border-white/8 shrink-0 relative">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-sm bg-brand-orange inline-flex items-center justify-center shrink-0">
          <Icon name="Ticket" size={15} className="text-white" />
        </span>
        <div className="leading-none">
          <div className="font-display font-bold text-[15px] text-white">Tiketi</div>
        </div>
      </div>

      {/* Page label (center) */}
      <span className="font-display font-semibold text-[15px] text-white absolute left-1/2 -translate-x-1/2 pointer-events-none">
        {label}
      </span>

      {/* Hamburger */}
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation menu"
        className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <Icon name="Menu" size={22} />
      </button>
    </header>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  active,
  onNav,
  onClose,
}: {
  open: boolean;
  active: string;
  onNav: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-70 bg-brand-navy flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-label="Admin navigation menu"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-sm bg-brand-orange inline-flex items-center justify-center shrink-0">
              <Icon name="Ticket" size={15} className="text-white" />
            </span>
            <div>
              <div className="font-display font-bold text-[15px] text-white leading-none">Tiketi</div>
              <div className="text-[10px] text-white/40 font-body mt-0.5">Admin console</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto" aria-label="Admin navigation">
          {ADMIN_NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNav(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 rounded-md text-[15px] font-semibold font-body transition-colors text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/6",
                )}
              >
                <Icon name={item.icon} size={20} className="shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer — home + sign out */}
        <div className="px-3 pb-6 pt-3 border-t border-white/10 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => { onClose(); router.push(ROUTES.HOME); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-[15px] font-semibold font-body text-white/60 hover:text-white hover:bg-white/6 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Icon name="House" size={20} className="shrink-0" />
            Home page
          </button>
          <button
            type="button"
            onClick={() => { onClose(); router.push(ROUTES.LOGIN); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-md text-[15px] font-semibold font-body text-red-400 hover:text-red-300 hover:bg-white/6 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Icon name="LogOut" size={20} className="shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  const [nav,        setNav]        = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const crumb = NAV_LABELS[nav] ?? "Overview";

  const handleNav = (id: string) => {
    setNav(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ── MOBILE (< lg) — top bar + drawer + content ── */}
      <div className="flex lg:hidden flex-col min-h-screen bg-surface-bg">
        <MobileTopBar label={crumb} onMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <MobileDrawer
          open={drawerOpen}
          active={nav}
          onNav={handleNav}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      {/* ── DESKTOP (≥ lg) — fixed sidebar + topbar + scrollable content ── */}
      <div className="hidden lg:flex h-screen overflow-hidden bg-surface-bg">
        <AdminSidebar active={nav} onNav={setNav} />
        <div className="flex flex-col flex-1 min-w-0 h-screen">
          <AdminTopbar crumb={crumb} onCrumbRoot={() => setNav("overview")} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
