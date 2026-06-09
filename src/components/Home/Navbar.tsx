'use client';

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Shared/Icon";
import { Button } from "@/components/Shared/Button";

interface NavbarProps {
  onSignIn: () => void;
  onRegister: () => void;
  onExplore: () => void;
  /** Show "Explore Events" chip as active (used on explore page) */
  exploreActive?: boolean;
}

export function Navbar({ onSignIn, onRegister, onExplore, exploreActive = false }: NavbarProps) {
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 bg-brand-navy border-b border-white/8">
        <div className="max-w-[1120px] mx-auto px-7 h-16 flex items-center justify-between">
          {/* Brand + explore link */}
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
            {/* Explore chip — desktop only */}
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

          {/* Desktop actions */}
          <nav className="hidden md:flex items-center gap-2.5" aria-label="Primary navigation">
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
            <Button
              fullWidth
              onClick={() => { setDrawer(false); onRegister(); }}
            >
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
