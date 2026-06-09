import { Icon } from "@/components/Shared/Icon";

export function Footer() {
  return (
    <footer style={{ background: "#061a27" }} className="text-white pt-11 pb-8">
      <div className="max-w-[1120px] mx-auto px-7">
        {/* Top row */}
        <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-white/10 mb-[18px]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-[11px] mb-2.5">
              <span className="inline-flex items-center justify-center w-[30px] h-[30px] rounded-sm bg-brand-orange shrink-0">
                <Icon name="Ticket" size={16} className="text-white" />
              </span>
              <span className="font-display font-bold text-[18px] text-white">Tiketi</span>
            </div>
            <p className="text-sm text-white/60">Event Booking and Ticketing System</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-[22px]" aria-label="Footer navigation">
            <a href="/explore" className="text-sm text-white/80 hover:text-white transition-colors">
              Explore events
            </a>
            <a href="/login" className="text-sm text-white/80 hover:text-white transition-colors">
              Sign in
            </a>
            <a href="/register" className="text-sm text-white/80 hover:text-white transition-colors">
              Register
            </a>
            <button
              type="button"
              className="text-sm text-white/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
            >
              Contact
            </button>
          </nav>
        </div>

        {/* Copyright */}
        <p className="text-[13px] text-white/40">
          © 2026 Tiketi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
