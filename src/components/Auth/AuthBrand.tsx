import { Icon } from "@/components/Shared/Icon";

const AUTH_FEATURES = [
  {
    icon: "QrCode" as const,
    title: "QR validation",
    sub: "Forgery-proof tickets, scanned in under a second",
  },
  {
    icon: "WifiOff" as const,
    title: "Offline scanning",
    sub: "Gate agents validate without a signal, then sync",
  },
  {
    icon: "Smartphone" as const,
    title: "Mobile money",
    sub: "Pay with your preferred payment method",
  },
];

export function AuthBrand() {
  return (
    <div
      className="relative flex flex-col justify-between p-14 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(155deg, #08283B 0%, #0C2230 60%, #102a36 100%)",
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute rounded-xl"
        style={{
          width: 520,
          height: 520,
          background: "#FF5A00",
          opacity: 0.16,
          filter: "blur(90px)",
          left: -150,
          top: -180,
        }}
        aria-hidden="true"
      />

      {/* Top: logo */}
      <div className="relative">
        <div className="flex items-center gap-3.5">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-md bg-brand-orange shrink-0">
            <Icon name="Ticket" size={24} className="text-white" />
          </span>
          <span className="font-display font-bold text-[30px] tracking-[-0.8px]">
            Tiketi
          </span>
        </div>
      </div>

      {/* Middle: tagline + features */}
      <div className="relative">
        <h1 className="font-display font-semibold text-[30px] leading-[1.25] tracking-[-0.5px] max-w-[460px] mb-4">
          Every ticket verified at the gate.
        </h1>
        <p className="text-[16px] leading-relaxed text-white/70 max-w-[440px]">
          Book events worldwide, pay your way, and walk in with a QR ticket that
          works even offline.
        </p>

        <div className="flex flex-col gap-5 mt-9">
          {AUTH_FEATURES.map((feat) => (
            <div key={feat.title} className="flex items-center gap-[15px]">
              <span
                className="inline-flex items-center justify-center w-[46px] h-[46px] rounded-md shrink-0"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <Icon name={feat.icon} size={20} className="text-white" />
              </span>
              <div>
                <div className="font-display font-semibold text-[16px]">
                  {feat.title}
                </div>
                <div className="text-[13px] text-white/60 mt-0.5">{feat.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative text-[13px] text-white/32 pt-[26px]"
        style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
      >
        Tiketi · Event Booking and Ticketing System
      </div>
    </div>
  );
}
