"use client";

import { Icon } from "@/components/Shared/Icon";
import { Button } from "@/components/Shared/Button";

interface HeroSectionProps {
  onSignIn: () => void;
  onRegister: () => void;
  onExplore: () => void;
}

// ── HeroArt: exact port of landing.jsx → HeroArt() ──────────────────────────
// mods matrix is 17×17, cell=13px, pad=22px
// Orange scan beam at y=qr*0.46, corner brackets at all 4 corners
function HeroArt() {
  const mods = [
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
    [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  ];
  const n = mods.length;
  const cell = 13;
  const pad = 22;
  const qr = n * cell + pad * 2; // 265

  const beamY = qr * 0.46;
  const beamX = pad - 6;
  const beamW = qr - 2 * (pad - 6);

  const corners: [number, number, number, number][] = [
    [8, 8, 1, 1],
    [qr - 8, 8, -1, 1],
    [8, qr - 8, 1, -1],
    [qr - 8, qr - 8, -1, -1],
  ];

  return (
    <div
      className="hero-art w-full max-w-[380px] justify-self-center"
      style={{ filter: "drop-shadow(0 24px 50px rgba(0,0,0,0.35))" }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${qr} ${qr}`} width="100%" height="100%">
        {/* Card background */}
        <rect
          x="2"
          y="2"
          width={qr - 4}
          height={qr - 4}
          rx="14"
          fill="#fff"
          stroke="#11314a"
          strokeWidth="2"
        />

        {/* QR modules */}
        {mods.flatMap((row, r) =>
          row.map((on, c) =>
            on === 1 ? (
              <rect
                key={`${r}-${c}`}
                x={pad + c * cell}
                y={pad + r * cell}
                width={cell}
                height={cell}
                fill="#08283B"
              />
            ) : null,
          ),
        )}

        {/* Scan beam glow (gradient above line) */}
        <rect
          x={beamX}
          y={beamY - 30}
          width={beamW}
          height={30}
          fill="url(#beam)"
        />
        {/* Scan beam solid line */}
        <rect
          x={beamX}
          y={beamY}
          width={beamW}
          height={6}
          rx={3}
          fill="#FF5A00"
          opacity={0.9}
        />

        {/* Corner brackets */}
        {corners.map(([x, y, sx, sy], i) => (
          <path
            key={i}
            d={`M ${x} ${y + sy * 34} L ${x} ${y} L ${x + sx * 34} ${y}`}
            stroke="#FF5A00"
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
          />
        ))}

        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF5A00" stopOpacity={0} />
            <stop offset="1" stopColor="#FF5A00" stopOpacity={0.28} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function HeroSection({
  onSignIn,
  onRegister,
  onExplore,
}: HeroSectionProps) {
  return (
    <section
      className="text-white overflow-hidden relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
      }}
    >
      {/* Base dark layer — keeps the whole section readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(8,40,59,0.72)" }}
        aria-hidden="true"
      />
      {/* Directional overlay — left text column is near-opaque, right photo shows through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(8,40,59,0.88) 0%, rgba(8,40,59,0.55) 45%, rgba(8,40,59,0.10) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-[1120px] mx-auto px-7 py-[72px] pb-[84px] grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        {/* Copy */}
        <div className="lp-hero-copy">
          <span className="text-[12px] font-semibold tracking-[1.2px] uppercase text-brand-orange">
            Event Booking and Ticketing System
          </span>
          <h1 className="font-display font-bold text-[76px] leading-none tracking-[-2px] mt-4 max-md:text-[56px]">
            Tiketi
          </h1>
          <p className="font-display font-semibold text-[26px] leading-snug tracking-[-0.4px] mt-[18px] max-md:text-[22px]">
            Secure event ticketing for everyone
          </p>
          <p className="text-[17px] leading-relaxed text-white/72 max-w-[460px] mt-3.5">
            QR-validated tickets. Mobile money payments. Works offline. Built
            for the modern world.
          </p>
          <div className="flex flex-wrap gap-3.5 mt-8">
            <Button
              size="lg"
              onClick={onRegister}
              aria-label="Get started — create an account"
              className="gap-2"
            >
              Get started
              <Icon name="ArrowRight" size={18} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={onExplore}
              className="bg-transparent text-white border-white/40 hover:bg-white/8"
            >
              Explore events
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={onSignIn}
              className="bg-transparent text-white border-white/40 hover:bg-white/8"
            >
              Sign in
            </Button>
          </div>
        </div>

        {/* Hero art */}
        <HeroArt />
      </div>
    </section>
  );
}
