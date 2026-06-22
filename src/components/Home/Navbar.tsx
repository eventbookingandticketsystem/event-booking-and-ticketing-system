'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/Shared/Icon";
import { Button } from "@/components/Shared/Button";
import { ROUTES } from "@/constants/routes";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavUser {
  name?:  string | null;
  email?: string | null;
  image?: string | null;
  role?:  string | null;
}

interface NavSession {
  user?: NavUser | null;
}

interface NavbarProps {
  onSignIn:       () => void;
  onRegister:     () => void;
  onExplore:      () => void;
  exploreActive?: boolean;
  session?:       NavSession | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dashboardRoute(role: string | null | undefined): string {
  switch (role) {
    case "ORGANIZER":  return ROUTES.ORGANIZER;
    case "GATE_AGENT": return ROUTES.AGENT;
    case "ADMIN":      return ROUTES.ADMIN;
    default:           return ROUTES.DASHBOARD;
  }
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case "ORGANIZER":  return "Organizer";
    case "GATE_AGENT": return "Gate Agent";
    case "ADMIN":      return "Admin";
    default:           return "Attendee";
  }
}

// ── Avatar — image with initials fallback ─────────────────────────────────────

function Avatar({
  name,
  image,
  size = 36,
  className = "",
}: {
  name?:      string | null;
  image?:     string | null;
  size?:      number;
  className?: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const showImage = image && !imgErr;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden select-none ${className}`}
      style={{
        width:      size,
        height:     size,
        background: showImage
          ? "transparent"
          : "linear-gradient(135deg, #FF5A00 0%, #A83900 100%)",
      }}
      aria-hidden="true"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span
          className="font-display font-bold text-white"
          style={{ fontSize: size * 0.38 }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}

// ── User dropdown menu ────────────────────────────────────────────────────────

function UserMenu({ session }: { session: NavSession }) {
  const router  = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name  = session.user?.name;
  const email = session.user?.email;
  const image = session.user?.image;
  const role  = session.user?.role as string | null | undefined;

  const isAttendee = !role || role === "ATTENDEE";

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onKey   = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick  = (e: MouseEvent)   => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-full"
      >
        <Avatar name={name} image={image} size={36} />
        <Icon
          name="ChevronDown"
          size={15}
          className={`text-white/60 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] min-w-[230px] bg-white rounded-lg shadow-pop border border-border z-50 overflow-hidden"
        >
          {/* Header — user info */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Avatar name={name} image={image} size={40} className="shrink-0" />
            <div className="min-w-0 flex-1">
              {name && (
                <p className="font-semibold text-[14px] text-[#0F1A20] leading-snug truncate">
                  {name}
                </p>
              )}
              {email && (
                <p className="text-[12px] text-[#5A6870] truncate">
                  {email}
                </p>
              )}
              <span className="inline-block mt-1 px-2 py-0.5 rounded-pill bg-brand-orange/10 text-brand-orange text-[11px] font-bold leading-none">
                {roleLabel(role)}
              </span>
            </div>
          </div>

          {/* Nav items */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); router.push(dashboardRoute(role)); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-[#0F1A20] hover:bg-[#F7F6F2] transition-colors text-left focus-visible:outline-none focus-visible:bg-[#F7F6F2]"
            >
              <Icon name="LayoutDashboard" size={15} className="text-[#5A6870] shrink-0" />
              {role === "ORGANIZER"
                ? "Organizer dashboard"
                : role === "ADMIN"
                  ? "Admin console"
                  : "My dashboard"}
            </button>

            {isAttendee && (
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); router.push(ROUTES.TICKETS); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-[#0F1A20] hover:bg-[#F7F6F2] transition-colors text-left focus-visible:outline-none focus-visible:bg-[#F7F6F2]"
              >
                <Icon name="Ticket" size={15} className="text-[#5A6870] shrink-0" />
                My tickets
              </button>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <button
              type="button"
              role="menuitem"
              onClick={async () => { setOpen(false); await signOut({ callbackUrl: "/" }); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold text-[#A32D2D] hover:bg-[#FCEBEB] transition-colors text-left focus-visible:outline-none focus-visible:bg-[#FCEBEB]"
            >
              <Icon name="LogOut" size={15} className="shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export function Navbar({
  onSignIn,
  onRegister,
  onExplore,
  exploreActive = false,
  session,
}: NavbarProps) {
  const [drawer, setDrawer] = useState(false);
  const router     = useRouter();
  const isLoggedIn = !!(session?.user);
  const user       = session?.user;

  return (
    <>
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 bg-brand-navy border-b border-white/8">
        <div className="max-w-[1120px] mx-auto px-7 h-16 flex items-center justify-between">

          {/* Brand wordmark + explore chip */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExplore}
              aria-label="Go to homepage"
              className="flex items-center gap-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
            >
              <span className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-sm bg-brand-orange shrink-0">
                <Icon name="Ticket" size={19} className="text-white" />
              </span>
              <span className="font-display font-bold text-[22px] tracking-[-0.5px] text-white">
                Tiketi
              </span>
            </button>

            <button
              type="button"
              onClick={onExplore}
              aria-current={exploreActive ? "page" : undefined}
              className={`hidden md:inline-flex items-center ml-1 px-3.5 py-1.5 rounded-pill border text-[13px] font-semibold transition-colors
                ${exploreActive
                  ? "bg-brand-orange border-brand-orange text-white"
                  : "bg-transparent border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white"
                }`}
            >
              Explore Events
            </button>
          </div>

          {/* Desktop right side */}
          <nav className="hidden md:flex items-center gap-2.5" aria-label="Primary navigation">
            {isLoggedIn ? (
              <UserMenu session={session!} />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSignIn}
                  className="bg-transparent text-white border-white/35 hover:bg-white/8"
                >
                  Sign in
                </Button>
                <Button size="sm" onClick={onRegister}>
                  Get started
                </Button>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-1 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
          >
            <Icon name="Menu" size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div
          className="fixed inset-0 z-50 bg-brand-navy/50"
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        >
          <div
            className="absolute top-0 right-0 w-[280px] max-w-[84vw] h-full bg-brand-navy p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold text-xl text-white">Tiketi</span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center w-9 h-9 rounded-sm bg-white/10 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {isLoggedIn ? (
              <>
                {/* User info row */}
                <div className="flex items-center gap-3 px-1 py-2 mb-1">
                  <Avatar name={user?.name} image={user?.image} size={40} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {user?.name ?? "User"}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {roleLabel(user?.role as string | undefined)}
                    </p>
                  </div>
                </div>
                <Button
                  fullWidth
                  onClick={() => {
                    setDrawer(false);
                    router.push(dashboardRoute(user?.role as string | undefined));
                  }}
                >
                  Go to dashboard
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => { setDrawer(false); signOut({ callbackUrl: "/" }); }}
                  className="bg-transparent text-white border-white/35 hover:bg-white/8"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button fullWidth onClick={() => { setDrawer(false); onRegister(); }}>
                  Get started
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => { setDrawer(false); onSignIn(); }}
                  className="bg-transparent text-white border-white/35 hover:bg-white/8"
                >
                  Sign in
                </Button>
              </>
            )}

            <Button
              fullWidth
              variant="ghost"
              onClick={() => { setDrawer(false); onExplore(); }}
              className="bg-transparent text-white border-white/35 hover:bg-white/8"
            >
              Explore Events
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
