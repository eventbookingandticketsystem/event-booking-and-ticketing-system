'use client';

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { type icons } from "lucide-react";
import { initials, type UserMini } from "@/components/Organizer/OrgTopbar";

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof icons;
}

const ORG_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard",    icon: "LayoutDashboard" },
  { id: "events",    label: "My Events",    icon: "CalendarDays"    },
  { id: "create",    label: "Create Event", icon: "CirclePlus"      },
  { id: "agents",    label: "Gate Agents",  icon: "Users"           },
  { id: "reports",   label: "Reports",      icon: "ChartBar"        },
];

const ORG_FOOT: NavItem[] = [
  { id: "settings", label: "Settings", icon: "Settings" },
];

interface OrgSidebarProps {
  active: string;
  onNav: (id: string) => void;
  user?: UserMini | null;
}

function NavButton({ item, active, onNav }: { item: NavItem; active: string; onNav: (id: string) => void }) {
  const isActive = active === item.id;
  return (
    <button
      type="button"
      onClick={() => onNav(item.id)}
      aria-current={isActive ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-[10px] rounded-md text-[14px] font-semibold font-body transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/60 hover:text-white hover:bg-white/6",
      )}
    >
      <Icon name={item.icon} size={18} className="shrink-0" />
      {item.label}
    </button>
  );
}

export function OrgSidebar({ active, onNav, user }: OrgSidebarProps) {
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
          <div className="text-[11px] text-white/50 mt-0.5 font-body">Organizer</div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5" aria-label="Organizer navigation">
        {ORG_NAV.map((n) => (
          <NavButton key={n.id} item={n} active={active} onNav={onNav} />
        ))}
      </nav>

      {/* Footer nav */}
      <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-white/10 pt-4">
        {/* User profile section */}
        <div className="flex items-center gap-3 px-4 py-3 mb-1">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? "User avatar"}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/20"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-brand-orange/20 text-brand-orange inline-flex items-center justify-center text-[13px] font-bold font-body shrink-0 border border-brand-orange/30"
              aria-label={user?.name ? `User avatar: ${user.name}` : "User avatar"}
            >
              {initials(user?.name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white truncate leading-tight">
              {user?.name ?? "Organizer"}
            </div>
            <div className="text-[11px] text-white/50 font-body mt-0.5">Organizer</div>
          </div>
        </div>

        {ORG_FOOT.map((n) => (
          <NavButton key={n.id} item={n} active={active} onNav={onNav} />
        ))}

        {/* Back to home */}
        <button
          type="button"
          onClick={() => router.push(ROUTES.HOME)}
          aria-label="Back to home page"
          className="flex items-center gap-3 w-full px-4 py-[10px] rounded-md text-[14px] font-semibold font-body transition-colors text-left text-white/60 hover:text-white hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Icon name="House" size={18} className="shrink-0" />
          Home page
        </button>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          aria-label="Sign out"
          className="flex items-center gap-3 w-full px-4 py-[10px] rounded-md text-[14px] font-semibold font-body transition-colors text-left text-red-400 hover:text-red-300 hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Icon name="LogOut" size={18} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
