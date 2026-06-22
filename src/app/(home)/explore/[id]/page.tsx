'use client';

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Home/Navbar";
import { Button } from "@/components/Shared/Button";
import { Icon } from "@/components/Shared/Icon";
import { AlertBanner } from "@/components/Shared/AlertBanner";
import { cn, formatSSP } from "@/lib/utils";
import { EXPLORE_POSTERS } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { useExploreEvent } from "@/lib/api/hooks/useExploreEvents";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicEventPreviewPage({ params }: PageProps) {
  const { id } = use(params);
  const router  = useRouter();
  const { data: session } = useSession();

  const { data: ev, isLoading, isError, error } = useExploreEvent(id);

  const [expanded, setExpanded] = useState(false);
  const [toast,    setToast]    = useState(false);

  const poster = ev
    ? EXPLORE_POSTERS[ev.category] ?? EXPLORE_POSTERS["Conference"]
    : EXPLORE_POSTERS["Conference"];

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  const handleBack = () => router.back();

  /**
   * Book a ticket:
   * - Logged in → go straight to booking summary
   * - Logged out → go to login, with callbackUrl pointing at the booking page
   *   so the user lands there after signing in
   */
  const handleBook = (eventId: string) => {
    if (session?.user) {
      // Already authenticated — go directly to the booking page
      router.push(ROUTES.BOOKING(eventId));
    } else {
      // Not authenticated — send to login, preserve destination
      const callbackUrl = ROUTES.BOOKING(eventId);
      router.push(`${ROUTES.LOGIN}?banner=booking&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  };

  const handleSignIn   = () => router.push(ROUTES.LOGIN);
  const handleRegister = () => router.push(ROUTES.REGISTER);
  const handleExplore  = () => router.push(ROUTES.EXPLORE);

  return (
    <div className="min-h-screen" style={{ background: "#060F18", color: "#fff" }}>
      <Navbar
        onSignIn={handleSignIn}
        onRegister={handleRegister}
        onExplore={handleExplore}
        exploreActive
        session={session}
      />

      {/* ── Loading ── */}
      {isLoading && (
        <div className="max-w-[1080px] mx-auto px-7 py-10 flex flex-col gap-6">
          <div className="w-full skeleton rounded-xl" style={{ aspectRatio: "16/9", maxHeight: 420 }} />
          <div className="grid grid-cols-[1fr_360px] gap-8 max-md:grid-cols-1">
            <div className="flex flex-col gap-4">
              <div className="h-6 w-24 skeleton rounded" />
              <div className="h-10 w-3/4 skeleton rounded" />
              <div className="h-4 w-48 skeleton rounded" />
              <div className="h-4 w-48 skeleton rounded" />
              <div className="h-4 w-48 skeleton rounded" />
            </div>
            <div className="h-64 skeleton rounded-lg" />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="max-w-[1080px] mx-auto px-7 py-10">
          <AlertBanner
            tone="danger"
            title="Could not load event"
            message={(error as Error | null)?.message ?? "This event may no longer exist."}
          />
          <button
            type="button"
            onClick={handleBack}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover"
          >
            <Icon name="ArrowLeft" size={15} />
            Back to explore
          </button>
        </div>
      )}

      {/* ── Loaded ── */}
      {!isLoading && !isError && ev && (
        <div className="max-w-[1080px] mx-auto pb-16">
          {/* Poster header 16:9 */}
          <div
            className="relative w-full overflow-hidden flex flex-col justify-end p-7"
            style={{
              background: poster,
              aspectRatio: "16/9",
              maxHeight: 420,
            }}
          >
            {/* Photo layer */}
            {ev.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ev.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="eager"
                decoding="async"
              />
            )}
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 13px)" }}
              aria-hidden="true"
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(3,9,15,0.95), rgba(3,9,15,0.2) 55%, transparent 100%)" }}
              aria-hidden="true"
            />

            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="absolute top-5 left-5 z-10 w-[42px] h-[42px] rounded-full inline-flex items-center justify-center text-white backdrop-blur-sm hover:bg-[rgba(3,9,15,0.8)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              style={{ background: "rgba(3,9,15,0.55)" }}
            >
              <Icon name="ArrowLeft" size={19} />
            </button>

            {/* Share button */}
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share event"
              className="absolute top-5 right-5 z-10 w-[42px] h-[42px] rounded-full inline-flex items-center justify-center text-white backdrop-blur-sm hover:bg-[rgba(3,9,15,0.8)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              style={{ background: "rgba(3,9,15,0.55)" }}
            >
              <Icon name="Share2" size={18} />
            </button>

            {/* Category + title */}
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[1.2px] text-brand-orange mb-2">
                {ev.category}
              </p>
              <h1
                className="font-display font-bold text-[38px] leading-[1.1] text-white max-w-[720px] max-md:text-[28px]"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
              >
                {ev.title}
              </h1>
            </div>
          </div>

          {/* Two-column content grid */}
          <div className="grid grid-cols-[1fr_360px] gap-8 px-7 pt-7 max-md:grid-cols-1">
            {/* Left: info + about */}
            <div>
              {ev.status === "happening-now" && (
                <div className="mb-[18px]">
                  <span
                    className="inline-flex items-center gap-1.5 px-[11px] py-[5px] rounded-pill text-xs font-bold text-white backdrop-blur-sm"
                    style={{ background: "rgba(26,107,60,0.85)" }}
                  >
                    <span className="relative flex h-[7px] w-[7px] shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee79f] opacity-60" />
                      <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#6ee79f]" />
                    </span>
                    Happening Now
                  </span>
                </div>
              )}

              {/* Info rows */}
              <div className="flex flex-col gap-3.5 mb-[26px]">
                <div className="flex gap-3.5 items-start">
                  <span
                    className="w-[42px] h-[42px] rounded-sm inline-flex items-center justify-center shrink-0 text-brand-orange"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <Icon name="Calendar" size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-white/30">Date &amp; time</p>
                    <p className="text-[15px] font-semibold text-white mt-0.5">
                      {ev.date} · {ev.time}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span
                    className="w-[42px] h-[42px] rounded-sm inline-flex items-center justify-center shrink-0 text-brand-orange"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <Icon name="MapPin" size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-white/30">Venue</p>
                    <p className="text-[15px] font-semibold text-white mt-0.5">
                      {ev.venue}, {ev.city}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3.5 items-start">
                  <span
                    className="w-[42px] h-[42px] rounded-sm inline-flex items-center justify-center shrink-0 text-brand-orange"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <Icon name="User" size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-white/30">Organizer</p>
                    <p className="text-[15px] font-semibold text-white mt-0.5">
                      {ev.organizer}
                    </p>
                  </div>
                </div>
              </div>

              {/* About */}
              <h3 className="font-display font-semibold text-[18px] text-white mb-2.5">
                About this event
              </h3>
              <p
                className={cn(
                  "text-[15px] leading-[1.65] text-white/50",
                  !expanded && "line-clamp-3",
                )}
              >
                {ev.about}
              </p>
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors pt-2 pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            </div>

            {/* Right: ticket tiers card */}
            <aside>
              <div
                className="rounded-lg p-[22px] sticky top-[150px]"
                style={{ background: "#0e1c29", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <h3 className="font-display font-bold text-[18px] text-white mb-4">
                  Tickets
                </h3>

                {ev.tiers.length === 0 ? (
                  <p className="text-sm text-white/40 py-3">No ticket tiers defined yet.</p>
                ) : (
                  ev.tiers.map((tier, i) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between gap-3.5 py-4"
                      style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.08)" } : undefined}
                    >
                      <div>
                        <p className="font-semibold text-[15px] text-white">{tier.name}</p>
                        <p className="text-xs text-white/30 mt-[3px]">
                          {tier.remaining.toLocaleString("en-US")} remaining
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p
                          className={cn(
                            "font-display font-bold text-[16px]",
                            tier.price === 0 ? "text-[#5fd08a]" : "text-brand-orange",
                          )}
                        >
                          {tier.price === 0 ? "Free" : formatSSP(tier.price)}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleBook(ev.id)}
                          aria-label={`Book ${tier.name} ticket`}
                        >
                          Book this ticket
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {/* Footer hint — only shown when not logged in */}
                {!session?.user && (
                  <p className="flex items-center gap-[7px] text-xs text-white/30 mt-4">
                    <Icon name="Info" size={13} />
                    Sign in to complete your booking.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 bottom-7 -translate-x-1/2 z-[400] flex items-center gap-2 px-[18px] py-[11px] rounded-pill text-sm font-semibold text-white shadow-pop"
          style={{ background: "#1a7a4a" }}
          role="status"
          aria-live="polite"
        >
          <Icon name="Check" size={16} />
          Link copied
        </div>
      )}
    </div>
  );
}
